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
    var activeServiceType = (project && (project.serviceType || project.service_type)) || '';
    var existingServiceDetails = (project && (project.serviceDetails || project.service_details)) || {};

    wrap.style.display = '';
    wrap.innerHTML = '<div class="panel" style="margin-bottom:20px"><div class="panel-header"><h2>' + (isEdit ? 'Edit Project' : 'New Project') + '</h2>' +
      '<button class="btn btn-ghost btn-sm" id="cancel-project-form">Cancel</button></div><div class="panel-body-p">' +
      '<form id="project-form" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +

        '<div style="grid-column:1/-1">' +
          '<label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Service Type *</label>' +
          '<select name="service_type" id="service-type-select" required style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px">' +
            '<option value="">Select service type</option>' +
            serviceTypeOptions(activeServiceType).join('') +
          '</select>' +
          '<p style="font-size:12px;color:var(--moss);margin:6px 0 0">This controls the project template, scope language, and service-specific specification fields.</p>' +
        '</div>' +

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

        adminField('Classification', 'classification', (project && project.classification) || '', '') +
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

        '<div id="service-details-wrap" style="grid-column:1/-1">' +
          renderServiceDetails(activeServiceType, existingServiceDetails) +
        '</div>' +

        '<div style="grid-column:1/-1">' +
          '<div id="project-form-msg" style="display:none;font-size:12.5px;margin-bottom:8px"></div>' +
          '<button type="submit" class="btn" style="background:var(--forest);color:#fff;border:none;padding:.6rem 1.2rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">' + (isEdit ? 'Save Project' : 'Create Project') + '</button>' +
        '</div>' +
      '</form></div></div>';

    var form = document.getElementById('project-form');
    var serviceSelect = document.getElementById('service-type-select');

    document.getElementById('cancel-project-form').addEventListener('click', function () {
      wrap.style.display = 'none';
    });

    serviceSelect.addEventListener('change', function () {
      var serviceType = serviceSelect.value;
      applyServiceTemplate(form, serviceType);
      document.getElementById('service-details-wrap').innerHTML = renderServiceDetails(serviceType, {});
    });

    form.addEventListener('submit', async function (e) {
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

      if (!data.service_type) {
        msgEl.style.display = '';
        msgEl.style.color = '#7a2020';
        msgEl.textContent = 'Choose a service type before saving the project.';
        return;
      }

      var estimate = data.estimated_cost === '' ? null : Math.round(Number(data.estimated_cost) * 100);
      var template = getServiceTemplate(data.service_type);
      var serviceDetails = collectServiceDetails(form);

      var payload = {
        propertyId: data.property_id,
        clientId: prop.clientId || prop.client_id || '',
        name: data.name || '',
        status: data.status || 'draft',
        classification: data.classification || '',
        estimatedCostCents: estimate,
        estimated_cost: estimate,
        clientReviewStatus: data.client_review_status || 'not_requested',
        client_review_status: data.client_review_status || 'not_requested',
        clientVisible: data.client_visible === 'on',
        client_visible: data.client_visible === 'on',
        plannedStartDate: data.planned_start_date || null,
        targetCompletionDate: data.target_completion_date || null,
        description: data.description || '',
        clientNotes: data.client_notes || '',
        serviceType: data.service_type,
        service_type: data.service_type,
        serviceLabel: template ? template.label : data.service_type,
        serviceDetails: serviceDetails,
        serviceTemplateVersion: 1
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

  function serviceTypeOptions(current) {
    return Object.keys(getServiceTemplates()).map(function (key) {
      var t = getServiceTemplates()[key];
      return '<option value="' + key + '"' + (current === key ? ' selected' : '') + '>' + esc(t.label) + '</option>';
    });
  }

  function getServiceTemplate(key) {
    return getServiceTemplates()[key] || null;
  }

  function getServiceTemplates() {
    return {
      prescribed_fire: {
        label: 'Prescribed Fire',
        defaultName: 'Prescribed Fire Implementation',
        classification: 'Prescribed fire / burn-unit management',
        description: 'Plan and implement prescribed fire to improve wildlife habitat, reduce fuel loading, stimulate native herbaceous response, and maintain fire-adapted plant communities.',
        clientNotes: 'Southern Habitat Consulting will evaluate burn-unit readiness, firebreak condition, smoke-sensitive areas, weather windows, and staffing needs before scheduling the burn.',
        fields: [
          { name:'burnUnitName', label:'Burn Unit Name / Block', type:'text' },
          { name:'acres', label:'Burn Acres', type:'number', step:'0.01' },
          { name:'burnObjective', label:'Primary Burn Objective', type:'select', options:['Fuel reduction','Longleaf / wiregrass restoration','Wildlife habitat improvement','Midstory reduction','Site preparation','Hardwood control','Training / demonstration burn'] },
          { name:'burnSeason', label:'Preferred Burn Season', type:'select', options:['Dormant season','Growing season','Either season','Weather-window dependent'] },
          { name:'fuelType', label:'Dominant Fuel Type', type:'select', options:['Pine straw / grass','Longleaf pine savanna fuel','Mixed pine-hardwood litter','Old field / grass','Cutover / slash','Unknown — field verification needed'] },
          { name:'firebreakStatus', label:'Firebreak Condition', type:'select', options:['Existing and ready','Existing but needs maintenance','Needs new firebreaks','Roads serve as breaks','Unknown — inspect first'] },
          { name:'smokeConcerns', label:'Smoke-Sensitive Areas', type:'textarea' },
          { name:'crewEquipment', label:'Crew / Equipment Notes', type:'textarea' },
          { name:'permitStatus', label:'Permit / Notification Status', type:'select', options:['Not started','Burn permit needed','Landowner to obtain','SHC to coordinate','Complete'] },
          { name:'prescriptionNotes', label:'Prescription Notes', type:'textarea' }
        ]
      },

      thermal_drone_survey: {
        label: 'Thermal Drone Survey',
        defaultName: 'Thermal Drone Survey',
        classification: 'Thermal drone wildlife / habitat survey',
        description: 'Conduct a thermal drone survey to identify wildlife activity, detect target species, evaluate access constraints, or document management areas.',
        clientNotes: 'Thermal drone work is most effective during appropriate weather, light, and temperature conditions. SHC will coordinate the preferred flight window and deliver summary findings.',
        fields: [
          { name:'surveyObjective', label:'Survey Objective', type:'select', options:['Wildlife detection','Deer survey support','Feral hog detection','Predator activity','Post-treatment inspection','Access / infrastructure review','Other'] },
          { name:'targetSpecies', label:'Target Species', type:'text' },
          { name:'flightAreaAcres', label:'Approximate Flight Area Acres', type:'number', step:'0.01' },
          { name:'flightWindow', label:'Preferred Flight Window', type:'select', options:['Pre-dawn','Night','Evening','Weather-dependent','Any suitable window'] },
          { name:'deliverable', label:'Deliverable', type:'select', options:['Summary memo','Map with observations','Photos / screenshots','Full report','GIS files if available'] },
          { name:'accessNotes', label:'Access / Launch Notes', type:'textarea' }
        ]
      },

      camera_survey: {
        label: 'Camera Survey',
        defaultName: 'Trail Camera Survey',
        classification: 'Wildlife camera survey',
        description: 'Deploy and analyze trail cameras to evaluate wildlife use, deer herd structure, predator activity, or property-level management trends.',
        clientNotes: 'SHC will set cameras based on survey objectives and provide a summary of findings, observations, and recommended next steps.',
        fields: [
          { name:'surveyObjective', label:'Survey Objective', type:'select', options:['Deer herd survey','Buck age structure','Doe/fawn recruitment','Turkey activity','Predator activity','Feral hog activity','General wildlife inventory'] },
          { name:'cameraCount', label:'Number of Cameras', type:'number', step:'1' },
          { name:'surveyDays', label:'Survey Duration — Days', type:'number', step:'1' },
          { name:'baitAttractant', label:'Bait / Attractant', type:'select', options:['Corn','Mineral site','No bait','Existing feeder','Scrape / scent post','Other'] },
          { name:'cameraSpacing', label:'Camera Spacing / Coverage Notes', type:'textarea' },
          { name:'deliverable', label:'Deliverable', type:'select', options:['Photo summary','Survey report','Harvest recommendations','Population index summary','Map + photos'] }
        ]
      },

      camera_deployment: {
        label: 'Camera Deployment',
        defaultName: 'Trail Camera Deployment',
        classification: 'Camera deployment / monitoring',
        description: 'Install, check, and maintain trail cameras for property monitoring, wildlife activity documentation, or management follow-up.',
        clientNotes: 'SHC will deploy cameras in strategic locations and provide updates based on the selected check schedule and monitoring objective.',
        fields: [
          { name:'deploymentObjective', label:'Deployment Objective', type:'select', options:['Wildlife monitoring','Feeder monitoring','Trespass / access monitoring','Post-treatment wildlife response','Turkey activity','Predator / hog activity'] },
          { name:'cameraCount', label:'Number of Cameras', type:'number', step:'1' },
          { name:'checkFrequency', label:'Check Frequency', type:'select', options:['Weekly','Every 2 weeks','Monthly','Seasonal','Cellular camera remote monitoring'] },
          { name:'cameraType', label:'Camera Type', type:'select', options:['Standard SD card','Cellular camera','Client-owned camera','SHC-provided camera'] },
          { name:'locationNotes', label:'Location Notes', type:'textarea' }
        ]
      },

      vegetation_analysis_survey: {
        label: 'Vegetation Analysis Survey',
        defaultName: 'Vegetation Analysis Survey',
        classification: 'Vegetation survey / habitat assessment',
        description: 'Evaluate plant community condition, browse pressure, invasive species presence, structure, mast availability, and habitat response to management.',
        clientNotes: 'SHC will document vegetation conditions and provide practical recommendations tied to wildlife habitat goals and future management activities.',
        fields: [
          { name:'surveyMethod', label:'Survey Method', type:'select', options:['Rapid habitat assessment','Transects','Sample plots','Photo points','Browse survey','Invasive species mapping','Combined approach'] },
          { name:'targetHabitat', label:'Target Habitat Type', type:'select', options:['Pine stand','Longleaf savanna','Hardwood bottomland','Old field','Food plot edges','Wetland / riparian','Mixed habitat'] },
          { name:'surveyAcres', label:'Survey Acres', type:'number', step:'0.01' },
          { name:'metrics', label:'Metrics to Document', type:'textarea' },
          { name:'deliverable', label:'Deliverable', type:'select', options:['Summary memo','Full report','GIS map','Photo-point set','Management recommendation list'] }
        ]
      },

      herbicide_application: {
        label: 'Herbicide Application',
        defaultName: 'Herbicide Application',
        classification: 'Herbicide application / vegetation management',
        description: 'Apply targeted herbicide treatment to control invasive, competing, or undesirable vegetation according to label requirements and project objectives.',
        clientNotes: 'SHC will confirm treatment targets, site conditions, timing, label requirements, application method, and follow-up needs before completing herbicide work.',
        fields: [
          { name:'treatmentTarget', label:'Treatment Target', type:'select', options:['Cogongrass','Chinese privet','Tallowtree','Sweetgum / hardwood competition','Midstory hardwoods','Brush / ROW vegetation','Aquatic vegetation','General invasive control','Other'] },
          { name:'treatmentAcres', label:'Treatment Acres', type:'number', step:'0.01' },
          { name:'applicationMethod', label:'Application Method', type:'select', options:['Broadcast spray','Foliar spot spray','Basal bark','Cut stump','Hack-and-squirt','Backpack application','UTV sprayer','Truck skid sprayer','Aquatic treatment','Other'] },
          { name:'herbicideProduct', label:'Herbicide Product / Active Ingredient', type:'select', options:['Garlon XRT / triclopyr','Glyphosate','Imazapyr','Oust Extra / sulfometuron + metsulfuron','Milestone / aminopyralid','2,4-D','Aquatic-approved glyphosate','TBD after label review','Other'] },
          { name:'herbicideRate', label:'Application Rate / Mix', type:'text' },
          { name:'carrierVolumeGpa', label:'Carrier Volume — GPA', type:'text' },
          { name:'adjuvant', label:'Surfactant / Adjuvant', type:'text' },
          { name:'timingWindow', label:'Treatment Timing Window', type:'select', options:['Spring','Summer','Fall','Dormant season','Growing season','After green-up','After mowing/regrowth','Weather-dependent'] },
          { name:'weatherLimitations', label:'Weather / Drift Limitations', type:'textarea' },
          { name:'ppeNotes', label:'PPE / Label Notes', type:'textarea' },
          { name:'followUp', label:'Follow-Up Recommendation', type:'textarea' }
        ]
      },

      invasive_species_control: {
        label: 'Invasive Species Control',
        defaultName: 'Invasive Species Control',
        classification: 'Invasive species control',
        description: 'Identify, prioritize, and treat invasive species using mechanical, chemical, or integrated control methods.',
        clientNotes: 'SHC will prioritize invasive species based on spread risk, habitat impact, treatment feasibility, and landowner objectives.',
        fields: [
          { name:'targetSpecies', label:'Target Species', type:'text' },
          { name:'infestationLevel', label:'Infestation Level', type:'select', options:['Scattered','Patchy','Moderate','Heavy','Severe / landscape-level','Unknown — survey needed'] },
          { name:'controlMethod', label:'Control Method', type:'select', options:['Herbicide','Mechanical removal','Cut stump','Basal bark','Foliar spray','Integrated control','Monitoring only'] },
          { name:'treatmentAcres', label:'Treatment Acres', type:'number', step:'0.01' },
          { name:'priority', label:'Priority', type:'select', options:['High','Medium','Low','Monitor'] },
          { name:'notes', label:'Treatment Notes', type:'textarea' }
        ]
      },

      tsi_forestry: {
        label: 'Timber Stand Improvement / Forestry Support',
        defaultName: 'Timber Stand Improvement',
        classification: 'TSI / forestry support',
        description: 'Improve stand condition and wildlife value through thinning recommendations, hardwood control, release work, or forestry support activities.',
        clientNotes: 'SHC will evaluate stand condition and recommend practical improvements tied to wildlife habitat, access, and long-term landowner objectives.',
        fields: [
          { name:'standType', label:'Stand Type', type:'select', options:['Pine plantation','Natural pine','Mixed pine-hardwood','Hardwood stand','Cutover','Longleaf restoration area','Unknown'] },
          { name:'treatmentObjective', label:'Treatment Objective', type:'select', options:['Release desired trees','Improve wildlife structure','Reduce hardwood competition','Prepare for burn','Improve access','Pre-commercial improvement','Other'] },
          { name:'treatmentAcres', label:'Treatment Acres', type:'number', step:'0.01' },
          { name:'method', label:'Method', type:'select', options:['Herbicide stem treatment','Mechanical thinning support','Marking / layout','Basal area assessment','Consultation only','Other'] },
          { name:'notes', label:'Stand Notes', type:'textarea' }
        ]
      },

      longleaf_site_prep: {
        label: 'Longleaf Site Prep / Planting Support',
        defaultName: 'Longleaf Site Prep and Planting Support',
        classification: 'Longleaf restoration',
        description: 'Prepare suitable areas for longleaf restoration through site-prep recommendations, treatment planning, planting layout, and follow-up monitoring.',
        clientNotes: 'SHC will evaluate site readiness, competing vegetation, planting density, treatment timing, and establishment needs before implementation.',
        fields: [
          { name:'prepAcres', label:'Site-Prep Acres', type:'number', step:'0.01' },
          { name:'currentCondition', label:'Current Site Condition', type:'select', options:['Cutover','Old field','Pine stand conversion','Mixed hardwood competition','Pasture conversion','Existing longleaf stand','Unknown'] },
          { name:'prepMethod', label:'Site-Prep Method', type:'select', options:['Herbicide only','Mechanical + herbicide','Burn + herbicide','Burn only','Planting layout only','Other'] },
          { name:'plantingDensity', label:'Target Planting Density', type:'select', options:['622 TPA','605 TPA','500 TPA','Custom density','Not determined'] },
          { name:'plantingWindow', label:'Planting Window', type:'select', options:['Winter','Early spring','Weather-dependent','Future phase'] },
          { name:'notes', label:'Restoration Notes', type:'textarea' }
        ]
      },

      food_plot_planting: {
        label: 'Food Plot Planting',
        defaultName: 'Food Plot Planting',
        classification: 'Food plot establishment / wildlife forage',
        description: 'Prepare, plant, and document food plot areas to improve seasonal wildlife forage and hunting property value.',
        clientNotes: 'SHC will confirm food plot acreage, soil needs, seed blend, planting timing, and equipment access before implementation.',
        fields: [
          { name:'plotAcres', label:'Food Plot Acres', type:'number', step:'0.01' },
          { name:'season', label:'Planting Season', type:'select', options:['Fall / cool season','Spring / warm season','Perennial','Summer annual','Custom'] },
          { name:'seedBlend', label:'Seed Blend', type:'textarea' },
          { name:'limeFertilizer', label:'Lime / Fertilizer Plan', type:'textarea' },
          { name:'sitePrep', label:'Site Prep Method', type:'select', options:['Disk only','Spray + disk','Mow + spray + disk','No-till drill','Broadcast + drag','Other'] },
          { name:'equipment', label:'Equipment Needed', type:'textarea' }
        ]
      },

      road_grading_access: {
        label: 'Road Grading / Access Work',
        defaultName: 'Road Grading and Access Improvement',
        classification: 'Road access / grading',
        description: 'Improve property access through road grading, water-control shaping, trail maintenance, or equipment access improvements.',
        clientNotes: 'SHC will evaluate access needs, drainage concerns, equipment requirements, and priority road segments before scheduling work.',
        fields: [
          { name:'roadLength', label:'Road / Trail Length', type:'text' },
          { name:'workType', label:'Work Type', type:'select', options:['Light grading','Heavy grading','Road reshaping','Trail clearing','Water bar installation','Culvert attention needed','Gravel / material placement','Other'] },
          { name:'accessIssue', label:'Primary Access Issue', type:'select', options:['Ruts','Standing water','Erosion','Overgrown trail','Poor drainage','Soft roadbed','Equipment access','Other'] },
          { name:'equipmentNeeded', label:'Equipment Needed', type:'select', options:['Tractor','Skid steer','Dozer','Motor grader','Excavator','Hand clearing','Subcontractor likely needed'] },
          { name:'erosionNotes', label:'Drainage / Erosion Notes', type:'textarea' }
        ]
      },

      firebreak_installation: {
        label: 'Firebreak Installation / Maintenance',
        defaultName: 'Firebreak Installation and Maintenance',
        classification: 'Firebreak / burn preparation',
        description: 'Install or maintain firebreaks to support prescribed fire, access, and property protection objectives.',
        clientNotes: 'SHC will evaluate burn-unit boundaries, access points, existing breaks, vegetation, slope, and equipment needs before work begins.',
        fields: [
          { name:'breakLength', label:'Firebreak Length', type:'text' },
          { name:'breakType', label:'Firebreak Type', type:'select', options:['Disked line','Bladed line','Mowed line','Existing road','Wetline support','Combination'] },
          { name:'condition', label:'Current Condition', type:'select', options:['None exists','Needs mowing','Needs disking','Needs grading','Ready with minor touch-up','Unknown'] },
          { name:'equipmentNeeded', label:'Equipment Needed', type:'select', options:['Tractor + disk','Dozer','Skid steer','Mower','Hand tools','Subcontractor likely needed'] },
          { name:'notes', label:'Firebreak Notes', type:'textarea' }
        ]
      },

      wildlife_management_plan: {
        label: 'Wildlife Management Plan',
        defaultName: 'Wildlife Management Plan',
        classification: 'Wildlife management planning',
        description: 'Develop a property-specific wildlife management plan with objectives, habitat priorities, implementation steps, and monitoring recommendations.',
        clientNotes: 'SHC will organize management recommendations by priority, expected benefit, cost range, and practical implementation schedule.',
        fields: [
          { name:'primarySpecies', label:'Primary Target Species', type:'select', options:['White-tailed deer','Wild turkey','Bobwhite quail','Waterfowl','General wildlife','Multi-species'] },
          { name:'planScope', label:'Plan Scope', type:'select', options:['Basic plan','Full property plan','Annual update','Implementation plan','EQIP / agency support plan','Client presentation version'] },
          { name:'propertyAcres', label:'Planning Acres', type:'number', step:'0.01' },
          { name:'priorityIssues', label:'Priority Issues', type:'textarea' },
          { name:'deliverable', label:'Deliverable', type:'select', options:['PDF plan','Map + recommendations','Annual task list','Full report + task orders'] }
        ]
      },

      deer_management_consult: {
        label: 'Deer Herd / Harvest Consultation',
        defaultName: 'Deer Herd and Harvest Consultation',
        classification: 'Deer management consultation',
        description: 'Evaluate deer herd goals, harvest strategy, habitat conditions, camera data, and property-level deer management recommendations.',
        clientNotes: 'SHC will review available harvest records, camera observations, property objectives, and habitat limitations before recommending harvest or habitat changes.',
        fields: [
          { name:'objective', label:'Primary Objective', type:'select', options:['Increase buck age class','Improve herd balance','Improve fawn recruitment','Reduce browse pressure','Trophy management','Family hunting property','General guidance'] },
          { name:'dataAvailable', label:'Data Available', type:'select', options:['Camera survey','Harvest records','Observation logs','None yet','Partial data'] },
          { name:'consultType', label:'Consult Type', type:'select', options:['Phone/desktop review','Field visit','Full report','Annual harvest plan','Camera survey add-on'] },
          { name:'notes', label:'Deer Management Notes', type:'textarea' }
        ]
      },

      nuisance_wildlife_control: {
        label: 'Nuisance Wildlife Control',
        defaultName: 'Nuisance Wildlife Control',
        classification: 'Nuisance wildlife / damage management',
        description: 'Evaluate and address nuisance wildlife damage or conflicts using appropriate control, exclusion, monitoring, or removal strategies.',
        clientNotes: 'SHC will confirm target species, damage type, access, legal requirements, and the most practical response option before implementation.',
        fields: [
          { name:'targetSpecies', label:'Target Species', type:'select', options:['Beaver','Feral hog','Coyote','Raccoon','Skunk','Armadillo','Nutria','Otter','Alligator','Other'] },
          { name:'damageType', label:'Damage Type', type:'select', options:['Timber flooding','Road / culvert damage','Food plot damage','Pasture damage','Pond / bank damage','Predation concern','Structural conflict','Other'] },
          { name:'controlMethod', label:'Control Method', type:'select', options:['Site assessment','Trapping','Removal coordination','Exclusion','Monitoring','Agency permit support','Other'] },
          { name:'urgency', label:'Urgency', type:'select', options:['Routine','High priority','Emergency / active damage','Monitor only'] },
          { name:'notes', label:'Wildlife Control Notes', type:'textarea' }
        ]
      },

      pond_aquatic_management: {
        label: 'Pond / Aquatic Vegetation Management',
        defaultName: 'Pond and Aquatic Vegetation Management',
        classification: 'Pond / aquatic vegetation management',
        description: 'Assess pond or aquatic vegetation issues and recommend treatment, monitoring, or maintenance actions.',
        clientNotes: 'SHC will evaluate aquatic vegetation type, treatment area, timing, access, and label-compliant treatment options before implementation.',
        fields: [
          { name:'waterbodyType', label:'Waterbody Type', type:'select', options:['Farm pond','Retention pond','Canal / ditch','Wetland edge','Lake edge','Unknown'] },
          { name:'targetVegetation', label:'Target Vegetation', type:'text' },
          { name:'treatmentArea', label:'Treatment Area', type:'text' },
          { name:'method', label:'Management Method', type:'select', options:['Aquatic herbicide','Mechanical removal','Shoreline treatment','Monitoring only','Integrated approach'] },
          { name:'notes', label:'Aquatic Notes', type:'textarea' }
        ]
      },

      gis_mapping_documentation: {
        label: 'GIS Mapping / Documentation',
        defaultName: 'GIS Mapping and Field Documentation',
        classification: 'GIS mapping / field documentation',
        description: 'Create maps, treatment documentation, field notes, or property layers for landowner planning and project tracking.',
        clientNotes: 'SHC will organize field observations and management areas into clear maps or documentation for client review.',
        fields: [
          { name:'mapType', label:'Map Type', type:'select', options:['Property overview','Treatment map','Burn-unit map','Food plot map','Invasive species map','Access map','Before/after documentation'] },
          { name:'deliverable', label:'Deliverable', type:'select', options:['PDF map','GIS files','Portal map layer','Photo report','Treatment documentation package'] },
          { name:'fieldDataNeeded', label:'Field Data Needed', type:'textarea' },
          { name:'notes', label:'Mapping Notes', type:'textarea' }
        ]
      },

      custom: {
        label: 'Custom / Other Service',
        defaultName: 'Custom SHC Service',
        classification: 'Custom service',
        description: 'Custom Southern Habitat Consulting project or recommendation.',
        clientNotes: 'SHC will define the scope, cost, timing, and deliverables after reviewing the property objective.',
        fields: [
          { name:'serviceDescription', label:'Service Description', type:'textarea' },
          { name:'objective', label:'Objective', type:'textarea' },
          { name:'deliverable', label:'Deliverable', type:'text' },
          { name:'notes', label:'Notes', type:'textarea' }
        ]
      }
    };
  }

  function renderServiceDetails(serviceType, details) {
    var template = getServiceTemplate(serviceType);

    if (!template) {
      return '<div style="background:#f8f6ef;border:1px solid var(--border);padding:12px 14px;border-radius:4px">' +
        '<h3 style="margin:0 0 6px;font-size:15px;color:var(--forest)">Service Details</h3>' +
        '<p style="font-size:13px;color:var(--moss);margin:0">Choose a service type to show service-specific fields.</p>' +
      '</div>';
    }

    return '<div style="background:#f8f6ef;border:1px solid var(--border);padding:12px 14px;border-radius:4px">' +
      '<h3 style="margin:0 0 6px;font-size:15px;color:var(--forest)">Service Details — ' + esc(template.label) + '</h3>' +
      '<p style="font-size:12.5px;color:var(--moss);margin:0 0 12px">These fields save with the project as structured service specifications.</p>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
        template.fields.map(function (f) { return renderServiceField(f, details ? details[f.name] : ''); }).join('') +
      '</div>' +
    '</div>';
  }

  function renderServiceField(f, value) {
    var val = value === null || value === undefined ? '' : value;
    var commonStyle = 'width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px;background:#fff;color:var(--charcoal)';
    var label = '<label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">' + esc(f.label) + '</label>';
    var fieldName = 'detail_' + f.name;

    if (f.type === 'textarea') {
      return '<div style="grid-column:1/-1">' + label +
        '<textarea data-service-detail="1" data-detail-key="' + esc(f.name) + '" name="' + esc(fieldName) + '" rows="3" style="' + commonStyle + '">' + esc(val) + '</textarea>' +
      '</div>';
    }

    if (f.type === 'select') {
      return '<div>' + label +
        '<select data-service-detail="1" data-detail-key="' + esc(f.name) + '" name="' + esc(fieldName) + '" style="' + commonStyle + '">' +
          '<option value="">Select</option>' +
          (f.options || []).map(function (opt) {
            return '<option value="' + esc(opt) + '"' + (String(val) === String(opt) ? ' selected' : '') + '>' + esc(opt) + '</option>';
          }).join('') +
        '</select>' +
      '</div>';
    }

    return '<div>' + label +
      '<input data-service-detail="1" data-detail-key="' + esc(f.name) + '" name="' + esc(fieldName) + '" value="' + esc(val) + '" type="' + esc(f.type || 'text') + '" ' + (f.step ? 'step="' + esc(f.step) + '"' : '') + ' style="' + commonStyle + '">' +
    '</div>';
  }

  function collectServiceDetails(form) {
    var details = {};
    form.querySelectorAll('[data-service-detail="1"]').forEach(function (el) {
      var key = el.dataset.detailKey;
      details[key] = el.value;
    });
    return details;
  }

  function applyServiceTemplate(form, serviceType) {
    var template = getServiceTemplate(serviceType);
    if (!template) return;

    setIfEmpty(form.elements.name, template.defaultName);
    setIfEmpty(form.elements.classification, template.classification);
    setIfEmpty(form.elements.description, template.description);
    setIfEmpty(form.elements.client_notes, template.clientNotes);

    if (form.elements.status && !form.elements.status.value) {
      form.elements.status.value = 'draft';
    }
  }

  function setIfEmpty(el, value) {
    if (!el || value === undefined || value === null) return;
    if (!el.value || !String(el.value).trim()) el.value = value;
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
    if (project.estimated_cost !== null && project.estimated_cost !== undefined) return Number(project.estimated_cost) > 10000 ? Number(project.estimated_cost) : Math.round(Number(project.estimated_cost) * 100);
    return null;
  }

  function projectEstimatedDollars(project) {
    if (!project) return '';
    if (project.estimatedCostCents !== null && project.estimatedCostCents !== undefined) return project.estimatedCostCents / 100;
    if (project.estimated_cost !== null && project.estimated_cost !== undefined) return Number(project.estimated_cost) > 10000 ? Number(project.estimated_cost) / 100 : project.estimated_cost;
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
