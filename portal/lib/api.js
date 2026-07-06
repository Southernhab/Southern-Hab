// SHC Portal — Data API helpers (Firestore)
// Depends on: portal/lib/firebase-client.js (window.shcDb, window.shcStorage, window.shcFunctions)
//             portal/lib/auth.js (window.shcAuth)
//
// Client-facing functions filter by clientVisible == true.
// Staff functions query base collections with no visibility filter.
// Firestore Security Rules are the actual security boundary.
//
// Currency: Firestore stores integer cents; api.js converts to dollars for the frontend.

(function () {
  'use strict';

  var db      = window.shcDb;
  var storage = window.shcStorage;
  var fns     = window.shcFunctions;

  var FieldValue = firebase.firestore.FieldValue;

  // ── Formatting ─────────────────────────────────────────────────────────────
  function formatCurrency(valueCentsOrDollars) {
    if (valueCentsOrDollars === null || valueCentsOrDollars === undefined) return '—';
    // Values > 10000 are assumed to be cents; values <= 10000 are dollars (legacy tolerance)
    var dollars = valueCentsOrDollars > 10000 ? valueCentsOrDollars / 100 : Number(valueCentsOrDollars);
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(dollars);
  }

  function formatDate(val) {
    if (!val) return '—';
    var d;
    if (val && typeof val.toDate === 'function') { d = val.toDate(); }
    else { d = new Date(typeof val === 'string' && val.length === 10 ? val + 'T00:00:00' : val); }
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // ── Firestore helpers ──────────────────────────────────────────────────────
  function snapToArr(querySnap) {
    return querySnap.docs.map(function (d) { return { id: d.id, ...d.data() }; });
  }

  function snapToObj(docSnap) {
    if (!docSnap.exists) return null;
    return { id: docSnap.id, ...docSnap.data() };
  }

  // Convert Firestore timestamps to ISO strings recursively (shallow)
  function convertTimestamps(obj) {
    var out = {};
    Object.keys(obj).forEach(function (k) {
      var v = obj[k];
      if (v && typeof v.toDate === 'function') { out[k] = v.toDate().toISOString(); }
      else { out[k] = v; }
    });
    return out;
  }

  // Convert cents fields to dollars in a record
  function centsToDollars(obj, fields) {
    var out = Object.assign({}, obj);
    fields.forEach(function (f) {
      if (out[f] !== null && out[f] !== undefined) out[f] = out[f] / 100;
    });
    return out;
  }

  var COST_FIELDS = ['estimatedCostCents', 'approvedCostCents', 'committedCostCents', 'invoicedCostCents', 'paidCostCents'];
  var BUDGET_COST_FIELDS = ['estimatedTotalCents', 'approvedTotalCents', 'invoicedTotalCents', 'paidTotalCents'];
  var ITEM_COST_FIELDS = ['estimatedCostCents', 'approvedCostCents', 'committedCostCents', 'invoicedCostCents', 'paidCostCents', 'costShareEstimateCents'];

  function normProject(d) {
    var out = convertTimestamps(d);
    // Map cents to dollars under the old snake_case names app.js expects
    out.estimated_cost = d.estimatedCostCents != null ? d.estimatedCostCents / 100 : null;
    out.status         = d.status;
    out.name           = d.name;
    out.description    = d.description;
    out.client_notes   = d.clientNotes;
    out.client_visible = d.clientVisible;
    out.classification = d.classification;
    out.client_review_status = d.clientReviewStatus;
    out.planned_start_date   = d.plannedStartDate ? (typeof d.plannedStartDate.toDate === 'function' ? d.plannedStartDate.toDate().toISOString() : d.plannedStartDate) : null;
    return out;
  }

  function normWork(d) {
    var out = convertTimestamps(d);
    out.work_type = d.workType;
    out.completion_date = d.completionDate ? (typeof d.completionDate.toDate === 'function' ? d.completionDate.toDate().toISOString() : d.completionDate) : null;
    out.final_cost = d.finalCostCents != null ? d.finalCostCents / 100 : null;
    out.acres_or_quantity = d.acresOrQuantity;
    out.scope = d.scope;
    return out;
  }

  function normBudget(d) {
    var out = convertTimestamps(d);
    out.budget_year = d.budgetYear;
    out.name = d.name;
    out.estimated_total = d.estimatedTotalCents != null ? d.estimatedTotalCents / 100 : null;
    out.approved_total  = d.approvedTotalCents  != null ? d.approvedTotalCents  / 100 : null;
    out.invoiced_total  = d.invoicedTotalCents  != null ? d.invoicedTotalCents  / 100 : null;
    out.paid_total      = d.paidTotalCents      != null ? d.paidTotalCents      / 100 : null;
    out.client_visible_notes = d.clientVisibleNotes;
    return out;
  }

  function normBudgetItem(d) {
    var out = convertTimestamps(d);
    out.practice         = d.practice;
    out.classification   = d.classification;
    out.planned_season   = d.plannedSeason;
    out.planned_year     = d.plannedYear;
    out.estimated_cost   = d.estimatedCostCents != null ? d.estimatedCostCents / 100 : null;
    out.paid_cost        = d.paidCostCents      != null ? d.paidCostCents      / 100 : null;
    out.sort_order       = d.sortOrder;
    return out;
  }

  function normDocument(d) {
    var out = convertTimestamps(d);
    out.title = d.title;
    out.document_type = d.documentType;
    out.original_filename = d.originalFilename;
    out.document_status = d.documentStatus;
    out.client_visible = d.clientVisible;
    out.published_at = d.publishedAt ? (typeof d.publishedAt.toDate === 'function' ? d.publishedAt.toDate().toISOString() : d.publishedAt) : null;
    return out;
  }

  function normMessage(d) {
    var out = convertTimestamps(d);
    out.subject     = d.subject;
    out.category    = d.category;
    out.status      = d.status;
    out.created_at  = d.createdAt  ? (typeof d.createdAt.toDate  === 'function' ? d.createdAt.toDate().toISOString()  : d.createdAt)  : null;
    out.updated_at  = d.updatedAt  ? (typeof d.updatedAt.toDate  === 'function' ? d.updatedAt.toDate().toISOString()  : d.updatedAt)  : null;
    return out;
  }

  function normEntry(d) {
    var out = convertTimestamps(d);
    out.body        = d.body;
    out.sender_id   = d.senderId;
    out.created_at  = d.createdAt ? (typeof d.createdAt.toDate === 'function' ? d.createdAt.toDate().toISOString() : d.createdAt) : null;
    return out;
  }

  // ── Firestore serverTimestamp shorthand ────────────────────────────────────
  var now = function () { return FieldValue.serverTimestamp(); };

  // ══════════════════════════════════════════════════════════════════════════════
  // CLIENT-FACING QUERIES
  // ══════════════════════════════════════════════════════════════════════════════

  window.shcApi = {

    formatCurrency: formatCurrency,
    formatDate:     formatDate,

    // ── Properties for the current user ──────────────────────────────────────
getMyProperties: async function () {
  var clientIds = await window.shcAuth.getClientIds();

  console.log('SHC clientIds from token:', clientIds);

  if (!clientIds.length) return [];

  var all = [];

      // Firestore "in" supports up to 10 values.
      // Keep the query simple and filter/sort in JavaScript to avoid composite-index problems.
  for (var i = 0; i < clientIds.length; i += 10) {
    var batch = clientIds.slice(i, i + 10);

    var snap = await db.collection('properties')
      .where('clientId', 'in', batch)
      .get();

    all = all.concat(snapToArr(snap));
  }

  all = all
    .filter(function (p) {
      return (p.status || 'active') === 'active';
    })
    .map(convertTimestamps)
    .sort(function (a, b) {
      return String(a.name || '').localeCompare(String(b.name || ''));
    });

  console.log('SHC properties returned for client:', all.map(function (p) {
    return {
      id: p.id,
      name: p.name,
      clientId: p.clientId,
      status: p.status
    };
  }));

  return all;
},
    // ── Portal overview for one property ─────────────────────────────────────
    getPropertyOverview: async function (propertyId) {
      var propDoc = await db.collection('properties').doc(propertyId).get();
      if (!propDoc.exists) throw new Error('Property not found.');
      var p = { id: propDoc.id, ...propDoc.data() };

      var currentYear = new Date().getFullYear();

      // Active projects + awaiting review counts
      var projectsSnap = await db.collection('projects')
        .where('propertyId', '==', propertyId)
        .where('clientVisible', '==', true)
        .get();
      var projectDocs = projectsSnap.docs.map(function (d) { return d.data(); });
      var activeProjects   = projectDocs.filter(function (d) { return d.status === 'active' || d.status === 'scheduled'; }).length;
      var awaitingReview   = projectDocs.filter(function (d) { return d.clientReviewStatus === 'awaiting_review'; }).length;

      // Work completed this year
      var workSnap = await db.collection('workHistory')
        .where('propertyId', '==', propertyId)
        .where('clientVisible', '==', true)
        .get();
      var workThisYear = workSnap.docs.filter(function (d) {
        var dt = d.data().completionDate;
        if (!dt) return false;
        var date = typeof dt.toDate === 'function' ? dt.toDate() : new Date(dt);
        return date.getFullYear() === currentYear;
      }).length;

      // Current budget
      var budgetSnap = await db.collection('budgets')
        .where('propertyId', '==', propertyId)
        .where('clientVisible', '==', true)
        .orderBy('budgetYear', 'desc')
        .limit(1)
        .get();
      var budget = budgetSnap.docs[0] ? budgetSnap.docs[0].data() : null;

      var nextReviewDate = p.nextReviewDate
        ? (typeof p.nextReviewDate.toDate === 'function' ? p.nextReviewDate.toDate().toISOString() : p.nextReviewDate)
        : null;

      return {
        property_id:             propertyId,
        property_name:           p.name,
        acreage:                 p.acreage,
        county:                  p.county,
        state:                   p.state,
        management_progress_pct: p.managementProgressPct || 0,
        active_projects:         activeProjects,
        projects_awaiting_review:awaitingReview,
        work_completed_this_year:workThisYear,
        next_review_date:        nextReviewDate,
        current_year_estimated:  budget && budget.estimatedTotalCents != null ? budget.estimatedTotalCents / 100 : null,
        five_year_estimated:     p.fiveYearEstimatedCents != null ? p.fiveYearEstimatedCents / 100 : null
      };
    },

    // ── Property sections ─────────────────────────────────────────────────────
    getPropertySections: async function (propertyId) {
      var snap = await db.collection('propertySections')
        .where('propertyId', '==', propertyId)
        .orderBy('sortOrder')
        .get();
      return snapToArr(snap).map(function (d) {
        return {
          id: d.id, name: d.name, acres: d.acres, habitatType: d.habitatType,
          currentCondition: d.currentCondition, desiredCondition: d.desiredCondition,
          managementStage: d.managementStage, progressPercent: d.progressPercent,
          primaryObjectives: d.primaryObjectives, targetSpecies: d.targetSpecies,
          limitingFactors: d.limitingFactors, recommendedNextAction: d.recommendedNextAction,
          clientVisibleNotes: d.clientVisibleNotes,
          // map to snake_case for app.js compatibility
          current_condition: d.currentCondition, desired_condition: d.desiredCondition,
          management_stage: d.managementStage, progress_percent: d.progressPercent,
          primary_objectives: d.primaryObjectives, target_species: d.targetSpecies,
          limiting_factors: d.limitingFactors, recommended_next_action: d.recommendedNextAction,
          client_visible_notes: d.clientVisibleNotes
        };
      });
    },

    // ── Projects ──────────────────────────────────────────────────────────────
    getProjects: async function (propertyId, opts) {
      var q = db.collection('projects')
        .where('propertyId', '==', propertyId)
        .where('clientVisible', '==', true);
      if (opts && opts.status) q = q.where('status', '==', opts.status);
      q = q.orderBy('plannedStartDate', 'desc');
      var snap = await q.get();
      return snapToArr(snap).map(normProject);
    },

    // ── Submit a project action (client preliminary approval, defer, etc.) ─────
    submitProjectAction: async function (projectId, actionType, comments) {
      var user = window.shcFirebaseAuth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      var validActions = ['preliminary_approval', 'defer', 'request_proposal', 'question'];
      if (!validActions.includes(actionType)) throw new Error('Invalid action type.');

      // Find the clientUser record for the current user
      var cuSnap = await db.collection('clientUsers').where('userId', '==', user.uid).where('active', '==', true).limit(1).get();
      var clientUserId = cuSnap.docs[0] ? cuSnap.docs[0].id : null;

      // Read project to get clientId
      var projDoc = await db.collection('projects').doc(projectId).get();
      if (!projDoc.exists) throw new Error('Project not found.');

      await db.collection('projectActions').add({
        projectId:     projectId,
        clientId:      projDoc.data().clientId,
        clientUserId:  clientUserId,
        userId:        user.uid,
        actionType:    actionType,
        comments:      comments || null,
        createdAt:     now()
      });

      // Update project clientReviewStatus
      await db.collection('projects').doc(projectId).update({
        clientReviewStatus: actionType,
        updatedAt: now()
      });
    },

    // ── Work history ──────────────────────────────────────────────────────────
    getWorkHistory: async function (propertyId, opts) {
      var q = db.collection('workHistory')
        .where('propertyId', '==', propertyId)
        .where('clientVisible', '==', true);
      if (opts && opts.sectionId) q = q.where('propertySectionId', '==', opts.sectionId);
      q = q.orderBy('completionDate', 'desc');
      var snap = await q.get();
      return snapToArr(snap).map(normWork);
    },

    // ── Wildlife surveys ──────────────────────────────────────────────────────
    getWildlifeSurveys: async function (propertyId) {
      var snap = await db.collection('wildlifeSurveys')
        .where('propertyId', '==', propertyId)
        .where('clientVisible', '==', true)
        .orderBy('surveyDate', 'desc')
        .get();
      return snapToArr(snap).map(function (d) {
        return {
          id: d.id, survey_type: d.surveyType, survey_date: formatDate(d.surveyDate),
          professional_interpretation: d.professionalInterpretation
        };
      });
    },

    // ── Harvest records ───────────────────────────────────────────────────────
    getHarvestRecords: async function (propertyId) {
      var snap = await db.collection('harvestRecords')
        .where('propertyId', '==', propertyId)
        .where('clientVisible', '==', true)
        .orderBy('harvestDate', 'desc')
        .get();
      return snapToArr(snap).map(function (d) {
        return {
          id: d.id, species: d.species, harvest_date: d.harvestDate,
          sex: d.sex, age_class: d.ageClass, weight: d.weight
        };
      });
    },

    // ── Budgets ───────────────────────────────────────────────────────────────
    getBudgets: async function (propertyId) {
      var snap = await db.collection('budgets')
        .where('propertyId', '==', propertyId)
        .where('clientVisible', '==', true)
        .orderBy('budgetYear', 'desc')
        .get();
      return snapToArr(snap).map(normBudget);
    },

    getBudgetItems: async function (budgetId) {
      var snap = await db.collection('budgetItems')
        .where('budgetId', '==', budgetId)
        .orderBy('sortOrder')
        .get();
      return snapToArr(snap).map(normBudgetItem);
    },

    // ── Documents ─────────────────────────────────────────────────────────────
    getDocuments: async function (clientId, opts) {
      var q = db.collection('documents')
        .where('clientId', '==', clientId)
        .where('clientVisible', '==', true)
        .where('documentStatus', '==', 'published');
      if (opts && opts.propertyId) q = q.where('propertyId', '==', opts.propertyId);
      q = q.orderBy('publishedAt', 'desc');
      var snap = await q.get();
      return snapToArr(snap).map(normDocument);
    },

    // Request a signed download URL for a document (via Cloud Function)
    getDocumentUrl: async function (documentId) {
      var docSnap = await db.collection('documents').doc(documentId).get();
      if (!docSnap.exists) throw new Error('Document not found.');
      var storagePath = docSnap.data().storagePath;
      if (!storagePath) throw new Error('Document has no storage path.');

      var getUrl = fns.httpsCallable('getSignedFileUrl');
      var result = await getUrl({ documentId: documentId, storagePath: storagePath });
      return result.data.url;
    },

    // ── ArcGIS maps ───────────────────────────────────────────────────────────
    getMaps: async function (propertyId) {
      var snap = await db.collection('arcgisMaps')
        .where('propertyId', '==', propertyId)
        .where('clientVisible', '==', true)
        .where('active', '==', true)
        .get();
      return snapToArr(snap).map(function (d) {
        return {
          id: d.id, title: d.title, description: d.description,
          embed_url: d.embedUrl, arcgis_webmap_url: d.arcgisWebMapUrl,
          arcgis_experience_url: d.arcgisExperienceUrl
        };
      });
    },

    // ── Messages ──────────────────────────────────────────────────────────────
    getMessages: async function (clientId) {
      var snap = await db.collection('messages')
        .where('clientId', '==', clientId)
        .where('clientVisible', '==', true)
        .orderBy('updatedAt', 'desc')
        .get();
      return snapToArr(snap).map(normMessage);
    },

    getMessageEntries: async function (messageId) {
      var snap = await db.collection('messageEntries')
        .where('messageId', '==', messageId)
        .where('internalOnly', '==', false)
        .orderBy('createdAt', 'asc')
        .get();
      return snapToArr(snap).map(normEntry);
    },

    sendMessage: async function (payload) {
      var user = window.shcFirebaseAuth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      var msgRef = await db.collection('messages').add({
        clientId:     payload.clientId,
        propertyId:   payload.propertyId || null,
        subject:      payload.subject,
        category:     payload.category || 'general',
        status:       'open',
        createdBy:    user.uid,
        clientVisible: true,
        createdAt:    now(),
        updatedAt:    now()
      });

      await db.collection('messageEntries').add({
        messageId:    msgRef.id,
        clientId:     payload.clientId,
        senderId:     user.uid,
        body:         payload.body,
        internalOnly: false,
        createdAt:    now()
      });

      return { id: msgRef.id };
    },

    replyToMessage: async function (messageId, body) {
      var user = window.shcFirebaseAuth.currentUser;
      if (!user) throw new Error('Not authenticated.');

      var msgDoc = await db.collection('messages').doc(messageId).get();
      if (!msgDoc.exists) throw new Error('Message not found.');

      await db.collection('messageEntries').add({
        messageId:    messageId,
        clientId:     msgDoc.data().clientId,
        senderId:     user.uid,
        body:         body,
        internalOnly: false,
        createdAt:    now()
      });

      await db.collection('messages').doc(messageId).update({
        updatedAt: now(),
        status: 'open'
      });
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    getUnreadNotifications: async function () {
      var user = window.shcFirebaseAuth.currentUser;
      if (!user) return [];
      var snap = await db.collection('notifications')
        .where('userId', '==', user.uid)
        .where('readAt', '==', null)
        .orderBy('createdAt', 'desc')
        .limit(25)
        .get();
      return snapToArr(snap).map(convertTimestamps);
    },

    markNotificationRead: async function (notificationId) {
      await db.collection('notifications').doc(notificationId).update({ readAt: now() });
    },

    // ── Account / profile ─────────────────────────────────────────────────────
    updateProfile: async function (fields) {
      var user = window.shcFirebaseAuth.currentUser;
      if (!user) throw new Error('Not authenticated.');
      var allowedFields = { firstName: fields.first_name || fields.firstName, lastName: fields.last_name || fields.lastName, phone: fields.phone };
      Object.keys(allowedFields).forEach(function (k) { if (!allowedFields[k]) delete allowedFields[k]; });
      await db.collection('users').doc(user.uid).update({ ...allowedFields, updatedAt: now() });
    },

    // ══════════════════════════════════════════════════════════════════════════
    // STAFF-FACING QUERIES
    // ══════════════════════════════════════════════════════════════════════════

    staff: {

      // ── Dashboard counts ────────────────────────────────────────────────────
      getDashboardCounts: async function () {
        var [clients, properties, projects, inquiries, accessReqs] = await Promise.all([
          db.collection('clients').where('status', '==', 'active').get(),
          db.collection('properties').where('status', '==', 'active').get(),
          db.collection('projects').get(),
          db.collection('inquiries').where('status', '==', 'new').get(),
          db.collection('accessRequests').where('status', '==', 'pending').get()
        ]);
        var awaitingReview = projects.docs.filter(function (d) { return d.data().clientReviewStatus === 'awaiting_review'; }).length;
        return {
          clients:       clients.size,
          properties:    properties.size,
          awaitingReview:awaitingReview,
          inquiries:     inquiries.size,
          accessRequests:accessReqs.size
        };
      },

      // ── Clients ─────────────────────────────────────────────────────────────
      getAllClients: async function () {
        var snap = await db.collection('clients').orderBy('displayName').get();
        return snapToArr(snap).map(function (d) {
          return { ...d, display_name: d.displayName, primary_contact_name: d.primaryContactName };
        });
      },

      createClient: async function (data) {
        var user = window.shcFirebaseAuth.currentUser;
        var ref = await db.collection('clients').add({
          legalName:           data.legal_name || data.legalName || '',
          displayName:         data.display_name || data.displayName || '',
          primaryContactName:  data.primary_contact_name || data.primaryContactName || '',
          email:               data.email || '',
          phone:               data.phone || '',
          city:                data.city || '',
          state:               data.state || '',
          status:              data.status || 'active',
          createdAt:           now(),
          createdBy:           user ? user.uid : null,
          updatedAt:           now()
        });
        return { id: ref.id };
      },

      updateClient: async function (id, data) {
        var user = window.shcFirebaseAuth.currentUser;
        var update = {};
        if (data.legal_name    || data.legalName)           update.legalName          = data.legal_name    || data.legalName;
        if (data.display_name  || data.displayName)         update.displayName        = data.display_name  || data.displayName;
        if (data.primary_contact_name || data.primaryContactName) update.primaryContactName = data.primary_contact_name || data.primaryContactName;
        if (data.email !== undefined)  update.email  = data.email;
        if (data.phone !== undefined)  update.phone  = data.phone;
        if (data.city  !== undefined)  update.city   = data.city;
        if (data.state !== undefined)  update.state  = data.state;
        if (data.status!== undefined)  update.status = data.status;
        update.updatedAt  = now();
        update.updatedBy  = user ? user.uid : null;
        await db.collection('clients').doc(id).update(update);
      },

      // ── Properties ──────────────────────────────────────────────────────────
      getAllProperties: async function () {
        var snap = await db.collection('properties').orderBy('name').get();
        var props = snapToArr(snap);
        // Enrich with client displayName
        var clientIds = [...new Set(props.map(function (p) { return p.clientId; }).filter(Boolean))];
        var clientMap = {};
        if (clientIds.length) {
          var clientSnap = await db.collection('clients').where(firebase.firestore.FieldPath.documentId(), 'in', clientIds.slice(0, 10)).get();
          clientSnap.docs.forEach(function (d) { clientMap[d.id] = d.data(); });
        }
        return props.map(function (p) {
          return {
            ...p,
            clients: clientMap[p.clientId] ? { display_name: clientMap[p.clientId].displayName } : null,
            next_review_date: p.nextReviewDate ? (typeof p.nextReviewDate.toDate === 'function' ? p.nextReviewDate.toDate().toISOString() : p.nextReviewDate) : null
          };
        });
      },

      createProperty: async function (data) {
        var user = window.shcFirebaseAuth.currentUser;
        var ref = await db.collection('properties').add({
          clientId:              data.client_id || data.clientId || '',
          name:                  data.name || '',
          acreage:               data.acreage ? parseFloat(data.acreage) : null,
          county:                data.county || '',
          state:                 data.state || '',
          physicalAddress:       data.physical_address || data.physicalAddress || '',
          nextReviewDate:        data.next_review_date || data.nextReviewDate || null,
          primaryObjectives:     data.primary_objectives || data.primaryObjectives || '',
          clientManagementSummary: data.management_summary_client || data.clientManagementSummary || '',
          status:                data.status || 'active',
          createdAt:             now(),
          createdBy:             user ? user.uid : null,
          updatedAt:             now()
        });
        if (data.ownership_notes_internal || data.internalOwnershipNotes) {
          await db.collection('propertiesInternal').doc(ref.id).set({
            internalOwnershipNotes: data.ownership_notes_internal || data.internalOwnershipNotes || '',
            createdAt: now()
          });
        }
        return { id: ref.id };
      },

      updateProperty: async function (id, data) {
        var user = window.shcFirebaseAuth.currentUser;
        var update = {};
        if (data.name !== undefined)             update.name             = data.name;
        if (data.acreage !== undefined)          update.acreage          = data.acreage ? parseFloat(data.acreage) : null;
        if (data.county !== undefined)           update.county           = data.county;
        if (data.state !== undefined)            update.state            = data.state;
        if (data.client_id !== undefined)        update.clientId         = data.client_id;
        if (data.next_review_date !== undefined) update.nextReviewDate   = data.next_review_date || null;
        if (data.primary_objectives !== undefined) update.primaryObjectives = data.primary_objectives;
        if (data.management_summary_client !== undefined) update.clientManagementSummary = data.management_summary_client;
        if (data.status !== undefined)           update.status           = data.status;
        update.updatedAt = now();
        update.updatedBy = user ? user.uid : null;
        await db.collection('properties').doc(id).update(update);
        if (data.ownership_notes_internal !== undefined) {
          await db.collection('propertiesInternal').doc(id).set(
            { internalOwnershipNotes: data.ownership_notes_internal || '', updatedAt: now() },
            { merge: true }
          );
        }
      },

      // ── Projects (staff view) ────────────────────────────────────────────────
      getAllProjects: async function (propertyId) {
        var q = db.collection('projects').orderBy('createdAt', 'desc');
        if (propertyId) q = q.where('propertyId', '==', propertyId);
        var snap = await q.get();
        var projects = snapToArr(snap);
        // Enrich with property name
        var propIds = [...new Set(projects.map(function (p) { return p.propertyId; }).filter(Boolean))];
        var propMap = {};
        if (propIds.length) {
          var propSnap = await db.collection('properties').where(firebase.firestore.FieldPath.documentId(), 'in', propIds.slice(0, 10)).get();
          propSnap.docs.forEach(function (d) { propMap[d.id] = d.data(); });
        }
        return projects.map(function (p) {
          return {
            ...normProject(p),
            properties: propMap[p.propertyId] ? { name: propMap[p.propertyId].name } : null
          };
        });
      },

      upsertProject: async function (data) {
        var user = window.shcFirebaseAuth.currentUser;
        if (data.id) {
          var update = { ...data, updatedAt: now(), updatedBy: user ? user.uid : null };
          delete update.id;
          await db.collection('projects').doc(data.id).update(update);
          return { id: data.id };
        } else {
          var ref = await db.collection('projects').add({
            ...data, createdAt: now(), createdBy: user ? user.uid : null, updatedAt: now()
          });
          return { id: ref.id };
        }
      },

      // ── Inquiries ────────────────────────────────────────────────────────────
      getInquiries: async function () {
        var snap = await db.collection('inquiries').orderBy('createdAt', 'desc').get();
        return snapToArr(snap).map(function (d) {
          return {
            ...convertTimestamps(d),
            inquiry_type: d.inquiryType,
            created_at: d.createdAt ? (typeof d.createdAt.toDate === 'function' ? d.createdAt.toDate().toISOString() : d.createdAt) : null
          };
        });
      },

      updateInquiryStatus: async function (id, status) {
        await db.collection('inquiries').doc(id).update({ status: status, updatedAt: now() });
      },

      // ── Access requests ──────────────────────────────────────────────────────
      getAccessRequests: async function () {
        var snap = await db.collection('accessRequests').orderBy('createdAt', 'desc').get();
        return snapToArr(snap).map(function (d) {
          return {
            ...convertTimestamps(d),
            client_name: d.clientName, property_name: d.propertyName,
            created_at: d.createdAt ? (typeof d.createdAt.toDate === 'function' ? d.createdAt.toDate().toISOString() : d.createdAt) : null
          };
        });
      },

      updateAccessRequestStatus: async function (id, status) {
        var user = window.shcFirebaseAuth.currentUser;
        await db.collection('accessRequests').doc(id).update({
          status: status,
          reviewedBy: user ? user.uid : null,
          reviewedAt: now(),
          updatedAt: now()
        });
      },

      // ── Invite client user (via Cloud Function) ───────────────────────────────
      inviteClientUser: async function (email, clientId, accessLevel) {
        var invite = fns.httpsCallable('inviteClientUser');
        var result = await invite({ email: email, clientId: clientId, accessLevel: accessLevel });
        return result.data;
      },

      // ── Disable / enable user (via Cloud Function) ────────────────────────────
      disableUser: async function (uid) {
        var disable = fns.httpsCallable('disableUser');
        var result = await disable({ uid: uid });
        return result.data;
      },

      enableUser: async function (uid) {
        var enable = fns.httpsCallable('enableUser');
        var result = await enable({ uid: uid });
        return result.data;
      },

      // ── Assign role (via Cloud Function) ─────────────────────────────────────
      assignRole: async function (uid, role) {
        var assign = fns.httpsCallable('assignRole');
        var result = await assign({ uid: uid, role: role });
        return result.data;
            // ── Documents / Reports for admin property workspace ──────────────────
      getDocumentsForProperty: async function (propertyId) {
        var snap = await db.collection('documents')
          .where('propertyId', '==', propertyId)
          .orderBy('publishedAt', 'desc')
          .get();

        return snapToArr(snap).map(normDocument);
      },

      uploadDocumentForProperty: async function (payload) {
        var user = window.shcFirebaseAuth.currentUser;
        if (!user) throw new Error('Not authenticated.');
        if (!payload.file) throw new Error('Choose a file to upload.');
        if (!payload.clientId) throw new Error('Missing clientId.');
        if (!payload.propertyId) throw new Error('Missing propertyId.');

        var originalName = payload.file.name || 'uploaded-file';
        var safeName = originalName
          .toLowerCase()
          .replace(/[^a-z0-9.\-_]+/g, '-')
          .replace(/^-+|-+$/g, '');

        var storagePath = 'documents/' +
          payload.clientId + '/' +
          payload.propertyId + '/' +
          Date.now() + '-' + safeName;

        await storage.ref().child(storagePath).put(payload.file, {
          contentType: payload.file.type || 'application/octet-stream',
          customMetadata: {
            clientId: payload.clientId,
            propertyId: payload.propertyId,
            uploadedBy: user.uid
          }
        });

        var docData = {
          clientId: payload.clientId,
          propertyId: payload.propertyId,
          title: payload.title || originalName,
          documentType: payload.documentType || 'Report',
          originalFilename: originalName,
          storagePath: storagePath,
          contentType: payload.file.type || 'application/octet-stream',
          documentStatus: payload.documentStatus || 'published',
          clientVisible: payload.clientVisible === true,
          publishedAt: payload.documentStatus === 'draft' ? null : now(),
          createdAt: now(),
          createdBy: user.uid,
          updatedAt: now(),
          updatedBy: user.uid
        };

        var ref = await db.collection('documents').add(docData);

        return {
          id: ref.id,
          storagePath: storagePath
        };
      },

      updateDocument: async function (id, data) {
        var user = window.shcFirebaseAuth.currentUser;
        if (!user) throw new Error('Not authenticated.');

        var update = {
          updatedAt: now(),
          updatedBy: user.uid
        };

        if (data.title !== undefined) update.title = data.title;
        if (data.documentType !== undefined) update.documentType = data.documentType;
        if (data.documentStatus !== undefined) update.documentStatus = data.documentStatus;
        if (data.clientVisible !== undefined) update.clientVisible = data.clientVisible;

        if (data.documentStatus === 'published') {
          update.publishedAt = now();
        }

        await db.collection('documents').doc(id).update(update);
      },

      getAdminDocumentUrl: async function (documentId) {
        return await window.shcApi.getDocumentUrl(documentId);
      },
      // ── Documents / Reports for admin property workspace ──────────────────
      getDocumentsForProperty: async function (propertyId) {
        var snap = await db.collection('documents')
          .where('propertyId', '==', propertyId)
          .orderBy('publishedAt', 'desc')
          .get();

        return snapToArr(snap).map(normDocument);
      },

      uploadDocumentForProperty: async function (payload) {
        var user = window.shcFirebaseAuth.currentUser;
        if (!user) throw new Error('Not authenticated.');
        if (!payload.file) throw new Error('Choose a file to upload.');
        if (!payload.clientId) throw new Error('Missing clientId.');
        if (!payload.propertyId) throw new Error('Missing propertyId.');

        var originalName = payload.file.name || 'uploaded-file';
        var safeName = originalName
          .toLowerCase()
          .replace(/[^a-z0-9.\-_]+/g, '-')
          .replace(/^-+|-+$/g, '');

        var storagePath = 'documents/' +
          payload.clientId + '/' +
          payload.propertyId + '/' +
          Date.now() + '-' + safeName;

        await storage.ref().child(storagePath).put(payload.file, {
          contentType: payload.file.type || 'application/octet-stream',
          customMetadata: {
            clientId: payload.clientId,
            propertyId: payload.propertyId,
            uploadedBy: user.uid
          }
        });

        var status = payload.documentStatus || 'published';

        var docData = {
          clientId: payload.clientId,
          propertyId: payload.propertyId,
          title: payload.title || originalName,
          documentType: payload.documentType || 'Report',
          originalFilename: originalName,
          storagePath: storagePath,
          contentType: payload.file.type || 'application/octet-stream',
          documentStatus: status,
          clientVisible: payload.clientVisible === true,
          publishedAt: status === 'draft' ? null : now(),
          createdAt: now(),
          createdBy: user.uid,
          updatedAt: now(),
          updatedBy: user.uid
        };

        var ref = await db.collection('documents').add(docData);

        return {
          id: ref.id,
          storagePath: storagePath
        };
      },

      updateDocument: async function (id, data) {
        var user = window.shcFirebaseAuth.currentUser;
        if (!user) throw new Error('Not authenticated.');

        var update = {
          updatedAt: now(),
          updatedBy: user.uid
        };

        if (data.title !== undefined) update.title = data.title;
        if (data.documentType !== undefined) update.documentType = data.documentType;
        if (data.documentStatus !== undefined) update.documentStatus = data.documentStatus;
        if (data.clientVisible !== undefined) update.clientVisible = data.clientVisible;

        if (data.documentStatus === 'published') {
          update.publishedAt = now();
        }

        await db.collection('documents').doc(id).update(update);
      },

      getAdminDocumentUrl: async function (documentId) {
        return await window.shcApi.getDocumentUrl(documentId);
      },
      // ── Audit log ────────────────────────────────────────────────────────────
      getAuditLog: async function (opts) {
        var q = db.collection('auditLogs').orderBy('createdAt', 'desc').limit(200);
        if (opts && opts.collection) q = q.where('collection', '==', opts.collection);
        var snap = await q.get();
        return snapToArr(snap).map(function (d) {
          return {
            ...convertTimestamps(d),
            table_name: d.collection,
            record_id: d.docId,
            user_id: d.userId,
            action: d.action,
            created_at: d.createdAt ? (typeof d.createdAt.toDate === 'function' ? d.createdAt.toDate().toISOString() : d.createdAt) : null
          };
        });
      },

      // ── Publish / unpublish (via Cloud Function) ──────────────────────────────
      publishRecord: async function (collection, docId) {
        var fn = fns.httpsCallable('publishRecord');
        return (await fn({ collection: collection, docId: docId })).data;
      },

      unpublishRecord: async function (collection, docId) {
        var fn = fns.httpsCallable('unpublishRecord');
        return (await fn({ collection: collection, docId: docId })).data;
      }

    }

  };

})();
