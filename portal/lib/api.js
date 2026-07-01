// SHC Portal — Data API helpers
// Depends on: portal/lib/supabase-client.js, portal/lib/auth.js
//
// Client-facing functions query the v_client_* views; internal fields are omitted
// at the database level. Staff functions query the base tables directly.
// RLS on base tables is the actual security boundary.

(function () {
  'use strict';

  var sb = window.shcSupabase;

  // ── Currency formatting ───────────────────────────────────────────────────
  function formatCurrency(value) {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(Number(value));
  }

  // ── Date formatting ───────────────────────────────────────────────────────
  function formatDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  window.shcApi = {

    formatCurrency: formatCurrency,
    formatDate:     formatDate,

    // ─────────────────────────────────────────────────────────────────────────
    // CLIENT-FACING QUERIES (use v_client_* views — internal fields excluded)
    // ─────────────────────────────────────────────────────────────────────────

    // ── Properties for the current user ──────────────────────────────────────
    getMyProperties: async function () {
      var r = await sb.from('v_client_properties').select('*').eq('status','active').order('name');
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Portal overview for one property ─────────────────────────────────────
    getPropertyOverview: async function (propertyId) {
      var r = await sb.from('v_portal_overview').select('*').eq('property_id', propertyId).single();
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Property sections ─────────────────────────────────────────────────────
    getPropertySections: async function (propertyId) {
      var r = await sb.from('v_client_property_sections')
        .select('*').eq('property_id', propertyId).order('sort_order');
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Projects ─────────────────────────────────────────────────────────────
    getProjects: async function (propertyId, opts) {
      var q = sb.from('v_client_projects')
        .select('*').eq('property_id', propertyId);
      if (opts && opts.status) q = q.eq('status', opts.status);
      q = q.order('planned_start_date', { ascending: false });
      var r = await q;
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Submit a project action ───────────────────────────────────────────────
    submitProjectAction: async function (projectId, actionType, comments) {
      var session = await sb.auth.getSession();
      var userId = session.data.session && session.data.session.user.id;
      var r = await sb.from('project_actions').insert({
        project_id:     projectId,
        client_user_id: userId,
        action_type:    actionType,
        comments:       comments || null
      });
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Work history ──────────────────────────────────────────────────────────
    getWorkHistory: async function (propertyId, opts) {
      var q = sb.from('v_client_work_history')
        .select('*').eq('property_id', propertyId);
      if (opts && opts.sectionId) q = q.eq('property_section_id', opts.sectionId);
      q = q.order('completion_date', { ascending: false });
      var r = await q;
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Wildlife surveys ──────────────────────────────────────────────────────
    getWildlifeSurveys: async function (propertyId) {
      var r = await sb.from('v_client_wildlife_surveys')
        .select('*').eq('property_id', propertyId).order('survey_date', { ascending: false });
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Harvest records ───────────────────────────────────────────────────────
    getHarvestRecords: async function (propertyId) {
      var r = await sb.from('harvest_records')
        .select('id,property_id,property_section_id,species,harvest_date,sex,age_class,weight,antler_measurements_json,notes')
        .eq('property_id', propertyId)
        .eq('client_visible', true)
        .order('harvest_date', { ascending: false });
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Monitoring records ────────────────────────────────────────────────────
    getMonitoringRecords: async function (propertyId) {
      var r = await sb.from('v_client_monitoring_records')
        .select('*').eq('property_id', propertyId).order('observation_date', { ascending: false });
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Budgets ───────────────────────────────────────────────────────────────
    getBudgets: async function (propertyId) {
      var r = await sb.from('v_client_budgets')
        .select('*').eq('property_id', propertyId).order('budget_year', { ascending: false });
      if (r.error) throw r.error;
      return r.data;
    },

    getBudgetItems: async function (budgetId) {
      var r = await sb.from('budget_items')
        .select('id,budget_id,project_id,property_section_id,practice,classification,planned_year,planned_season,estimated_cost,approved_cost,committed_cost,invoiced_cost,paid_cost,cost_share_estimate,notes,sort_order')
        .eq('budget_id', budgetId).order('sort_order');
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Documents ─────────────────────────────────────────────────────────────
    getDocuments: async function (clientId, opts) {
      var q = sb.from('v_client_documents')
        .select('*').eq('client_id', clientId);
      if (opts && opts.propertyId) q = q.eq('property_id', opts.propertyId);
      if (opts && opts.documentType) q = q.eq('document_type', opts.documentType);
      q = q.order('published_at', { ascending: false });
      var r = await q;
      if (r.error) throw r.error;
      return r.data;
    },

    // Request a signed download URL for a document
    getDocumentUrl: async function (documentId) {
      var r = await sb.rpc('get_document_download_url', { p_document_id: documentId });
      if (r.error) throw r.error;
      // Create a short-lived signed URL from storage
      var storagePath = r.data;
      var bucket = storagePath.startsWith('reports/') ? 'reports' : 'client-documents';
      var path = storagePath.replace(bucket + '/', '');
      var signed = await sb.storage.from(bucket).createSignedUrl(path, 3600);
      if (signed.error) throw signed.error;
      return signed.data.signedUrl;
    },

    // ── Photographs ───────────────────────────────────────────────────────────
    getPhotographs: async function (propertyId, opts) {
      var q = sb.from('photographs')
        .select('id,property_id,property_section_id,category,caption,taken_at,storage_path,client_visible,latitude,longitude')
        .eq('property_id', propertyId)
        .eq('client_visible', true);
      if (opts && opts.sectionId) q = q.eq('property_section_id', opts.sectionId);
      q = q.order('taken_at', { ascending: false });
      var r = await q;
      if (r.error) throw r.error;
      return r.data;
    },

    getPhotoUrl: async function (storagePath) {
      var path = storagePath.replace('property-photos/', '');
      var signed = await sb.storage.from('property-photos').createSignedUrl(path, 3600);
      if (signed.error) throw signed.error;
      return signed.data.signedUrl;
    },

    // ── ArcGIS maps ───────────────────────────────────────────────────────────
    getMaps: async function (propertyId) {
      var r = await sb.from('arcgis_maps')
        .select('id,property_id,property_section_id,title,description,embed_url,arcgis_webmap_url,arcgis_experience_url,layer_configuration_json,thumbnail_storage_path,client_visible,active')
        .eq('property_id', propertyId)
        .eq('client_visible', true)
        .eq('active', true);
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Messages ──────────────────────────────────────────────────────────────
    getMessages: async function (clientId) {
      var r = await sb.from('v_client_messages')
        .select('*').eq('client_id', clientId).order('updated_at', { ascending: false });
      if (r.error) throw r.error;
      return r.data;
    },

    getMessageEntries: async function (messageId) {
      var r = await sb.from('v_client_message_entries')
        .select('*').eq('message_id', messageId).order('created_at');
      if (r.error) throw r.error;
      return r.data;
    },

    // Start a new message thread
    sendMessage: async function (payload) {
      // payload: { clientId, propertyId?, subject, category, body }
      var session = await sb.auth.getSession();
      var userId = session.data.session.user.id;
      var msgResult = await sb.from('messages').insert({
        client_id:     payload.clientId,
        property_id:   payload.propertyId || null,
        subject:       payload.subject,
        category:      payload.category || 'general',
        status:        'open',
        created_by:    userId,
        client_visible: true
      }).select('id').single();
      if (msgResult.error) throw msgResult.error;
      var entryResult = await sb.from('message_entries').insert({
        message_id:    msgResult.data.id,
        sender_id:     userId,
        body:          payload.body,
        internal_only: false
      });
      if (entryResult.error) throw entryResult.error;
      return msgResult.data;
    },

    replyToMessage: async function (messageId, body) {
      var session = await sb.auth.getSession();
      var userId = session.data.session.user.id;
      var r = await sb.from('message_entries').insert({
        message_id:    messageId,
        sender_id:     userId,
        body:          body,
        internal_only: false
      });
      if (r.error) throw r.error;
      return r.data;
    },

    // ── Notifications ─────────────────────────────────────────────────────────
    getUnreadNotifications: async function () {
      var r = await sb.from('notifications')
        .select('*').is('read_at', null).order('created_at', { ascending: false }).limit(25);
      if (r.error) throw r.error;
      return r.data;
    },

    markNotificationRead: async function (notificationId) {
      var r = await sb.from('notifications')
        .update({ read_at: new Date().toISOString() }).eq('id', notificationId);
      if (r.error) throw r.error;
    },

    // ── Account / profile updates ─────────────────────────────────────────────
    updateProfile: async function (fields) {
      var session = await sb.auth.getSession();
      var userId = session.data.session.user.id;
      var r = await sb.from('profiles').update(fields).eq('id', userId);
      if (r.error) throw r.error;
      return r.data;
    },

    // ─────────────────────────────────────────────────────────────────────────
    // STAFF-FACING QUERIES (base tables, all columns)
    // ─────────────────────────────────────────────────────────────────────────

    staff: {

      // Clients
      getAllClients: async function () {
        var r = await sb.from('clients').select('*').order('display_name');
        if (r.error) throw r.error;
        return r.data;
      },

      createClient: async function (data) {
        var r = await sb.from('clients').insert(data).select().single();
        if (r.error) throw r.error;
        return r.data;
      },

      updateClient: async function (id, data) {
        var r = await sb.from('clients').update(data).eq('id', id);
        if (r.error) throw r.error;
      },

      // Properties
      getAllProperties: async function () {
        var r = await sb.from('properties').select('*, clients(display_name)').order('name');
        if (r.error) throw r.error;
        return r.data;
      },

      createProperty: async function (data) {
        var r = await sb.from('properties').insert(data).select().single();
        if (r.error) throw r.error;
        return r.data;
      },

      updateProperty: async function (id, data) {
        var r = await sb.from('properties').update(data).eq('id', id);
        if (r.error) throw r.error;
      },

      // Property sections
      getSections: async function (propertyId) {
        var r = await sb.from('property_sections')
          .select('*').eq('property_id', propertyId).order('sort_order');
        if (r.error) throw r.error;
        return r.data;
      },

      upsertSection: async function (data) {
        var r = await sb.from('property_sections').upsert(data).select().single();
        if (r.error) throw r.error;
        return r.data;
      },

      // Projects
      getAllProjects: async function (propertyId) {
        var q = sb.from('projects').select('*, properties(name)').order('created_at', { ascending: false });
        if (propertyId) q = q.eq('property_id', propertyId);
        var r = await q;
        if (r.error) throw r.error;
        return r.data;
      },

      upsertProject: async function (data) {
        var r = await sb.from('projects').upsert(data).select().single();
        if (r.error) throw r.error;
        return r.data;
      },

      // Invite a client user (staff creates Supabase invite via Edge Function)
      inviteClientUser: async function (email, clientId, accessLevel) {
        var r = await sb.functions.invoke('invite-client-user', {
          body: { email: email, client_id: clientId, access_level: accessLevel }
        });
        if (r.error) throw r.error;
        return r.data;
      },

      // Inquiries
      getInquiries: async function () {
        var r = await sb.from('inquiries').select('*').order('created_at', { ascending: false });
        if (r.error) throw r.error;
        return r.data;
      },

      // Access requests
      getAccessRequests: async function () {
        var r = await sb.from('access_requests').select('*').order('created_at', { ascending: false });
        if (r.error) throw r.error;
        return r.data;
      },

      // Audit log
      getAuditLog: async function (opts) {
        var q = sb.from('audit_log').select('*, profiles(first_name,last_name,email)').order('created_at', { ascending: false });
        if (opts && opts.tableName) q = q.eq('table_name', opts.tableName);
        if (opts && opts.recordId)  q = q.eq('record_id',  opts.recordId);
        q = q.limit(200);
        var r = await q;
        if (r.error) throw r.error;
        return r.data;
      }

    }

  };

})();
