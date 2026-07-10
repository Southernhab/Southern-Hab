// SHC Portal — staff document/report API extension.
// Loaded after portal/lib/api.js and before admin/admin.js.
(function () {
  'use strict';

  var api = window.shcApi;
  var db = window.shcDb;
  var storage = window.shcStorage;
  var fbAuth = window.shcFirebaseAuth;
  var FieldValue = firebase.firestore.FieldValue;

  if (!api || !api.staff || !db || !storage || !fbAuth) {
    console.error('SHC document API could not initialize because a required dependency is missing.');
    return;
  }

  var ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'text/csv',
    'application/json',
    'application/vnd.google-earth.kml+xml',
    'application/vnd.google-earth.kmz',
    'application/zip',
    'application/octet-stream'
  ];

  function toIso(value) {
    if (!value) return null;
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    var d = new Date(value);
    return isNaN(d.getTime()) ? null : d.toISOString();
  }

  function normalize(doc) {
    var d = doc.data();
    return Object.assign({ id: doc.id }, d, {
      document_type: d.documentType || '',
      original_filename: d.originalFilename || '',
      document_status: d.documentStatus || 'draft',
      client_visible: d.clientVisible === true,
      published_at: toIso(d.publishedAt),
      created_at: toIso(d.createdAt)
    });
  }

  function timeValue(record) {
    var raw = record.published_at || record.created_at || '';
    var value = raw ? Date.parse(raw) : 0;
    return isNaN(value) ? 0 : value;
  }

  api.staff.getDocumentsForProperty = async function (propertyId) {
    if (!propertyId) return [];
    var snap = await db.collection('documents')
      .where('propertyId', '==', propertyId)
      .get();

    return snap.docs.map(normalize).sort(function (a, b) {
      return timeValue(b) - timeValue(a);
    });
  };

  api.staff.uploadDocumentForProperty = async function (payload) {
    var user = fbAuth.currentUser;
    if (!user) throw new Error('Not authenticated.');
    if (!payload || !payload.file) throw new Error('Choose a file to upload.');
    if (!payload.clientId) throw new Error('Missing client assignment.');
    if (!payload.propertyId) throw new Error('Missing property assignment.');

    var contentType = payload.file.type || 'application/octet-stream';
    if (ALLOWED_MIME_TYPES.indexOf(contentType) === -1) {
      throw new Error('This file type is not permitted. Convert Word documents to PDF before uploading.');
    }
    if (payload.file.size > 50 * 1024 * 1024) {
      throw new Error('The file exceeds the 50 MB upload limit.');
    }

    var originalName = payload.file.name || 'uploaded-file';
    var safeName = originalName.toLowerCase()
      .replace(/[^a-z0-9.\-_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'uploaded-file';
    var status = payload.documentStatus || 'published';

    // This path matches storage.rules: clients/{clientId}/documents/{filename}
    var path = 'clients/' + payload.clientId + '/documents/' + Date.now() + '-' + safeName;

    await storage.ref().child(path).put(payload.file, {
      contentType: contentType,
      customMetadata: {
        clientId: payload.clientId,
        propertyId: payload.propertyId,
        uploadedBy: user.uid
      }
    });

    var ref = await db.collection('documents').add({
      clientId: payload.clientId,
      propertyId: payload.propertyId,
      title: payload.title || originalName,
      documentType: payload.documentType || 'Report',
      originalFilename: originalName,
      storagePath: path,
      contentType: contentType,
      documentStatus: status,
      clientVisible: payload.clientVisible === true && status === 'published',
      publishedAt: status === 'published' ? FieldValue.serverTimestamp() : null,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: user.uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: user.uid
    });

    return { id: ref.id, storagePath: path };
  };

  api.staff.updateDocument = async function (documentId, changes) {
    var user = fbAuth.currentUser;
    if (!user) throw new Error('Not authenticated.');
    if (!documentId) throw new Error('Missing document ID.');

    var update = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: user.uid
    };
    changes = changes || {};

    if (changes.title !== undefined) update.title = changes.title;
    if (changes.documentType !== undefined) update.documentType = changes.documentType;
    if (changes.documentStatus !== undefined) update.documentStatus = changes.documentStatus;
    if (changes.clientVisible !== undefined) update.clientVisible = changes.clientVisible === true;

    if (changes.documentStatus === 'published') {
      update.publishedAt = FieldValue.serverTimestamp();
    } else if (changes.documentStatus === 'draft' || changes.documentStatus === 'archived') {
      update.clientVisible = false;
    }

    await db.collection('documents').doc(documentId).update(update);
  };

  api.staff.getAdminDocumentUrl = async function (documentId) {
    return api.getDocumentUrl(documentId);
  };
})();
