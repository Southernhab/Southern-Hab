'use strict';

const functions = require('firebase-functions');
const admin     = require('firebase-admin');

admin.initializeApp();

const db      = admin.firestore();
const storage = admin.storage();
const auth    = admin.auth();

// ── Configuration from Firebase environment ─────────────────────────────────
function cfg(key) {
  try { return functions.config().shc[key]; } catch (e) { return process.env[key] || ''; }
}

const EMAIL_PROVIDER_API_KEY  = process.env.EMAIL_PROVIDER_API_KEY  || cfg('email_provider_api_key');
const NOTIFICATION_EMAIL      = process.env.NOTIFICATION_EMAIL       || cfg('notification_email');
const EMAIL_FROM              = process.env.EMAIL_FROM               || cfg('email_from');
const PUBLIC_SITE_URL         = process.env.PUBLIC_SITE_URL          || cfg('public_site_url') || 'https://southernhabitatconsulting.com';

// ── Allowed CORS origins ─────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://southernhabitatconsulting.com',
  'https://www.southernhabitatconsulting.com',
  /\.netlify\.app$/,
  /\.netlify\.live$/
];

function setCorsHeaders(req, res) {
  var origin = req.headers.origin || '';
  var allowed = ALLOWED_ORIGINS.some(function (pattern) {
    return typeof pattern === 'string' ? origin === pattern : pattern.test(origin);
  });
  if (allowed) {
    res.set('Access-Control-Allow-Origin', origin);
  } else {
    res.set('Access-Control-Allow-Origin', PUBLIC_SITE_URL);
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
}

// ── Rate limiting (Firestore-backed per IP) ──────────────────────────────────
async function isRateLimited(ip, limitPerWindow, windowSeconds) {
  if (!ip) return false;
  var safeIp = ip.replace(/[^a-zA-Z0-9.:_-]/g, '_').slice(0, 45);
  var ref = db.collection('_rateLimit').doc(safeIp);
  var now = Date.now();
  var windowStart = now - windowSeconds * 1000;

  try {
    return await db.runTransaction(async function (t) {
      var doc = await t.get(ref);
      var data = doc.exists ? doc.data() : { count: 0, firstRequest: now };

      if (data.firstRequest < windowStart) {
        t.set(ref, { count: 1, firstRequest: now });
        return false;
      }
      if (data.count >= limitPerWindow) return true;
      t.update(ref, { count: admin.firestore.FieldValue.increment(1) });
      return false;
    });
  } catch (e) {
    console.error('Rate limit check error:', e);
    return false;
  }
}

// ── Input sanitization ────────────────────────────────────────────────────────
function sanitize(str, maxLen) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/<[^>]*>/g, '').slice(0, maxLen || 1000);
}

// ── Spam keywords ─────────────────────────────────────────────────────────────
var SPAM_PATTERNS = [/\bviagra\b/i, /\bseo\b.*\bservices\b/i, /\bclick here\b/i, /\bfree money\b/i, /\bbit\.ly\b/i];

function isSpam(text) {
  return SPAM_PATTERNS.some(function (p) { return p.test(text); });
}

