// SHC Administration — Staff SPA
// Depends on: firebase-client.js, auth.js, api.js (loaded in admin/index.html)

(function () {
  'use strict';

  var db  = window.shcDb;
  var api = window.shcApi;

  var state = { profile: null };

  var SECTIONS = ['dashboard','clients','properties','projects','inquiries','access','users','audit'];

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  async function init() {
    var auth = await window.shcAuth.requireStaff();
    if (!auth) return;
    state.profile = auth.profile;

    var firstName = state.profile.first_name || state.profile.email;
    document.getElementById('sb-staff-name').innerHTML = firstName + ' <span class="admin-badge">Staff</span>';
    document.getElementById('topbar-staff').textContent = firstName;

    setupSidebar();
    setupSignOut();
    document.getElementById('admin-shell').classList.add('ready');

    routeFromHash();
    window.addEventListener('hashchange', routeFromHash);
  }

  // ── Routing ───────────────────────────────────────────────────────────────
  function routeFromHash() {
    var hash = window.location.hash.replace('#','').split('?')[0];
    var section = SECTIONS.indexOf(hash) !== -1 ? hash : 'dashboard';
    document.querySelectorAll('.nav-link').forEach(function (a) {
      a.classList.toggle('active', a.dataset.section === section);
    });
    document.getElementById('admin-section-title').textContent = capFirst(section);
    renderSection(section);
  }

  function capFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g,' ');
  }

  function renderSection(section) {
    switch (section) {
      case 'dashboard':  renderDashboard();  break;
      case 'clients':    renderClients();    break;
      case 'properties': renderProperties(); break;
      case 'projects':   renderProjects();   break;
      case 'inquiries':  renderInquiries();  break;
      case 'access':     renderAccess();     break;
      case 'users':      renderUsers();      break;
      case 'audit':      renderAudit();      break;
      default:           renderDashboard();
    }
  }

  // ── Utilities ─────────────────────────────────────────────────────────────
  function setContent(html) { document.getElementById('admin-content').innerHTML = html; }
  function loading() { setContent('<div class="content-loading">Loading\u2026</div>'); }
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }
  function errBox(msg) { return '<div style="background:#fdf0f0;border:1px solid #e8a0a0;color:#7a2020;padding:12px 16px;border-radius:4px;font-size:13px;margin-bottom:16px">' + msg + '</div>'; }
  function successBox(msg) { return '<div style="background:#f0fdf4;border:1px solid #86efac;color:#14532d;padding:12px 16px;border-radius:4px;font-size:13px;margin-bottom:16px">' + msg + '</div>'; }
  function formatCurrency(v) { return api.formatCurrency(v); }
  function formatDate(d) { return api.formatDate(d); }

  function chip(label, color) {
    var bg = { green:'#dcfce7', blue:'#dbeafe', gold:'#fef3c7', red:'#fee2e2', gray:'#f3f4f6' };
    var fg = { green:'#14532d', blue:'#1e40af', gold:'#78350f', red:'#7f1d1d', gray:'#374151' };
    var c = color || 'gray';
    return '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;background:' + (bg[c]||bg.gray) + ';color:' + (fg[c]||fg.gray) + '">' + esc(label) + '</span>';
  }

  function statusColor(s) {
    return { active:'green', complete:'green', resolved:'green', new:'blue', open:'blue', pending:'gold', approved:'green', denied:'red', cancelled:'red', deferred:'gray', archived:'gray' }[s] || 'gray';
  }

  // ── Sidebar & Sign Out ────────────────────────────────────────────────────
  function setupSidebar() {
    var sidebar = document.getElementById('portal-sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    var menuBtn = document.querySelector('.topbar-menu-btn');
    if (!sidebar || !menuBtn) return;
    function open() { sidebar.classList.add('open'); if (overlay) overlay.classList.add('visible'); menuBtn.setAttribute('aria-expanded','true'); menuBtn.textContent='\u2715'; }
    function close() { sidebar.classList.remove('open'); if (overlay) overlay.classList.remove('visible'); menuBtn.setAttribute('aria-expanded','false'); menuBtn.textContent='\u2630'; }
    menuBtn.addEventListener('click', function () { sidebar.classList.contains('open') ? close() : open(); });
    if (overlay) overlay.addEventListener('click', close);
  }

  function setupSignOut() {
    var link = document.getElementById('admin-sign-out');
    if (link) link.addEventListener('click', function (e) { e.preventDefault(); window.shcAuth.signOut(); });
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  async function renderDashboard() {
    loading();
    try {
      var counts = await api.staff.getDashboardCounts();
      var clientCount   = counts.clients;
      var propCount     = counts.properties;
      var awaitingCount = counts.awaitingReview;
      var inquiryCount  = counts.inquiries;
      var accessCount   = counts.accessRequests;

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading"><h1>Administration Dashboard</h1>' +
          '<p class="page-sub">SHC Staff Area &mdash; Internal use only. Client-visible content is controlled through publish/approval steps.</p></div>' +
          '<div class="alert alert-warning" style="margin-bottom:20px"><strong>Internal/client boundary:</strong> Internal notes, draft material, and unpublished records are never returned to client portal routes. Only explicitly published content is client-visible. Verify publish status before assuming a client can see a record.</div>' +
          '<div class="metric-row" style="margin-bottom:24px">' +
            mc('Active Clients', clientCount, 'with portal records') +
            mc('Properties Under Management', propCount, '') +
            mc('Awaiting Client Review', awaitingCount, 'projects pending decision') +
            mc('New Inquiries', inquiryCount + (accessCount ? ' / ' + accessCount : ''), inquiryCount + ' website, ' + accessCount + ' access requests') +
          '</div>' +
          '<div class="two-col">' +
            '<div>' +
              navPanel('Client &amp; Property Management', [
                { label: 'Clients',           sub: 'Manage client accounts, contacts, and portal access',      count: clientCount, href: '#clients' },
                { label: 'Properties',        sub: 'Property records, acreage, objectives, sections',          count: propCount,   href: '#properties' },
                { label: 'Planned Projects',  sub: 'Projects, cost estimates, client review status',           count: null,        href: '#projects' }
              ]) +
              navPanel('Inquiries &amp; Access', [
                { label: 'Website Inquiries', sub: 'Private land and industrial form submissions',             count: inquiryCount, href: '#inquiries' },
                { label: 'Access Requests',   sub: 'Portal access requests awaiting staff review',            count: accessCount,  href: '#access' },
                { label: 'Users &amp; Access',sub: 'Portal accounts, invitations, and permission levels',     count: null,         href: '#users' }
              ]) +
            '</div>' +
            '<div>' +
              navPanel('System', [
                { label: 'Audit Log', sub: 'Full audit trail of data changes (super_admin)', count: null, href: '#audit' }
              ]) +
            '</div>' +
          '</div>' +
        '</div>'
      );
    } catch (e) {
      setContent('<div class="portal-page">' + errBox('Dashboard load failed: ' + e.message) + '</div>');
    }
  }

  function mc(label, value, sub) {
    return '<div class="metric-card"><div class="metric-label">' + label + '</div><div class="metric-value">' + value + '</div><div class="metric-sub">' + sub + '</div></div>';
  }

  function navPanel(heading, items) {
    return '<div class="panel" style="margin-bottom:16px"><div class="panel-header"><h2>' + heading + '</h2></div><div class="panel-body-p">' +
      items.map(function (item) {
        return '<div class="admin-card"><div><div class="admin-card-title">' + item.label + '</div><div class="admin-card-sub">' + item.sub + '</div></div>' +
          '<div style="text-align:right">' + (item.count !== null ? '<div class="admin-count">' + item.count + '</div>' : '') +
          '<a href="' + item.href + '" class="btn btn-ghost btn-sm" style="margin-top:6px">Manage &rarr;</a></div></div>';
      }).join('') +
    '</div></div>';
  }

  // ── CLIENTS ───────────────────────────────────────────────────────────────
  async function renderClients() {
    loading();
    try {
      var result = await api.staff.getAllClients();
      var rows = result.map(function (c) {
        return '<tr><td>' + esc(c.display_name) + '</td><td>' + esc(c.primary_contact_name || '—') + '</td>' +
          '<td>' + esc(c.email || '—') + '</td><td>' + esc(c.city || '') + (c.state ? ', ' + esc(c.state) : '') + '</td>' +
          '<td>' + chip(c.status, statusColor(c.status)) + '</td>' +
          '<td><button class="btn btn-ghost btn-sm" data-client-edit="' + c.id + '">Edit</button></td></tr>';
      }).join('');

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading"><h1>Clients</h1><button class="btn" id="new-client-btn" style="background:var(--forest);color:#fff;border:none;padding:.55rem 1.1rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">+ New Client</button></div>' +
          '<div id="client-form-wrap" style="display:none"></div>' +
          '<div class="panel"><table class="data-table"><thead><tr><th>Display Name</th><th>Contact</th><th>Email</th><th>Location</th><th>Status</th><th></th></tr></thead>' +
          '<tbody>' + (rows || '<tr><td colspan="6" style="text-align:center;color:var(--moss)">No clients yet.</td></tr>') + '</tbody></table></div>' +
        '</div>'
      );

      document.getElementById('new-client-btn').addEventListener('click', function () { showClientForm(null); });
      document.querySelectorAll('[data-client-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () { showClientEdit(btn.dataset.clientEdit, result); });
      });
    } catch (e) {
      setContent('<div class="portal-page">' + errBox('Could not load clients: ' + e.message) + '</div>');
    }
  }

  function showClientForm(client) {
    var wrap = document.getElementById('client-form-wrap');
    if (!wrap) return;
    var isEdit = !!client;
    wrap.style.display = '';
    wrap.innerHTML = '<div class="panel" style="margin-bottom:20px"><div class="panel-header"><h2>' + (isEdit ? 'Edit Client' : 'New Client') + '</h2>' +
      '<button class="btn btn-ghost btn-sm" id="cancel-client-form">Cancel</button></div><div class="panel-body-p">' +
      '<form id="client-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        adminField('Legal Name',    'legal_name',           (client && client.legal_name) || '',    'required') +
        adminField('Display Name',  'display_name',         (client && client.display_name) || '',  'required') +
        adminField('Contact Name',  'primary_contact_name', (client && client.primary_contact_name) || '') +
        adminField('Email',         'email',                (client && client.email) || '', 'type=email') +
        adminField('Phone',         'phone',                (client && client.phone) || '') +
        adminField('City',          'city',                 (client && client.city) || '') +
        '<div style="grid-column:1/-1">' +
          '<label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Status</label>' +
          '<select name="status" style="border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' +
            ['active','inactive','archived'].map(function (s) { return '<option value="' + s + '"' + ((client && client.status === s) ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
          '</select>' +
        '</div>' +
        '<div style="grid-column:1/-1">' +
          '<div id="client-form-msg" style="display:none;font-size:12.5px;margin-bottom:8px"></div>' +
          '<button type="submit" class="btn" style="background:var(--forest);color:#fff;border:none;padding:.6rem 1.2rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">' + (isEdit ? 'Save Changes' : 'Create Client') + '</button>' +
        '</div>' +
      '</form></div></div>';

    document.getElementById('cancel-client-form').addEventListener('click', function () { wrap.style.display = 'none'; });

    document.getElementById('client-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(e.target));
      var msgEl = document.getElementById('client-form-msg');
      try {
        if (isEdit) {
          await api.staff.updateClient(client.id, data);
        } else {
          await api.staff.createClient(data);
        }
        wrap.style.display = 'none';
        renderClients();
      } catch (err) {
        msgEl.style.display = '';
        msgEl.style.color = '#7a2020';
        msgEl.textContent = 'Error: ' + err.message;
      }
    });
  }

  function showClientEdit(clientId, clients) {
    var client = clients.find(function (c) { return c.id === clientId; });
    if (client) showClientForm(client);
  }

  // ── PROPERTIES ────────────────────────────────────────────────────────────
  async function renderProperties() {
    loading();
    try {
      var result = await api.staff.getAllProperties();

      var rows = result.map(function (p) {
        return '<tr>' +
          '<td><strong>' + esc(p.name) + '</strong></td>' +
          '<td>' + esc((p.clients && p.clients.display_name) || '—') + '</td>' +
          '<td>' + (p.acreage ? Math.round(p.acreage) + ' ac' : '—') + '</td>' +
          '<td>' + esc(p.county || '—') + (p.state ? ', ' + esc(p.state) : '') + '</td>' +
          '<td>' + chip(p.status || 'active', statusColor(p.status || 'active')) + '</td>' +
          '<td>' + formatDate(p.next_review_date) + '</td>' +
          '<td style="white-space:nowrap">' +
            '<button class="btn btn-ghost btn-sm" data-prop-open="' + esc(p.id) + '">Open</button> ' +
            '<button class="btn btn-ghost btn-sm" data-prop-project="' + esc(p.id) + '">Add Project</button> ' +
            '<button class="btn btn-ghost btn-sm" data-prop-edit="' + esc(p.id) + '">Edit</button>' +
          '</td>' +
        '</tr>';
      }).join('');

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading">' +
            '<div>' +
              '<h1>Properties</h1>' +
              '<p class="page-sub">Open a property to manage its projects, recommendations, estimated costs, and client-visible work.</p>' +
            '</div>' +
            '<button class="btn" id="new-prop-btn" style="background:var(--forest);color:#fff;border:none;padding:.55rem 1.1rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">+ New Property</button>' +
          '</div>' +
          '<div id="prop-form-wrap" style="display:none"></div>' +
          '<div id="project-form-wrap" style="display:none"></div>' +
          '<div class="panel">' +
            '<table class="data-table">' +
              '<thead><tr>' +
                '<th>Property</th><th>Client</th><th>Acreage</th><th>County</th><th>Status</th><th>Next Review</th><th>Actions</th>' +
              '</tr></thead>' +
              '<tbody>' + (rows || '<tr><td colspan="7" style="text-align:center;color:var(--moss)">No properties yet.</td></tr>') + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>'
      );

      document.getElementById('new-prop-btn').addEventListener('click', function () {
        showPropertyForm(null);
      });

      document.querySelectorAll('[data-prop-open]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          renderPropertyWorkspace(btn.dataset.propOpen);
        });
      });

      document.querySelectorAll('[data-prop-project]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          showProjectForm(null, btn.dataset.propProject, function () {
            renderPropertyWorkspace(btn.dataset.propProject);
          });
        });
      });

      document.querySelectorAll('[data-prop-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var prop = result.find(function (p) { return p.id === btn.dataset.propEdit; });
          if (prop) showPropertyForm(prop);
        });
      });
    } catch (e) {
      setContent('<div class="portal-page">' + errBox('Could not load properties: ' + e.message) + '</div>');
    }
  }

  async function showPropertyForm(property) {
    var wrap = document.getElementById('prop-form-wrap');
    if (!wrap) return;

    var isEdit = !!property;
    var clients = await api.staff.getAllClients().catch(function () { return []; });

    wrap.style.display = '';
    wrap.innerHTML = '<div class="panel" style="margin-bottom:20px"><div class="panel-header"><h2>' + (isEdit ? 'Edit Property' : 'New Property') + '</h2>' +
      '<button class="btn btn-ghost btn-sm" id="cancel-prop-form">Cancel</button></div><div class="panel-body-p">' +
      '<form id="prop-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<div style="grid-column:1/-1"><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Client *</label>' +
          '<select name="client_id" required style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' +
            '<option value="">Select client</option>' +
            clients.map(function (c) {
              var selected = property && property.clientId === c.id ? ' selected' : '';
              return '<option value="' + esc(c.id) + '"' + selected + '>' + esc(c.display_name || c.displayName || c.legalName || c.id) + '</option>';
            }).join('') +
          '</select></div>' +
        adminField('Property Name',      'name',               (property && property.name) || '', 'required') +
        adminField('Acreage',            'acreage',            (property && property.acreage) || '', 'type=number step=0.01') +
        adminField('County',             'county',             (property && property.county) || '') +
        adminField('State',              'state',              (property && property.state) || 'AL') +
        adminField('Physical Address',   'physical_address',   (property && (property.physicalAddress || property.physical_address)) || '') +
        adminField('Next Review Date',   'next_review_date',   projectDateValue(property && property.next_review_date), 'type=date') +
        adminField('Primary Objectives', 'primary_objectives', (property && (property.primaryObjectives || property.primary_objectives)) || '') +
        '<div style="grid-column:1/-1"><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Client-Visible Management Summary</label>' +
          '<textarea name="management_summary_client" rows="3" style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' + esc((property && (property.clientManagementSummary || property.management_summary_client)) || '') + '</textarea></div>' +
        '<div style="grid-column:1/-1"><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Internal Notes (staff only — never visible to clients)</label>' +
          '<textarea name="ownership_notes_internal" rows="2" style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' + esc((property && property.ownership_notes_internal) || '') + '</textarea></div>' +
        '<div style="grid-column:1/-1">' +
          '<label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Status</label>' +
          '<select name="status" style="border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' +
            ['active','inactive','archived'].map(function (s) {
              return '<option value="' + s + '"' + ((property && property.status === s) ? ' selected' : '') + '>' + s + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div style="grid-column:1/-1">' +
          '<div id="prop-form-msg" style="display:none;font-size:12.5px;margin-bottom:8px"></div>' +
          '<button type="submit" class="btn" style="background:var(--forest);color:#fff;border:none;padding:.6rem 1.2rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">' + (isEdit ? 'Save Changes' : 'Create Property') + '</button>' +
        '</div>' +
      '</form></div></div>';

    document.getElementById('cancel-prop-form').addEventListener('click', function () {
      wrap.style.display = 'none';
    });

    document.getElementById('prop-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var data = Object.fromEntries(new FormData(e.target));
      var msgEl = document.getElementById('prop-form-msg');

      try {
        if (isEdit) {
          await api.staff.updateProperty(property.id, data);
        } else {
          await api.staff.createProperty(data);
        }

        wrap.style.display = 'none';

        if (window.location.hash.replace('#','') === 'properties') {
          renderProperties();
        } else if (isEdit && property && property.id) {
          renderPropertyWorkspace(property.id);
        } else {
          renderProperties();
        }
      } catch (err) {
        msgEl.style.display = '';
        msgEl.style.color = '#7a2020';
        msgEl.textContent = 'Error: ' + err.message;
      }
    });
  }

  async function renderPropertyWorkspace(propertyId) {
    loading();

    try {
      var properties = await api.staff.getAllProperties();
      var property = properties.find(function (p) { return p.id === propertyId; });

      if (!property) {
        setContent('<div class="portal-page">' + errBox('Property not found.') + '</div>');
        return;
      }

      var projects = await getProjectsForProperty(propertyId);

      var projectRows = projects.map(function (p) {
        return '<tr>' +
          '<td><strong>' + esc(p.name || 'Untitled Project') + '</strong><br><span style="font-size:12px;color:var(--moss)">' + esc((p.description || '').slice(0, 90)) + ((p.description || '').length > 90 ? '…' : '') + '</span></td>' +
          '<td>' + chip(p.status || 'draft', statusColor(p.status || 'draft')) + '</td>' +
          '<td>' + esc(p.classification || '—') + '</td>' +
          '<td>' + formatCurrency(projectEstimatedCents(p)) + '</td>' +
          '<td>' + chip(p.clientReviewStatus || p.client_review_status || 'not_requested', (p.clientReviewStatus || p.client_review_status) === 'awaiting_review' ? 'gold' : 'gray') + '</td>' +
          '<td>' + ((p.clientVisible || p.client_visible) ? chip('Published','green') : chip('Internal','gray')) + '</td>' +
          '<td><button class="btn btn-ghost btn-sm" data-project-edit="' + esc(p.id) + '">Edit</button></td>' +
        '</tr>';
      }).join('');

      document.getElementById('admin-section-title').textContent = 'Property Workspace';

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading">' +
            '<div>' +
              '<button id="back-to-properties" class="btn btn-ghost btn-sm" type="button" style="margin-bottom:8px">← Back to Properties</button>' +
              '<h1>' + esc(property.name) + '</h1>' +
              '<p class="page-sub">' +
                esc((property.clients && property.clients.display_name) || 'No client shown') +
                ' · ' + (property.acreage ? Math.round(property.acreage) + ' acres' : 'acreage not set') +
                (property.county ? ' · ' + esc(property.county) : '') +
                (property.state ? ', ' + esc(property.state) : '') +
              '</p>' +
            '</div>' +
            '<div>' +
              '<button id="workspace-edit-property" class="btn btn-ghost btn-sm" type="button">Edit Property</button> ' +
              '<button id="workspace-add-project" class="btn" type="button" style="background:var(--forest);color:#fff;border:none;padding:.55rem 1.1rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">+ Add Project</button>' +
            '</div>' +
          '</div>' +

          '<div id="prop-form-wrap" style="display:none"></div>' +
          '<div id="project-form-wrap" style="display:none"></div>' +

          '<div class="two-col" style="margin-bottom:20px">' +
            '<div class="panel"><div class="panel-header"><h2>Management Objectives</h2></div><div class="panel-body-p">' +
              '<p style="font-size:13px;color:var(--charcoal)">' + esc(property.primaryObjectives || property.primary_objectives || 'No objectives entered yet.') + '</p>' +
            '</div></div>' +
            '<div class="panel"><div class="panel-header"><h2>Client-Visible Summary</h2></div><div class="panel-body-p">' +
              '<p style="font-size:13px;color:var(--charcoal)">' + esc(property.clientManagementSummary || property.management_summary_client || 'No client summary entered yet.') + '</p>' +
            '</div></div>' +
          '</div>' +

          '<div class="panel">' +
            '<div class="panel-header"><h2>Projects &amp; Recommendations</h2></div>' +
            '<div class="panel-body-p" style="padding-top:0">' +
              '<p style="font-size:13px;color:var(--moss);margin:0 0 14px">Create work recommendations, estimated costs, review status, and client-visible project updates for this property.</p>' +
            '</div>' +
            '<table class="data-table">' +
              '<thead><tr>' +
                '<th>Project</th><th>Status</th><th>Classification</th><th>Estimated</th><th>Client Review</th><th>Visibility</th><th>Action</th>' +
              '</tr></thead>' +
              '<tbody>' + (projectRows || '<tr><td colspan="7" style="text-align:center;color:var(--moss)">No projects for this property yet. Click + Add Project.</td></tr>') + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>'
      );

      document.getElementById('back-to-properties').addEventListener('click', function () {
        window.location.hash = '#properties';
        renderProperties();
      });

      document.getElementById('workspace-edit-property').addEventListener('click', function () {
        showPropertyForm(property);
      });

      document.getElementById('workspace-add-project').addEventListener('click', function () {
        showProjectForm(null, propertyId, function () {
          renderPropertyWorkspace(propertyId);
        });
      });

      document.querySelectorAll('[data-project-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var project = projects.find(function (p) { return p.id === btn.dataset.projectEdit; });
          if (project) {
            showProjectForm(project, propertyId, function () {
              renderPropertyWorkspace(propertyId);
            });
          }
        });
      });
    } catch (e) {
      setContent('<div class="portal-page">' + errBox('Could not open property workspace: ' + e.message) + '</div>');
    }
  }

  async function getProjectsForProperty(propertyId) {
    var projects = await api.staff.getAllProjects();
    return projects.filter(function (p) { return p.propertyId === propertyId; });
  }

  // ── PROJECTS ──────────────────────────────────────────────────────────────
  async function renderProjects() {
    loading();
    try {
      var result = await api.staff.getAllProjects();

      var rows = result.map(function (p) {
        return '<tr>' +
          '<td><strong>' + esc(p.name || 'Untitled Project') + '</strong></td>' +
          '<td>' + esc((p.properties && p.properties.name) || '—') + '</td>' +
          '<td>' + chip(p.status || 'draft', statusColor(p.status || 'draft')) + '</td>' +
          '<td>' + esc(p.classification || '—') + '</td>' +
          '<td>' + formatCurrency(projectEstimatedCents(p)) + '</td>' +
          '<td>' + chip(p.client_review_status || p.clientReviewStatus || 'not_requested', (p.client_review_status || p.clientReviewStatus) === 'awaiting_review' ? 'gold' : 'gray') + '</td>' +
          '<td>' + ((p.client_visible || p.clientVisible) ? chip('Published','green') : chip('Internal','gray')) + '</td>' +
          '<td><button class="btn btn-ghost btn-sm" data-project-edit="' + esc(p.id) + '">Edit</button></td>' +
        '</tr>';
      }).join('');

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading">' +
            '<div>' +
              '<h1>Projects</h1>' +
              '<p class="page-sub">Create and manage landowner-facing work recommendations, cost estimates, and review status.</p>' +
            '</div>' +
            '<button id="new-project-btn" class="btn" style="background:var(--forest);color:#fff;border:none;padding:.55rem 1.1rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">+ New Project</button>' +
          '</div>' +
          '<div id="project-form-wrap" style="display:none"></div>' +
          '<div class="panel">' +
            '<table class="data-table">' +
              '<thead><tr>' +
                '<th>Project</th><th>Property</th><th>Status</th><th>Classification</th><th>Estimated</th><th>Client Review</th><th>Visibility</th><th>Action</th>' +
              '</tr></thead>' +
              '<tbody>' + (rows || '<tr><td colspan="8" style="text-align:center;color:var(--moss)">No projects found. Click + New Project.</td></tr>') + '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>'
      );

      document.getElementById('new-project-btn').addEventListener('click', function () {
        showProjectForm(null, null, renderProjects);
      });

      document.querySelectorAll('[data-project-edit]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var project = result.find(function (p) { return p.id === btn.dataset.projectEdit; });
          if (project) showProjectForm(project, project.propertyId, renderProjects);
        });
      });
    } catch (e) {
      setContent('<div class="portal-page">' + errBox('Could not load projects: ' + e.message) + '</div>');
    }
  }

  async function showProjectForm(project, selectedPropertyId, afterSave) {
    var wrap = document.getElementById('project-form-wrap');

    if (!wrap) {
      setContent('<div class="portal-page"><div id="project-form-wrap"></div></div>');
      wrap = document.getElementById('project-form-wrap');
    }

    var isEdit = !!project;
    var properties = await api.staff.getAllProperties().catch(function () { return []; });
    var activePropertyId = selectedPropertyId || (project && project.propertyId) || '';

    wrap.style.display = '';
    wrap.innerHTML = '<div class="panel" style="margin-bottom:20px"><div class="panel-header"><h2>' + (isEdit ? 'Edit Project' : 'New Project') + '</h2>' +
      '<button class="btn btn-ghost btn-sm" id="cancel-project-form">Cancel</button></div><div class="panel-body-p">' +
      '<form id="project-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        '<div style="grid-column:1/-1"><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Property *</label>' +
          '<select name="property_id" required style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' +
            '<option value="">Select property</option>' +
            properties.map(function (p) {
              var label = p.name + ((p.clients && p.clients.display_name) ? ' — ' + p.clients.display_name : '');
              return '<option value="' + esc(p.id) + '"' + (activePropertyId === p.id ? ' selected' : '') + '>' + esc(label) + '</option>';
            }).join('') +
          '</select></div>' +

        adminField('Project Name', 'name', (project && project.name) || '', 'required') +

        '<div><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Status</label>' +
          '<select name="status" style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' +
            projectStatusOptions(project && project.status).join('') +
          '</select></div>' +

        adminField('Classification', 'classification', (project && project.classification) || 'Habitat management', '') +
        adminField('Estimated Cost', 'estimated_cost', projectEstimatedDollars(project), 'type=number step=0.01 min=0') +

        '<div><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Client Review Status</label>' +
          '<select name="client_review_status" style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' +
            projectReviewOptions(project && (project.client_review_status || project.clientReviewStatus)).join('') +
          '</select></div>' +

        '<div style="display:flex;align-items:end;padding-bottom:8px">' +
          '<label style="display:flex;gap:.5rem;align-items:center;font-size:13px;color:var(--charcoal);font-weight:600">' +
            '<input type="checkbox" name="client_visible" ' + ((project && (project.client_visible || project.clientVisible)) ? 'checked' : '') + '> Visible in client portal' +
          '</label>' +
        '</div>' +

        adminField('Planned Start Date', 'planned_start_date', projectDateValue(project && (project.planned_start_date || project.plannedStartDate)), 'type=date') +
        adminField('Target Completion Date', 'target_completion_date', projectDateValue(project && (project.target_completion_date || project.targetCompletionDate)), 'type=date') +

        '<div style="grid-column:1/-1"><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Scope / Staff Description</label>' +
          '<textarea name="description" rows="4" style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' + esc((project && project.description) || '') + '</textarea></div>' +

        '<div style="grid-column:1/-1"><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Client-Facing Notes</label>' +
          '<textarea name="client_notes" rows="4" style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' + esc((project && (project.client_notes || project.clientNotes)) || '') + '</textarea></div>' +

        '<div style="grid-column:1/-1">' +
          '<div id="project-form-msg" style="display:none;font-size:12.5px;margin-bottom:8px"></div>' +
          '<button type="submit" class="btn" style="background:var(--forest);color:#fff;border:none;padding:.6rem 1.2rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">' + (isEdit ? 'Save Project' : 'Create Project') + '</button>' +
        '</div>' +
      '</form></div></div>';

    document.getElementById('cancel-project-form').addEventListener('click', function () {
      wrap.style.display = 'none';
    });

    document.getElementById('project-form').addEventListener('submit', async function (e) {
      e.preventDefault();

      var data = Object.fromEntries(new FormData(e.target));
      var msgEl = document.getElementById('project-form-msg');
      var prop = properties.find(function (p) { return p.id === data.property_id; });

      if (!prop) {
        msgEl.style.display = '';
        msgEl.style.color = '#7a2020';
        msgEl.textContent = 'Choose a property before saving the project.';
        return;
      }

      var estimate = data.estimated_cost === '' ? null : Math.round(Number(data.estimated_cost) * 100);

      var payload = {
        propertyId: data.property_id,
        clientId: prop.clientId || '',
        name: data.name || '',
        status: data.status || 'draft',
        classification: data.classification || '',
        estimatedCostCents: estimate,
        clientReviewStatus: data.client_review_status || 'not_requested',
        clientVisible: data.client_visible === 'on',
        plannedStartDate: data.planned_start_date || null,
        targetCompletionDate: data.target_completion_date || null,
        description: data.description || '',
        clientNotes: data.client_notes || ''
      };

      if (isEdit) payload.id = project.id;

      try {
        await api.staff.upsertProject(payload);
        wrap.style.display = 'none';
        if (afterSave) afterSave();
        else renderProjects();
      } catch (err) {
        msgEl.style.display = '';
        msgEl.style.color = '#7a2020';
        msgEl.textContent = 'Error: ' + err.message;
      }
    });
  }

  function projectStatusOptions(current) {
    return ['draft','active','scheduled','in_progress','complete','deferred','cancelled','archived'].map(function (s) {
      return '<option value="' + s + '"' + (current === s ? ' selected' : '') + '>' + s + '</option>';
    });
  }

  function projectReviewOptions(current) {
    return ['not_requested','awaiting_review','preliminary_approval','approved','defer','request_proposal','question'].map(function (s) {
      return '<option value="' + s + '"' + (current === s ? ' selected' : '') + '>' + s + '</option>';
    });
  }

  function projectEstimatedCents(project) {
    if (!project) return null;
    if (project.estimatedCostCents !== null && project.estimatedCostCents !== undefined) return project.estimatedCostCents;
    if (project.estimated_cost !== null && project.estimated_cost !== undefined) return Math.round(Number(project.estimated_cost) * 100);
    return null;
  }

  function projectEstimatedDollars(project) {
    if (!project) return '';
    if (project.estimatedCostCents !== null && project.estimatedCostCents !== undefined) return project.estimatedCostCents / 100;
    if (project.estimated_cost !== null && project.estimated_cost !== undefined) return project.estimated_cost;
    return '';
  }

  function projectDateValue(value) {
    if (!value) return '';
    if (typeof value.toDate === 'function') return value.toDate().toISOString().slice(0, 10);
    if (typeof value === 'string') return value.slice(0, 10);
    try {
      return new Date(value).toISOString().slice(0, 10);
    } catch (e) {
      return '';
    }
  }

  // ── INQUIRIES ─────────────────────────────────────────────────────────────
  async function renderInquiries() {
    loading();
    try {
      var result = await api.staff.getInquiries();
      var rows = result.map(function (inq) {
        return '<tr><td>' + esc(inq.name) + '</td><td>' + esc(inq.email) + '</td>' +
          '<td>' + chip(inq.inquiry_type || '—', 'blue') + '</td>' +
          '<td>' + chip(inq.status, statusColor(inq.status)) + '</td>' +
          '<td>' + formatDate(inq.created_at) + '</td>' +
          '<td><select data-inq-id="' + inq.id + '" data-inq-status="' + inq.status + '" style="font-size:12px;border:1px solid var(--border);border-radius:3px;padding:3px 6px">' +
            ['new','reviewed','contacted','converted','closed'].map(function (s) { return '<option value="' + s + '"' + (inq.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') +
          '</select></td>' +
          '<td style="max-width:200px;font-size:12px;color:var(--moss)">' + esc((inq.message || '').slice(0, 80)) + (inq.message && inq.message.length > 80 ? '\u2026' : '') + '</td>' +
        '</tr>';
      }).join('');

      setContent(
        '<div class="portal-page"><div class="page-heading"><h1>Website Inquiries</h1></div>' +
        '<div class="panel"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Type</th><th>Status</th><th>Received</th><th>Update Status</th><th>Message</th></tr></thead>' +
        '<tbody>' + (rows || '<tr><td colspan="7" style="text-align:center;color:var(--moss)">No inquiries yet.</td></tr>') + '</tbody></table></div></div>'
      );

      document.querySelectorAll('[data-inq-id]').forEach(function (sel) {
        sel.addEventListener('change', async function () {
          try {
            await api.staff.updateInquiryStatus(sel.dataset.inqId, sel.value);
          } catch (e) { alert('Update failed: ' + e.message); }
        });
      });
    } catch (e) {
      setContent('<div class="portal-page">' + errBox('Could not load inquiries: ' + e.message) + '</div>');
    }
  }

  // ── ACCESS REQUESTS ───────────────────────────────────────────────────────
  async function renderAccess() {
    loading();
    try {
      var result = await api.staff.getAccessRequests();
      var rows = result.map(function (r) {
        return '<tr><td>' + esc(r.name) + '</td><td>' + esc(r.email) + '</td>' +
          '<td>' + esc(r.client_name || '—') + '</td><td>' + esc(r.property_name || '—') + '</td>' +
          '<td>' + chip(r.status, statusColor(r.status)) + '</td>' +
          '<td>' + formatDate(r.created_at) + '</td>' +
          '<td>' +
            (r.status === 'pending' ?
              '<button class="btn btn-ghost btn-sm" data-ar-id="' + r.id + '" data-ar-action="approved" style="margin-right:4px">Approve</button>' +
              '<button class="btn btn-ghost btn-sm" data-ar-id="' + r.id + '" data-ar-action="denied">Deny</button>' : '') +
          '</td>' +
          '<td style="max-width:160px;font-size:12px;color:var(--moss)">' + esc((r.message || '').slice(0, 70)) + (r.message && r.message.length > 70 ? '\u2026' : '') + '</td>' +
        '</tr>';
      }).join('');

      setContent(
        '<div class="portal-page"><div class="page-heading"><h1>Portal Access Requests</h1></div>' +
        '<p style="font-size:13px;color:var(--moss);margin:0 0 16px">Approving a request does <strong>not</strong> create an account. Use Users &amp; Access to invite the user after approval.</p>' +
        '<div class="panel"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Client</th><th>Property</th><th>Status</th><th>Received</th><th>Action</th><th>Message</th></tr></thead>' +
        '<tbody>' + (rows || '<tr><td colspan="8" style="text-align:center;color:var(--moss)">No access requests.</td></tr>') + '</tbody></table></div></div>'
      );

      document.querySelectorAll('[data-ar-id]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          try {
            await api.staff.updateAccessRequestStatus(btn.dataset.arId, btn.dataset.arAction);
            renderAccess();
          } catch (e) { alert('Update failed: ' + e.message); }
        });
      });
    } catch (e) {
      setContent('<div class="portal-page">' + errBox('Could not load access requests: ' + e.message) + '</div>');
    }
  }

  // ── USERS & ACCESS ────────────────────────────────────────────────────────
  async function renderUsers() {
    loading();
    try {
      // Fetch users from Firestore
      var [usersSnap, cuSnap, clients] = await Promise.all([
        db.collection('users').orderBy('lastName').get(),
        db.collection('clientUsers').where('active', '==', true).get(),
        api.staff.getAllClients().catch(function () { return []; })
      ]);

      var clientMap = {};
      clients.forEach(function (c) { clientMap[c.id] = c; });

      var cuByUser = {};
      cuSnap.docs.forEach(function (d) {
        var cu = { id: d.id, ...d.data() };
        if (!cuByUser[cu.userId]) cuByUser[cu.userId] = [];
        cuByUser[cu.userId].push(cu);
      });

      var rows = usersSnap.docs.map(function (d) {
        var p     = { id: d.id, ...d.data() };
        var links = (cuByUser[p.id] || []).map(function (cu) {
          return esc(clientMap[cu.clientId] ? clientMap[cu.clientId].display_name : cu.clientId);
        }).join(', ');
        return '<tr>' +
          '<td>' + esc((p.firstName || '') + ' ' + (p.lastName || '')) + '</td>' +
          '<td>' + esc(p.email || '') + '</td>' +
          '<td>' + chip(p.role || '', (p.role || '').startsWith('client') ? 'blue' : 'gold') + '</td>' +
          '<td>' + (links || '<span style="color:var(--moss)">—</span>') + '</td>' +
          '<td>' + chip(p.active ? 'active' : 'inactive', p.active ? 'green' : 'gray') + '</td>' +
          '<td>' + formatDate(p.lastLoginAt) + '</td>' +
        '</tr>';
      }).join('');

      var clientOpts = clients.map(function (c) { return '<option value="' + c.id + '">' + esc(c.display_name) + '</option>'; }).join('');

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading"><h1>Users &amp; Access</h1></div>' +
          '<div class="panel" style="margin-bottom:20px"><div class="panel-header"><h2>Invite Client User</h2></div><div class="panel-body-p">' +
            '<form id="invite-form" style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">' +
              '<div><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Email Address</label>' +
                '<input id="inv-email" type="email" placeholder="client@example.com" style="border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px;width:220px"></div>' +
              '<div><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Client</label>' +
                '<select id="inv-client" style="border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' + clientOpts + '</select></div>' +
              '<div><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Access Level</label>' +
                '<select id="inv-level" style="border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' +
                  '<option value="client_owner">Client Owner</option>' +
                  '<option value="client_viewer">Client Viewer</option>' +
                '</select></div>' +
              '<button type="submit" class="btn" style="background:var(--forest);color:#fff;border:none;padding:.6rem 1.2rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">Send Invitation</button>' +
              '<div id="invite-msg" style="font-size:12.5px;align-self:center;display:none"></div>' +
            '</form>' +
          '</div></div>' +
          '<div class="panel"><table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Clients</th><th>Active</th><th>Last Login</th></tr></thead>' +
          '<tbody>' + (rows || '<tr><td colspan="6" style="text-align:center;color:var(--moss)">No users found.</td></tr>') + '</tbody></table></div>' +
        '</div>'
      );

      document.getElementById('invite-form').addEventListener('submit', async function (e) {
        e.preventDefault();
        var email = document.getElementById('inv-email').value.trim();
        var clientId = document.getElementById('inv-client').value;
        var level = document.getElementById('inv-level').value;
        var msgEl = document.getElementById('invite-msg');
        msgEl.style.display = 'none';
        try {
          await api.staff.inviteClientUser(email, clientId, level);
          msgEl.style.display = ''; msgEl.style.color = '#14532d'; msgEl.textContent = 'Invitation sent to ' + email;
          renderUsers();
        } catch (err) {
          msgEl.style.display = ''; msgEl.style.color = '#7a2020'; msgEl.textContent = 'Error: ' + err.message;
        }
      });
    } catch (e) {
      setContent('<div class="portal-page">' + errBox('Could not load users: ' + e.message) + '</div>');
    }
  }

  // ── AUDIT LOG ─────────────────────────────────────────────────────────────
  async function renderAudit() {
    if (state.profile.role !== 'super_admin') {
      setContent('<div class="portal-page"><div class="content-empty">Audit log access requires super_admin role.</div></div>');
      return;
    }
    loading();
    try {
      var result = await api.staff.getAuditLog();
      var rows = result.map(function (entry) {
        var who = entry.profiles ? (entry.profiles.first_name + ' ' + entry.profiles.last_name).trim() || entry.profiles.email : entry.user_id || 'system';
        return '<tr><td>' + formatDate(entry.created_at) + '</td>' +
          '<td>' + chip(entry.action, entry.action === 'DELETE' ? 'red' : entry.action === 'UPDATE' ? 'blue' : 'green') + '</td>' +
          '<td>' + esc(entry.table_name) + '</td>' +
          '<td style="font-size:11px;font-family:monospace;color:var(--moss)">' + esc(entry.record_id || '') + '</td>' +
          '<td>' + esc(who) + '</td>' +
        '</tr>';
      }).join('');

      setContent(
        '<div class="portal-page"><div class="page-heading"><h1>Audit Log</h1><p class="page-sub">Showing last 200 records &mdash; super_admin only</p></div>' +
        '<div class="panel"><table class="data-table"><thead><tr><th>Timestamp</th><th>Action</th><th>Table</th><th>Record ID</th><th>User</th></tr></thead>' +
        '<tbody>' + (rows || '<tr><td colspan="5" style="text-align:center;color:var(--moss)">No audit records.</td></tr>') + '</tbody></table></div></div>'
      );
    } catch (e) {
      setContent('<div class="portal-page">' + errBox('Could not load audit log: ' + e.message) + '</div>');
    }
  }

  // ── Form field helper ─────────────────────────────────────────────────────
  function adminField(label, name, value, extra) {
    return '<div><label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">' + label + '</label>' +
      '<input name="' + name + '" value="' + esc(value) + '" ' + (extra || '') + ' style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px;background:#fff;color:var(--charcoal)"></div>';
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