// ── Audit log writer ──────────────────────────────────────────────────────────
async function writeAudit(action, collection, docId, userId, changes) {
  try {
    await db.collection('auditLogs').add({
      action: action,
      collection: collection,
      docId: docId || null,
      userId: userId || null,
      changes: changes || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

// ── Email notification (non-fatal) ────────────────────────────────────────────
async function sendEmailNotification(subject, text) {
  if (!EMAIL_PROVIDER_API_KEY || !NOTIFICATION_EMAIL) {
    console.log('Email not configured. Skipping notification:', subject);
    return;
  }
  try {
    var response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + EMAIL_PROVIDER_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM || 'noreply@southernhabitatconsulting.com',
        to: NOTIFICATION_EMAIL,
        subject: subject,
        text: text
      })
    });
    if (!response.ok) {
      var body = await response.text();
      console.error('Email provider error:', response.status, body);
    }
  } catch (e) {
    console.error('Email send failed:', e.message);
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// PUBLIC HTTP FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * submitInquiry — public HTTPS endpoint for the contact page forms.
 * Handles both private-land and industrial/municipal inquiries.
 */
exports.submitInquiry = functions.https.onRequest(async function (req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }

  var ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();

  // Rate limit: 5 submissions per hour per IP
  if (await isRateLimited(ip, 5, 3600)) {
    res.status(429).json({ ok: false, error: 'Too many submissions. Please try again later.' });
    return;
  }

  var body = req.body || {};

  // Honeypot: reject if bot-field is filled
  if (body['bot-field'] || body.botField) {
    res.status(200).json({ ok: true }); // Silently accept to not reveal honeypot
    return;
  }

  var name          = sanitize(body.name, 120);
  var email         = sanitize(body.email, 120);
  var phone         = sanitize(body.phone, 40);
  var organization  = sanitize(body.organization, 200);
  var location      = sanitize(body.property_location || body.location, 300);
  var acreage       = sanitize(body.acreage || body.quantity, 80);
  var message       = sanitize(body.message || body.details, 3000);
  var inquiryType   = ['private_land', 'industrial_municipal'].includes(body.inquiry_type) ? body.inquiry_type : 'general';

  // Required fields
  if (!name || !email || !message) {
    res.status(400).json({ ok: false, error: 'Name, email, and message are required.' });
    return;
  }

  // Basic email format check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: 'A valid email address is required.' });
    return;
  }

  // Spam check
  if (isSpam(name + ' ' + message)) {
    res.status(400).json({ ok: false, error: 'Your submission was flagged as spam. If this is an error, call us directly.' });
    return;
  }

  var record = {
    inquiryType: inquiryType,
    name: name,
    email: email,
    phone: phone,
    organization: organization,
    propertyLocation: location,
    acreage: acreage,
    message: message,
    status: 'new',
    sourcePage: sanitize(body.source_page, 100) || '/contact/',
    ipAddress: ip,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('inquiries').add(record);

  sendEmailNotification(
    'New SHC Inquiry — ' + (inquiryType === 'industrial_municipal' ? 'Industrial/Municipal' : 'Private Land'),
    'Name: ' + name + '\nEmail: ' + email + '\nPhone: ' + phone + '\nType: ' + inquiryType + '\nLocation: ' + location + '\nMessage: ' + message
  );

  res.status(200).json({ ok: true });
});

/**
 * requestAccess — public HTTPS endpoint for the portal access request form.
 */
exports.requestAccess = functions.https.onRequest(async function (req, res) {
  setCorsHeaders(req, res);

  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'Method not allowed' }); return; }

  var ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();

  if (await isRateLimited(ip, 3, 3600)) {
    res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
    return;
  }

  var body = req.body || {};

  if (body['bot-field']) {
    res.status(200).json({ ok: true });
    return;
  }

  var name         = sanitize(body.name, 120);
  var email        = sanitize(body.email, 120);
  var clientName   = sanitize(body.client_name, 200);
  var propertyName = sanitize(body.property_name, 200);
  var message      = sanitize(body.message, 1000);

  if (!name || !email) {
    res.status(400).json({ ok: false, error: 'Name and email are required.' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: 'A valid email address is required.' });
    return;
  }

  var record = {
    name: name,
    email: email,
    clientName: clientName,
    propertyName: propertyName,
    message: message,
    status: 'pending',
    ipAddress: ip,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  };

  await db.collection('accessRequests').add(record);

  sendEmailNotification(
    'New SHC Portal Access Request',
    'Name: ' + name + '\nEmail: ' + email + '\nClient: ' + clientName + '\nProperty: ' + propertyName + '\nMessage: ' + message
  );

  res.status(200).json({ ok: true });
});

// ════════════════════════════════════════════════════════════════════════════════
// CALLABLE FUNCTIONS (require Firebase Auth)
// ════════════════════════════════════════════════════════════════════════════════

/**
 * inviteClientUser — staff_admin+ creates a portal invitation.
 * Creates or re-invites a Firebase Auth user, assigns custom claims,
 * creates clientUsers and users records, and sends a password-reset email.
 */
exports.inviteClientUser = functions.https.onCall(async function (data, context) {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

  var callerRole = (context.auth.token && context.auth.token.role) || '';
  if (!['super_admin', 'staff_admin'].includes(callerRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Staff administrator role required.');
  }

  var email       = sanitize(data.email, 120);
  var clientId    = sanitize(data.clientId, 80);
  var accessLevel = ['client_owner', 'client_viewer'].includes(data.accessLevel) ? data.accessLevel : 'client_owner';
  var firstName   = sanitize(data.firstName || '', 80);
  var lastName    = sanitize(data.lastName  || '', 80);

  if (!email || !clientId) {
    throw new functions.https.HttpsError('invalid-argument', 'Email and clientId are required.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid email address.');
  }

  // Verify client exists
  var clientDoc = await db.collection('clients').doc(clientId).get();
  if (!clientDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Client not found.');
  }

  var userRecord;
  var isNew = false;

  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({
        email: email,
        emailVerified: false,
        displayName: (firstName + ' ' + lastName).trim() || undefined,
        disabled: false
      });
      isNew = true;
    } else {
      throw e;
    }
  }

  var uid = userRecord.uid;

  // Build updated clientIds list (user may already have other clients)
  var existingClaims = userRecord.customClaims || {};
  var existingClientIds = Array.isArray(existingClaims.clientIds) ? existingClaims.clientIds : [];
  var clientIds = Array.from(new Set([...existingClientIds, clientId]));

  // Set custom claims — role determined by access level
  var role = accessLevel === 'client_owner' ? 'client_owner' : 'client_viewer';
  await auth.setCustomUserClaims(uid, { role: role, clientIds: clientIds });

  // Upsert users/{uid}
  var now = admin.firestore.FieldValue.serverTimestamp();
  await db.collection('users').doc(uid).set({
    email: email,
    firstName: firstName,
    lastName: lastName,
    role: role,
    clientIds: clientIds,
    active: true,
    updatedAt: now,
    ...(isNew && { createdAt: now, createdBy: context.auth.uid })
  }, { merge: true });

  // Create clientUsers record
  var cuQuery = await db.collection('clientUsers')
    .where('userId', '==', uid)
    .where('clientId', '==', clientId)
    .limit(1).get();

  if (cuQuery.empty) {
    await db.collection('clientUsers').add({
      userId: uid,
      clientId: clientId,
      accessLevel: accessLevel,
      active: true,
      invitedAt: now,
      acceptedAt: null,
      invitedBy: context.auth.uid,
      createdAt: now
    });
  } else {
    await cuQuery.docs[0].ref.update({ accessLevel: accessLevel, active: true, updatedAt: now });
  }

  // Generate password-reset link (acts as invitation email)
  var resetLink = await auth.generatePasswordResetLink(email, {
    url: PUBLIC_SITE_URL + '/portal/'
  });

  await sendEmailNotification(
    'Your SHC Landowner Portal invitation',
    'You have been invited to the SHC Landowner Portal.\n\nClick the link below to set your password and sign in:\n' + resetLink + '\n\nThis link expires in 24 hours.\n\nIf you did not expect this invitation, disregard this email.'
  );

  await writeAudit('INVITE', 'users', uid, context.auth.uid, { email: email, clientId: clientId, accessLevel: accessLevel });

  return { ok: true, uid: uid, isNew: isNew };
});

/**
 * assignRole — super_admin only. Sets a Firebase custom claims role on any user.
 */
exports.assignRole = functions.https.onCall(async function (data, context) {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

  var callerRole = (context.auth.token && context.auth.token.role) || '';
  if (callerRole !== 'super_admin') {
    throw new functions.https.HttpsError('permission-denied', 'super_admin role required.');
  }

  var targetUid = sanitize(data.uid, 128);
  var newRole   = data.role;
  var validRoles = ['super_admin', 'staff_admin', 'field_staff', 'client_owner', 'client_viewer'];

  if (!targetUid) throw new functions.https.HttpsError('invalid-argument', 'uid is required.');
  if (!validRoles.includes(newRole)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid role. Must be one of: ' + validRoles.join(', '));
  }

  var targetRecord = await auth.getUser(targetUid);
  var existingClaims = targetRecord.customClaims || {};

  await auth.setCustomUserClaims(targetUid, { ...existingClaims, role: newRole });
  await db.collection('users').doc(targetUid).update({
    role: newRole,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: context.auth.uid
  });

  await writeAudit('ROLE_CHANGE', 'users', targetUid, context.auth.uid, { newRole: newRole, prevRole: existingClaims.role });

  return { ok: true };
});

/**
 * disableUser — admin only. Disables a Firebase Auth account and marks it inactive.
 */
exports.disableUser = functions.https.onCall(async function (data, context) {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

  var callerRole = (context.auth.token && context.auth.token.role) || '';
  if (!['super_admin', 'staff_admin'].includes(callerRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Administrator role required.');
  }

  var targetUid = sanitize(data.uid, 128);
  if (!targetUid) throw new functions.https.HttpsError('invalid-argument', 'uid is required.');
  if (targetUid === context.auth.uid) {
    throw new functions.https.HttpsError('invalid-argument', 'You cannot disable your own account.');
  }

  await auth.updateUser(targetUid, { disabled: true });
  await db.collection('users').doc(targetUid).update({
    active: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: context.auth.uid
  });

  await writeAudit('DISABLE', 'users', targetUid, context.auth.uid, {});
  return { ok: true };
});

/**
 * enableUser — admin only. Re-enables a previously disabled account.
 */
exports.enableUser = functions.https.onCall(async function (data, context) {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

  var callerRole = (context.auth.token && context.auth.token.role) || '';
  if (!['super_admin', 'staff_admin'].includes(callerRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Administrator role required.');
  }

  var targetUid = sanitize(data.uid, 128);
  if (!targetUid) throw new functions.https.HttpsError('invalid-argument', 'uid is required.');

  await auth.updateUser(targetUid, { disabled: false });
  await db.collection('users').doc(targetUid).update({
    active: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: context.auth.uid
  });

  await writeAudit('ENABLE', 'users', targetUid, context.auth.uid, {});
  return { ok: true };
});

/**
 * getSignedFileUrl — authenticated. Returns a short-lived signed URL for a
 * Storage file the caller is authorized to access.
 */
exports.getSignedFileUrl = functions.https.onCall(async function (data, context) {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

  var storagePath = sanitize(data.storagePath, 500);
  if (!storagePath) throw new functions.https.HttpsError('invalid-argument', 'storagePath is required.');

  // Verify the document exists and caller has access
  var docId = data.documentId;
  if (docId) {
    var docSnap = await db.collection('documents').doc(docId).get();
    if (!docSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Document not found.');
    }
    var docData = docSnap.data();
    var claims = context.auth.token || {};
    var role = claims.role || '';
    var isStaff = ['super_admin', 'staff_admin', 'field_staff'].includes(role);
    var callerClientIds = Array.isArray(claims.clientIds) ? claims.clientIds : [];
    var clientCanRead = callerClientIds.includes(docData.clientId) &&
      docData.clientVisible === true &&
      docData.documentStatus === 'published';

    if (!isStaff && !clientCanRead) {
      throw new functions.https.HttpsError('permission-denied', 'You do not have access to this document.');
    }
  }

  var file = storage.bucket().file(storagePath);
  var [exists] = await file.exists();
  if (!exists) throw new functions.https.HttpsError('not-found', 'File not found in storage.');

  var [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000  // 1 hour
  });

  return { ok: true, url: url };
});

/**
 * publishRecord — staff only. Flips clientVisible to true and sets publishedAt.
 * Supported collections: documents, projects, budgets, arcgisMaps, wildlifeSurveys,
 *   harvestRecords, workHistory, monitoringRecords, photographs
 */
exports.publishRecord = functions.https.onCall(async function (data, context) {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

  var callerRole = (context.auth.token && context.auth.token.role) || '';
  if (!['super_admin', 'staff_admin'].includes(callerRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Administrator role required.');
  }

  var allowed = ['documents', 'projects', 'budgets', 'arcgisMaps', 'wildlifeSurveys',
                 'harvestRecords', 'workHistory', 'monitoringRecords', 'photographs'];
  var collection = data.collection;
  var docId = sanitize(data.docId, 128);

  if (!allowed.includes(collection)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid collection.');
  }
  if (!docId) throw new functions.https.HttpsError('invalid-argument', 'docId is required.');

  var updates = {
    clientVisible: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: context.auth.uid
  };
  if (collection === 'documents') {
    updates.documentStatus = 'published';
    updates.publishedAt = admin.firestore.FieldValue.serverTimestamp();
  }

  await db.collection(collection).doc(docId).update(updates);
  await writeAudit('PUBLISH', collection, docId, context.auth.uid, {});
  return { ok: true };
});

/**
 * unpublishRecord — staff only. Sets clientVisible to false.
 */
exports.unpublishRecord = functions.https.onCall(async function (data, context) {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');

  var callerRole = (context.auth.token && context.auth.token.role) || '';
  if (!['super_admin', 'staff_admin'].includes(callerRole)) {
    throw new functions.https.HttpsError('permission-denied', 'Administrator role required.');
  }

  var docId = sanitize(data.docId, 128);
  var collection = data.collection;
  if (!docId || !collection) throw new functions.https.HttpsError('invalid-argument', 'collection and docId required.');

  var updates = {
    clientVisible: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: context.auth.uid
  };
  if (collection === 'documents') updates.documentStatus = 'internal';

  await db.collection(collection).doc(docId).update(updates);
  await writeAudit('UNPUBLISH', collection, docId, context.auth.uid, {});
  return { ok: true };
});
