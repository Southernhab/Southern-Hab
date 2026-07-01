// SHC Landowner Portal — Authenticated SPA
// Depends on: firebase-client.js, auth.js, api.js (loaded in portal/app/index.html)

(function () {
  'use strict';

  var api = window.shcApi;

  var state = {
    profile:     null,
    clientId:    null,
    properties:  [],
    propertyId:  null,
    property:    null,
    section:     'overview'
  };

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  async function init() {
    var auth = await window.shcAuth.requireAuth();
    if (!auth) return;

    // Require client role
    if (!window.shcAuth.isClient(auth.profile)) {
      // Staff who land here get sent to admin
      if (window.shcAuth.isStaff(auth.profile)) {
        window.location.replace('/admin/');
        return;
      }
      window.location.replace('/portal/unauthorized/?reason=role');
      return;
    }

    state.profile = auth.profile;
    renderUserInfo();
    setupSidebar();
    setupSignOut();

    // Load client context from Firebase custom claims (set by Cloud Function at invite time)
    var clientIds = await window.shcAuth.getClientIds();
    state.clientId = clientIds[0] || null;
    if (state.clientId) {
      window.shcDb.collection('clients').doc(state.clientId).get().then(function (snap) {
        if (snap.exists) {
          document.getElementById('sb-user-client').textContent = snap.data().displayName || '';
        }
      }).catch(function () {});
    }

    // Load properties
    state.properties = await api.getMyProperties().catch(function () { return []; });
    buildPropertySelector();

    // Resolve initial property from URL or first available
    var params = new URLSearchParams(window.location.search);
    var savedId = params.get('property') || localStorage.getItem('shc_property_id');
    var found = state.properties.find(function (p) { return p.id === savedId; });
    state.propertyId = found ? found.id : (state.properties[0] && state.properties[0].id);
    state.property   = found || state.properties[0] || null;
    updatePropertySelector();

    // Show the shell
    document.getElementById('portal-shell-wrap').classList.add('ready');

    // Route based on hash
    routeFromHash();
    window.addEventListener('hashchange', routeFromHash);
    document.getElementById('property-selector').addEventListener('change', onPropertyChange);

    // Load notification count
    loadNotifications();
  }

  // ── User info ─────────────────────────────────────────────────────────────
  function renderUserInfo() {
    var firstName = state.profile.first_name || '';
    var lastName  = state.profile.last_name  || '';
    var full = (firstName + ' ' + lastName).trim() || state.profile.email;
    document.getElementById('sb-user-name').textContent = full;
    document.getElementById('topbar-user').textContent  = firstName || full;
  }

  // ── Property selector ─────────────────────────────────────────────────────
  function buildPropertySelector() {
    var sel = document.getElementById('property-selector');
    sel.innerHTML = '';
    if (!state.properties.length) {
      var opt = document.createElement('option');
      opt.value = ''; opt.textContent = 'No properties assigned';
      sel.appendChild(opt);
      return;
    }
    state.properties.forEach(function (p) {
      var opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name + ' \u2014 ' + (p.acreage ? Math.round(p.acreage) + ' ac' : p.county || '');
      sel.appendChild(opt);
    });
  }

  function updatePropertySelector() {
    var sel = document.getElementById('property-selector');
    if (state.propertyId) sel.value = state.propertyId;
  }

  function onPropertyChange() {
    var sel = document.getElementById('property-selector');
    state.propertyId = sel.value;
    state.property   = state.properties.find(function (p) { return p.id === state.propertyId; }) || null;
    localStorage.setItem('shc_property_id', state.propertyId);
    renderSection(state.section);
  }

  // ── Routing ───────────────────────────────────────────────────────────────
  var validSections = ['overview','property','work','wildlife','plan','reports','messages','map','account'];

  function routeFromHash() {
    var hash = window.location.hash.replace('#', '').split('?')[0];
    state.section = validSections.indexOf(hash) !== -1 ? hash : 'overview';
    updateNavActive();
    renderSection(state.section);
  }

  function updateNavActive() {
    document.querySelectorAll('.nav-link').forEach(function (a) {
      a.classList.toggle('active', a.dataset.section === state.section);
    });
  }

  // ── Sign out ──────────────────────────────────────────────────────────────
  function setupSignOut() {
    document.getElementById('sign-out-link').addEventListener('click', function (e) {
      e.preventDefault();
      window.shcAuth.signOut();
    });
  }

  // ── Sidebar ───────────────────────────────────────────────────────────────
  function setupSidebar() {
    var sidebar  = document.getElementById('portal-sidebar');
    var overlay  = document.getElementById('sidebar-overlay');
    var menuBtn  = document.querySelector('.topbar-menu-btn');
    if (!sidebar || !menuBtn) return;

    function openSidebar() {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('visible');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.textContent = '\u2715';
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('visible');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.textContent = '\u2630';
    }
    menuBtn.addEventListener('click', function () {
      sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });
    if (overlay) overlay.addEventListener('click', closeSidebar);
    sidebar.querySelectorAll('a[data-section]').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth <= 900) closeSidebar();
      });
    });
  }

  // ── Notifications ─────────────────────────────────────────────────────────
  async function loadNotifications() {
    try {
      var msgs = await api.getMessages(state.clientId);
      var unread = msgs.filter(function (m) { return m.status === 'open' || m.status === 'in_progress'; });
      var badge = document.getElementById('msg-badge');
      if (badge && unread.length > 0) {
        badge.textContent = unread.length;
        badge.style.display = '';
      }
    } catch (e) {}
  }

  // ── Utility ───────────────────────────────────────────────────────────────
  function el(html) {
    var div = document.createElement('div');
    div.innerHTML = html;
    return div.firstElementChild;
  }

  function setContent(html) {
    document.getElementById('portal-content').innerHTML = html;
  }

  function loading() {
    setContent('<div class="content-loading">Loading\u2026</div>');
  }

  function errHtml(msg) {
    return '<div class="content-error">' + msg + '</div>';
  }

  function noProperty() {
    return '<div class="portal-page"><div class="content-empty">No property is assigned to your account. Contact SHC for assistance.</div></div>';
  }

  function statusChip(status) {
    var map = {
      planned:   'chip chip-blue',   scheduled: 'chip chip-blue',
      active:    'chip chip-green',  complete:  'chip chip-green',
      deferred:  'chip',             cancelled: 'chip'
    };
    return '<span class="' + (map[status] || 'chip') + '">' + status + '</span>';
  }

  function classChip(c) {
    var cls = c === 'Essential' ? 'chip chip-gold' : c === 'Recommended' ? 'chip chip-blue' : 'chip';
    return '<span class="' + cls + '">' + (c || '') + '</span>';
  }

  // ── Section router ────────────────────────────────────────────────────────
  function renderSection(section) {
    switch (section) {
      case 'overview':  renderOverview();  break;
      case 'property':  renderProperty();  break;
      case 'work':      renderWork();      break;
      case 'wildlife':  renderWildlife();  break;
      case 'plan':      renderPlan();      break;
      case 'reports':   renderReports();   break;
      case 'messages':  renderMessages();  break;
      case 'map':       renderMap();       break;
      case 'account':   renderAccount();   break;
      default:          renderOverview();
    }
  }

  // ── OVERVIEW ─────────────────────────────────────────────────────────────
  async function renderOverview() {
    if (!state.propertyId) { setContent(noProperty()); return; }
    loading();
    try {
      var ov = await api.getPropertyOverview(state.propertyId);
      var projects = await api.getProjects(state.propertyId);
      var awaiting = projects.filter(function (p) { return p.client_review_status === 'awaiting_review'; });
      var recent   = await api.getWorkHistory(state.propertyId).catch(function () { return []; });

      var attnHtml = awaiting.length ? awaiting.slice(0, 5).map(function (p) {
        return '<li class="attention-item">' +
          '<div class="attn-dot dot-red"></div>' +
          '<div style="flex:1">' +
            '<p class="attn-title">' + esc(p.name) + '</p>' +
            '<p class="attn-desc">' + esc(p.client_notes || p.description || '') + '</p>' +
          '</div>' +
          '<a href="#work" class="btn btn-ghost btn-sm">Review &rarr;</a>' +
        '</li>';
      }).join('') : '<li style="padding:12px 0;color:var(--moss);font-size:13px">No items require your attention at this time.</li>';

      var recentHtml = recent.slice(0, 4).map(function (w) {
        return '<li class="attention-item">' +
          '<div class="attn-dot dot-green"></div>' +
          '<div style="flex:1">' +
            '<p class="attn-title">' + esc(w.work_type || 'Field Work') + '</p>' +
            '<p class="attn-desc">' + api.formatDate(w.completion_date) + (w.acres_or_quantity ? ' &middot; ' + w.acres_or_quantity + ' ac' : '') + '</p>' +
          '</div>' +
        '</li>';
      }).join('');

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading"><h1>Overview</h1>' +
          '<p class="page-sub">' + esc(ov.property_name) + ' &middot; ' + (ov.county || '') + ', ' + (ov.state || '') + ' &middot; Last updated by SHC</p></div>' +

          '<div class="metric-row">' +
            metricCard('Total Acreage', ov.acreage ? Math.round(ov.acreage) : '—', 'acres under management') +
            metricCard('Management Progress', (ov.management_progress_pct || 0) + '%', 'toward desired condition') +
            metricCard('Work Completed (' + new Date().getFullYear() + ')', ov.work_completed_this_year || 0, 'treatments completed this year') +
            metricCard('Active Projects', ov.active_projects || 0, (ov.projects_awaiting_review || 0) + ' awaiting your review') +
          '</div>' +

          '<div class="two-col">' +
            '<div>' +
              '<div class="panel"><div class="panel-header"><h2>Management Attention Required</h2>' +
              (awaiting.length ? '<a href="#work" class="btn btn-ghost btn-sm">View all projects &rarr;</a>' : '') +
              '</div><ul class="attention-list">' + attnHtml + '</ul></div>' +

              (recent.length ? '<div class="panel"><div class="panel-header"><h2>Recent SHC Activity</h2></div>' +
              '<ul class="attention-list">' + recentHtml + '</ul></div>' : '') +
            '</div>' +
            '<div>' +
              '<div class="panel"><div class="panel-header"><h2>Schedule</h2></div>' +
              '<div class="panel-body-p">' +
                (ov.next_review_date ? '<p style="font-size:13px"><strong>Next Property Review:</strong><br>' + api.formatDate(ov.next_review_date) + '</p>' : '') +
              '</div></div>' +

              '<div class="panel"><div class="panel-header"><h2>Budget Summary</h2>' +
              '<a href="#plan" class="btn btn-ghost btn-sm">Full plan &rarr;</a></div>' +
              '<div class="panel-body-p">' +
                budgetRow('Current Year Estimated', ov.current_year_estimated) +
                budgetRow('Five-Year Estimated', ov.five_year_estimated) +
              '</div></div>' +
            '</div>' +
          '</div>' +
        '</div>'
      );
    } catch (e) {
      setContent('<div class="portal-page">' + errHtml('Could not load overview: ' + e.message) + '</div>');
    }
  }

  function metricCard(label, value, sub) {
    return '<div class="metric-card"><div class="metric-label">' + label + '</div>' +
      '<div class="metric-value">' + value + '</div>' +
      '<div class="metric-sub">' + sub + '</div></div>';
  }

  function budgetRow(label, value) {
    return '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">' +
      '<span style="color:var(--charcoal)">' + label + '</span>' +
      '<span style="font-weight:700;color:var(--forest)">' + api.formatCurrency(value) + '</span></div>';
  }

  // ── PROPERTY ──────────────────────────────────────────────────────────────
  async function renderProperty() {
    if (!state.propertyId) { setContent(noProperty()); return; }
    loading();
    try {
      var prop     = state.property || await api.getMyProperties().then(function (ps) { return ps.find(function (p) { return p.id === state.propertyId; }); });
      var sections = await api.getPropertySections(state.propertyId);

      var sectHtml = sections.length ? sections.map(function (s) {
        return '<div class="panel" style="margin-bottom:16px">' +
          '<div class="panel-header"><h2>' + esc(s.name) + '</h2>' +
          '<span>' + (s.acres ? Math.round(s.acres) + ' ac' : '') + ' &middot; ' + esc(s.habitat_type || '') + '</span></div>' +
          '<div class="panel-body-p" style="display:grid;grid-template-columns:1fr 1fr;gap:0">' +
            propRow('Condition', s.current_condition) +
            propRow('Desired Condition', s.desired_condition) +
            propRow('Management Stage', s.management_stage) +
            propRow('Progress', s.progress_percent != null ? s.progress_percent + '%' : '—') +
            propRow('Primary Objectives', s.primary_objectives) +
            propRow('Target Species', s.target_species) +
            propRow('Limiting Factors', s.limiting_factors) +
            propRow('Next Action', s.recommended_next_action) +
          '</div>' +
          (s.client_visible_notes ? '<div style="padding:12px 16px;background:#F8F7F2;border-top:1px solid var(--border);font-size:13px;color:var(--charcoal);line-height:1.6"><strong>SHC Notes:</strong> ' + esc(s.client_visible_notes) + '</div>' : '') +
        '</div>';
      }).join('') : '<div class="content-empty">No property sections have been added yet.</div>';

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading"><h1>My Property</h1>' +
          '<p class="page-sub">' + esc(prop.name) + ' &middot; ' + (prop.acreage ? Math.round(prop.acreage) + ' acres' : '') + ' &middot; ' + esc(prop.county || '') + ', AL</p></div>' +
          (prop.management_summary_client ? '<div class="panel" style="margin-bottom:20px"><div class="panel-body-p"><p style="font-size:13.5px;line-height:1.7;margin:0">' + esc(prop.management_summary_client) + '</p></div></div>' : '') +
          sectHtml +
        '</div>'
      );
    } catch (e) {
      setContent('<div class="portal-page">' + errHtml('Could not load property: ' + e.message) + '</div>');
    }
  }

  function propRow(label, value) {
    return '<div style="padding:10px 16px;border-bottom:1px solid var(--border)">' +
      '<div style="font-size:11px;font-weight:600;color:var(--moss);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px">' + label + '</div>' +
      '<div style="font-size:13px;color:var(--charcoal)">' + esc(value || '—') + '</div></div>';
  }

  // ── WORK & PROJECTS ───────────────────────────────────────────────────────
  async function renderWork() {
    if (!state.propertyId) { setContent(noProperty()); return; }
    loading();
    try {
      var projects = await api.getProjects(state.propertyId);
      var history  = await api.getWorkHistory(state.propertyId);

      var awaiting  = projects.filter(function (p) { return p.client_review_status === 'awaiting_review'; });
      var active    = projects.filter(function (p) { return p.status === 'active' || p.status === 'scheduled'; });
      var planned   = projects.filter(function (p) { return p.status === 'planned' && p.client_review_status !== 'awaiting_review'; });
      var past      = history.slice(0, 20);

      var notice = '<div class="action-notice">Portal actions (preliminary approval, defer, or respond) do not replace a signed contract or formal written authorization. SHC staff will follow up to confirm before work begins.</div>';

      var tabs = [
        { id: 'awaiting', label: 'Awaiting Your Review (' + awaiting.length + ')',  items: awaiting,  type: 'project', notice: true },
        { id: 'active',   label: 'Active Work (' + active.length + ')',              items: active,    type: 'project', notice: false },
        { id: 'planned',  label: 'Planned Projects (' + planned.length + ')',        items: planned,   type: 'project', notice: false },
        { id: 'past',     label: 'Past Work (' + past.length + ')',                  items: past,      type: 'work',    notice: false }
      ];

      var tabBarHtml = tabs.map(function (t, i) {
        return '<button class="tab-btn' + (i === 0 ? ' active' : '') + '" data-tab="' + t.id + '">' + t.label + '</button>';
      }).join('');

      var tabPanels = tabs.map(function (t, i) {
        var itemsHtml = t.items.length ? t.items.map(function (item) {
          return t.type === 'project' ? renderProjectCard(item) : renderWorkCard(item);
        }).join('') : '<div class="content-empty">No records in this category.</div>';

        return '<div class="tab-panel' + (i === 0 ? ' active' : '') + '" id="tab-' + t.id + '">' +
          (t.notice ? notice : '') + itemsHtml + '</div>';
      }).join('');

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading"><h1>Work &amp; Projects</h1></div>' +
          '<div class="tab-container">' +
            '<div class="tab-bar">' + tabBarHtml + '</div>' +
            tabPanels +
          '</div>' +
        '</div>'
      );

      // Activate tabs
      document.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
          document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
          btn.classList.add('active');
          var panel = document.getElementById('tab-' + btn.dataset.tab);
          if (panel) panel.classList.add('active');
        });
      });

      // Project action buttons
      document.querySelectorAll('[data-project-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          handleProjectAction(btn.dataset.projectId, btn.dataset.projectAction);
        });
      });

    } catch (e) {
      setContent('<div class="portal-page">' + errHtml('Could not load work records: ' + e.message) + '</div>');
    }
  }

  function renderProjectCard(p) {
    var actionBtns = '';
    if (p.client_review_status === 'awaiting_review') {
      actionBtns = '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">' +
        '<button class="btn btn-sm" data-project-action="preliminary_approval" data-project-id="' + p.id + '" style="background:var(--forest);color:#fff">Preliminary Approval</button>' +
        '<button class="btn btn-ghost btn-sm" data-project-action="defer" data-project-id="' + p.id + '">Defer</button>' +
        '<button class="btn btn-ghost btn-sm" data-project-action="request_proposal" data-project-id="' + p.id + '">Request Proposal</button>' +
        '<button class="btn btn-ghost btn-sm" data-project-action="question" data-project-id="' + p.id + '">Ask a Question</button>' +
      '</div>';
    }
    return '<div class="card-row" style="background:#fff;border:1px solid var(--border);border-radius:4px;padding:16px;margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">' +
        '<div style="flex:1">' +
          '<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap">' +
            '<strong style="font-size:14px;color:var(--charcoal)">' + esc(p.name) + '</strong>' +
            statusChip(p.status) + classChip(p.classification) +
          '</div>' +
          '<p style="font-size:13px;color:var(--moss);margin:0 0 6px">' + esc(p.client_notes || p.description || '') + '</p>' +
          (p.estimated_cost ? '<p style="font-size:12px;color:var(--charcoal);margin:0">Estimated: <strong>' + api.formatCurrency(p.estimated_cost) + '</strong></p>' : '') +
        '</div>' +
        '<div style="text-align:right;font-size:12px;color:var(--moss)">' +
          (p.planned_start_date ? api.formatDate(p.planned_start_date) : '') +
        '</div>' +
      '</div>' +
      actionBtns +
    '</div>';
  }

  function renderWorkCard(w) {
    return '<div style="background:#fff;border:1px solid var(--border);border-radius:4px;padding:14px;margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">' +
        '<div><strong style="font-size:13.5px;color:var(--charcoal)">' + esc(w.work_type || 'Field Work') + '</strong>' +
        (w.scope ? '<p style="font-size:12.5px;color:var(--moss);margin:4px 0 0">' + esc(w.scope) + '</p>' : '') + '</div>' +
        '<div style="text-align:right;font-size:12px;color:var(--moss)">' +
          api.formatDate(w.completion_date) +
          (w.final_cost ? '<br><strong>' + api.formatCurrency(w.final_cost) + '</strong>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  async function handleProjectAction(projectId, actionType) {
    var comments = '';
    if (actionType === 'question' || actionType === 'defer') {
      comments = window.prompt('Add a comment or question (optional):') || '';
    }
    try {
      await api.submitProjectAction(projectId, actionType, comments);
      alert('Your response has been sent to SHC. A team member will follow up. Remember: portal actions do not replace a signed contract or formal authorization.');
      renderWork();
    } catch (e) {
      alert('Could not submit your response: ' + e.message);
    }
  }

  // ── WILDLIFE ──────────────────────────────────────────────────────────────
  async function renderWildlife() {
    if (!state.propertyId) { setContent(noProperty()); return; }
    loading();
    try {
      var surveys  = await api.getWildlifeSurveys(state.propertyId);
      var harvests = await api.getHarvestRecords(state.propertyId);

      var surveysHtml = surveys.length ? surveys.map(function (s) {
        return '<div style="background:#fff;border:1px solid var(--border);border-radius:4px;padding:14px;margin-bottom:12px">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:8px">' +
            '<strong style="font-size:13.5px;color:var(--charcoal)">' + esc(s.survey_type || 'Wildlife Survey') + '</strong>' +
            '<span style="font-size:12px;color:var(--moss)">' + api.formatDate(s.survey_date) + '</span>' +
          '</div>' +
          (s.professional_interpretation ? '<p style="font-size:13px;color:var(--charcoal);line-height:1.65;margin:0">' + esc(s.professional_interpretation) + '</p>' : '') +
        '</div>';
      }).join('') : '<div class="content-empty">No wildlife surveys have been published for this property yet.</div>';

      var harvestHtml = harvests.length ? '<table class="data-table" style="margin-top:0"><thead><tr><th>Species</th><th>Date</th><th>Sex</th><th>Age</th><th>Weight</th></tr></thead><tbody>' +
        harvests.map(function (h) {
          return '<tr><td>' + esc(h.species || '—') + '</td><td>' + api.formatDate(h.harvest_date) + '</td><td>' + esc(h.sex || '—') + '</td><td>' + esc(h.age_class || '—') + '</td><td>' + (h.weight ? h.weight + ' lbs' : '—') + '</td></tr>';
        }).join('') + '</tbody></table>' : '<div class="content-empty">No harvest records found.</div>';

      var tabBarHtml = '<button class="tab-btn active" data-tab="surveys">Wildlife Surveys (' + surveys.length + ')</button>' +
        '<button class="tab-btn" data-tab="harvest">Harvest Records (' + harvests.length + ')</button>';

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading"><h1>Wildlife Analysis</h1></div>' +
          '<div class="tab-container">' +
            '<div class="tab-bar">' + tabBarHtml + '</div>' +
            '<div class="tab-panel active" id="tab-surveys">' + surveysHtml + '</div>' +
            '<div class="tab-panel" id="tab-harvest">' + harvestHtml + '</div>' +
          '</div>' +
        '</div>'
      );

      document.querySelectorAll('.tab-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.remove('active'); });
          document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
          btn.classList.add('active');
          var panel = document.getElementById('tab-' + btn.dataset.tab);
          if (panel) panel.classList.add('active');
        });
      });
    } catch (e) {
      setContent('<div class="portal-page">' + errHtml('Could not load wildlife data: ' + e.message) + '</div>');
    }
  }

  // ── PLAN & BUDGET ─────────────────────────────────────────────────────────
  async function renderPlan() {
    if (!state.propertyId) { setContent(noProperty()); return; }
    loading();
    try {
      var budgets = await api.getBudgets(state.propertyId);
      var currentYear = new Date().getFullYear();
      var currentBudget = budgets.find(function (b) { return b.budget_year === currentYear; }) || budgets[0];

      var items = currentBudget ? await api.getBudgetItems(currentBudget.id) : [];

      var summaryHtml = currentBudget ? (
        '<div class="metric-row" style="margin-bottom:20px">' +
          metricCard('Estimated Total',  currentBudget.estimated_total,  'all planned work') +
          metricCard('Approved',         currentBudget.approved_total,   'authorized') +
          metricCard('Invoiced',         currentBudget.invoiced_total,   'billed to date') +
          metricCard('Paid',             currentBudget.paid_total,       'settled') +
        '</div>' +
        (currentBudget.client_visible_notes ? '<div class="panel" style="margin-bottom:16px"><div class="panel-body-p"><p style="font-size:13px;line-height:1.65;margin:0">' + esc(currentBudget.client_visible_notes) + '</p></div></div>' : '')
      ) : '<div class="content-empty">No budget has been published for this property yet.</div>';

      var itemsHtml = items.length ? (
        '<table class="data-table"><thead><tr>' +
          '<th>Practice</th><th>Classification</th><th>Season</th>' +
          '<th style="text-align:right">Estimated</th><th style="text-align:right">Paid</th>' +
        '</tr></thead><tbody>' +
        items.map(function (item) {
          return '<tr><td>' + esc(item.practice || '—') + '</td>' +
            '<td>' + classChip(item.classification) + '</td>' +
            '<td>' + esc(item.planned_season || '—') + ' ' + (item.planned_year || '') + '</td>' +
            '<td style="text-align:right">' + api.formatCurrency(item.estimated_cost) + '</td>' +
            '<td style="text-align:right">' + api.formatCurrency(item.paid_cost) + '</td>' +
          '</tr>';
        }).join('') + '</tbody></table>'
      ) : '';

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading"><h1>Plan &amp; Budget</h1>' +
          (currentBudget ? '<p class="page-sub">' + esc(currentBudget.name) + '</p>' : '') +
          '</div>' +
          summaryHtml +
          (items.length ? '<div class="panel"><div class="panel-header"><h2>Budget Detail</h2></div>' + itemsHtml + '</div>' : '') +
        '</div>'
      );
    } catch (e) {
      setContent('<div class="portal-page">' + errHtml('Could not load budget data: ' + e.message) + '</div>');
    }
  }

  // ── REPORTS & FILES ───────────────────────────────────────────────────────
  async function renderReports() {
    if (!state.clientId) { setContent(noProperty()); return; }
    loading();
    try {
      var docs = await api.getDocuments(state.clientId, { propertyId: state.propertyId });

      var docsHtml = docs.length ? docs.map(function (d) {
        return '<div style="background:#fff;border:1px solid var(--border);border-radius:4px;padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px">' +
          '<div>' +
            '<div style="font-size:13.5px;font-weight:600;color:var(--charcoal)">' + esc(d.title) + '</div>' +
            '<div style="font-size:12px;color:var(--moss);margin-top:2px">' +
              esc(d.document_type || '') + (d.published_at ? ' &middot; ' + api.formatDate(d.published_at) : '') +
              (d.original_filename ? ' &middot; ' + esc(d.original_filename) : '') +
            '</div>' +
          '</div>' +
          '<button class="btn btn-ghost btn-sm" data-doc-id="' + d.id + '" data-doc-name="' + esc(d.original_filename || d.title) + '">Download</button>' +
        '</div>';
      }).join('') : '<div class="content-empty">No published reports or documents are available for this property yet. Contact SHC if you expected to see a specific file.</div>';

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading"><h1>Reports &amp; Files</h1></div>' +
          docsHtml +
        '</div>'
      );

      document.querySelectorAll('[data-doc-id]').forEach(function (btn) {
        btn.addEventListener('click', async function () {
          btn.disabled = true;
          btn.textContent = 'Preparing\u2026';
          try {
            var url = await api.getDocumentUrl(btn.dataset.docId);
            var a = document.createElement('a');
            a.href = url; a.download = btn.dataset.docName || 'document';
            document.body.appendChild(a); a.click(); document.body.removeChild(a);
          } catch (e) {
            alert('Could not download this file: ' + e.message);
          } finally {
            btn.disabled = false; btn.textContent = 'Download';
          }
        });
      });
    } catch (e) {
      setContent('<div class="portal-page">' + errHtml('Could not load documents: ' + e.message) + '</div>');
    }
  }

  // ── MESSAGES ──────────────────────────────────────────────────────────────
  async function renderMessages() {
    if (!state.clientId) { setContent(noProperty()); return; }
    loading();
    try {
      var messages = await api.getMessages(state.clientId);

      var listHtml = messages.length ? messages.map(function (m) {
        return '<div class="msg-thread-item' + (m.status === 'open' || m.status === 'in_progress' ? ' active' : '') + '" data-msg-id="' + m.id + '" style="cursor:pointer;background:#fff;border:1px solid var(--border);border-radius:4px;padding:14px;margin-bottom:8px">' +
          '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">' +
            '<div>' +
              '<strong style="font-size:13.5px;color:var(--charcoal)">' + esc(m.subject) + '</strong>' +
              '<div style="font-size:12px;color:var(--moss);margin-top:3px">' + esc(m.category || 'general') + ' &middot; ' + api.formatDate(m.created_at) + '</div>' +
            '</div>' +
            '<span class="chip ' + (m.status === 'open' ? 'chip-blue' : m.status === 'resolved' ? 'chip-green' : '') + '">' + esc(m.status) + '</span>' +
          '</div>' +
        '</div>';
      }).join('') : '<div class="content-empty">No messages yet. Use the button below to start a conversation with SHC.</div>';

      setContent(
        '<div class="portal-page">' +
          '<div class="page-heading"><h1>Messages</h1>' +
          '<button class="btn" id="compose-btn" style="background:var(--forest);color:#fff;border:none;padding:.55rem 1.1rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">New Message</button>' +
          '</div>' +
          '<div id="msg-list">' + listHtml + '</div>' +
          '<div id="msg-thread" style="display:none"></div>' +
          '<div id="compose-panel" style="display:none"></div>' +
        '</div>'
      );

      document.getElementById('compose-btn').addEventListener('click', showCompose);

      document.querySelectorAll('[data-msg-id]').forEach(function (item) {
        item.addEventListener('click', function () { loadThread(item.dataset.msgId); });
      });
    } catch (e) {
      setContent('<div class="portal-page">' + errHtml('Could not load messages: ' + e.message) + '</div>');
    }
  }

  async function loadThread(messageId) {
    var entries = await api.getMessageEntries(messageId).catch(function () { return []; });
    var threadEl = document.getElementById('msg-thread');
    var listEl   = document.getElementById('msg-list');
    if (!threadEl || !listEl) return;

    var entriesHtml = entries.map(function (e) {
      var isMe = e.sender_id === state.profile.id;
      return '<div style="display:flex;' + (isMe ? 'justify-content:flex-end' : '') + ';margin-bottom:12px">' +
        '<div style="max-width:75%;background:' + (isMe ? 'var(--forest)' : '#F3EFE4') + ';color:' + (isMe ? '#fff' : 'var(--charcoal)') + ';padding:10px 14px;border-radius:8px;font-size:13px;line-height:1.6">' +
        esc(e.body) + '<div style="font-size:11px;opacity:.65;margin-top:4px">' + api.formatDate(e.created_at) + '</div></div></div>';
    }).join('');

    threadEl.innerHTML = '<div style="margin-bottom:16px"><button class="btn btn-ghost btn-sm" id="back-btn">&larr; All Messages</button></div>' +
      '<div style="background:#fff;border:1px solid var(--border);border-radius:4px;padding:16px;min-height:200px;margin-bottom:12px">' +
      (entriesHtml || '<div class="content-empty">No entries in this thread.</div>') + '</div>' +
      '<form id="reply-form" style="display:flex;gap:8px">' +
        '<textarea id="reply-body" placeholder="Type your reply\u2026" style="flex:1;padding:8px 10px;border:1px solid var(--border);border-radius:3px;font-size:13px;font-family:inherit;resize:vertical;min-height:70px"></textarea>' +
        '<button type="submit" class="btn" style="background:var(--forest);color:#fff;border:none;padding:.6rem 1rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px;align-self:flex-end">Send</button>' +
      '</form>';

    listEl.style.display = 'none';
    threadEl.style.display = '';

    document.getElementById('back-btn').addEventListener('click', function () {
      threadEl.style.display = 'none';
      listEl.style.display = '';
    });

    document.getElementById('reply-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var body = document.getElementById('reply-body').value.trim();
      if (!body) return;
      try {
        await api.replyToMessage(messageId, body);
        loadThread(messageId);
      } catch (err) { alert('Could not send reply: ' + err.message); }
    });
  }

  function showCompose() {
    var composeEl = document.getElementById('compose-panel');
    var listEl    = document.getElementById('msg-list');
    var threadEl  = document.getElementById('msg-thread');
    if (!composeEl) return;

    composeEl.innerHTML = '<div style="margin-bottom:16px"><button class="btn btn-ghost btn-sm" id="compose-back">&larr; All Messages</button></div>' +
      '<div class="panel"><div class="panel-header"><h2>New Message to SHC</h2></div><div class="panel-body-p">' +
      '<form id="compose-form">' +
        '<label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Subject</label>' +
        '<input id="c-subject" type="text" placeholder="Brief subject" style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px;margin-bottom:12px">' +
        '<label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Category</label>' +
        '<select id="c-category" style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px;margin-bottom:12px">' +
          '<option value="general">General</option>' +
          '<option value="question">Question</option>' +
          '<option value="site_visit_request">Request a Site Visit</option>' +
          '<option value="proposal_request">Request a Proposal</option>' +
          '<option value="project_question">Project Question</option>' +
          '<option value="property_issue">Report a Property Issue</option>' +
        '</select>' +
        '<label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">Message</label>' +
        '<textarea id="c-body" placeholder="Your message to SHC\u2026" style="width:100%;border:1px solid var(--border);padding:8px 10px;font-size:13px;font-family:inherit;border-radius:3px;resize:vertical;min-height:120px;margin-bottom:14px"></textarea>' +
        '<button type="submit" class="btn" style="background:var(--forest);color:#fff;border:none;padding:.65rem 1.4rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px">Send Message</button>' +
      '</form></div></div>';

    listEl.style.display = 'none';
    if (threadEl) threadEl.style.display = 'none';
    composeEl.style.display = '';

    document.getElementById('compose-back').addEventListener('click', function () {
      composeEl.style.display = 'none';
      listEl.style.display = '';
    });

    document.getElementById('compose-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var subject  = document.getElementById('c-subject').value.trim();
      var category = document.getElementById('c-category').value;
      var body     = document.getElementById('c-body').value.trim();
      if (!subject || !body) { alert('Please fill in the subject and message.'); return; }
      try {
        await api.sendMessage({ clientId: state.clientId, propertyId: state.propertyId, subject: subject, category: category, body: body });
        renderMessages();
      } catch (err) { alert('Could not send message: ' + err.message); }
    });
  }

  // ── MAP ───────────────────────────────────────────────────────────────────
  async function renderMap() {
    if (!state.propertyId) { setContent(noProperty()); return; }
    loading();
    try {
      var maps = await api.getMaps(state.propertyId);

      var mapsHtml = maps.length ? maps.map(function (m) {
        var embedSrc = m.embed_url || m.arcgis_experience_url || m.arcgis_webmap_url;
        return '<div class="panel" style="margin-bottom:20px">' +
          '<div class="panel-header"><h2>' + esc(m.title) + '</h2></div>' +
          (m.description ? '<div class="panel-body-p" style="padding:10px 16px;font-size:13px;color:var(--charcoal)">' + esc(m.description) + '</div>' : '') +
          (embedSrc ? '<div style="padding:0 16px 16px"><iframe src="' + embedSrc + '" width="100%" height="540" frameborder="0" style="border:1px solid var(--border);border-radius:3px" allowfullscreen title="' + esc(m.title) + '"></iframe></div>' : '<div style="padding:16px;color:var(--moss);font-size:13px">Map embed not available. Contact SHC for access.</div>') +
        '</div>';
      }).join('') : '<div class="content-empty">No maps have been published for this property. Contact SHC if you expected to see a map.</div>';

      setContent('<div class="portal-page"><div class="page-heading"><h1>Property Map</h1></div>' + mapsHtml + '</div>');
    } catch (e) {
      setContent('<div class="portal-page">' + errHtml('Could not load maps: ' + e.message) + '</div>');
    }
  }

  // ── ACCOUNT ───────────────────────────────────────────────────────────────
  async function renderAccount() {
    var p = state.profile;
    setContent(
      '<div class="portal-page">' +
        '<div class="page-heading"><h1>Account</h1></div>' +
        '<div class="panel" style="max-width:520px">' +
          '<div class="panel-header"><h2>Profile</h2></div>' +
          '<div class="panel-body-p">' +
            '<form id="profile-form">' +
              '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">' +
                profileField('First Name', 'first_name', p.first_name) +
                profileField('Last Name',  'last_name',  p.last_name) +
              '</div>' +
              profileField('Phone', 'phone', p.phone) +
              '<button type="submit" class="btn" style="background:var(--forest);color:#fff;border:none;padding:.6rem 1.2rem;font-size:13px;font-weight:600;cursor:pointer;border-radius:3px;margin-top:4px">Save Changes</button>' +
              '<div id="profile-msg" style="font-size:12.5px;margin-top:8px;display:none"></div>' +
            '</form>' +
          '</div>' +
        '</div>' +
        '<div class="panel" style="max-width:520px;margin-top:16px">' +
          '<div class="panel-header"><h2>Password</h2></div>' +
          '<div class="panel-body-p">' +
            '<p style="font-size:13px;color:var(--moss);margin:0 0 12px">To change your password, use the password reset link sent to your email.</p>' +
            '<a href="/portal/reset-password/" class="btn btn-ghost btn-sm">Request Password Reset</a>' +
          '</div>' +
        '</div>' +
        '<div class="panel" style="max-width:520px;margin-top:16px">' +
          '<div class="panel-header"><h2>Your SHC Contact</h2></div>' +
          '<div class="panel-body-p"><p style="font-size:13px;color:var(--charcoal);line-height:1.65;margin:0">Southern Habitat Consulting LLC<br>South Alabama<br><a href="/contact/" style="color:var(--gold)">Contact SHC</a></p></div>' +
        '</div>' +
      '</div>'
    );

    document.getElementById('profile-form').addEventListener('submit', async function (e) {
      e.preventDefault();
      var msgEl = document.getElementById('profile-msg');
      var fields = { first_name: document.getElementById('acc-first_name').value.trim(), last_name: document.getElementById('acc-last_name').value.trim(), phone: document.getElementById('acc-phone').value.trim() };
      try {
        await api.updateProfile(fields);
        state.profile.first_name = fields.first_name;
        state.profile.last_name  = fields.last_name;
        state.profile.phone      = fields.phone;
        renderUserInfo();
        msgEl.style.display = '';
        msgEl.style.color   = '#14532d';
        msgEl.textContent   = 'Profile updated.';
      } catch (err) {
        msgEl.style.display = '';
        msgEl.style.color   = '#7a2020';
        msgEl.textContent   = 'Could not save: ' + err.message;
      }
    });
  }

  function profileField(label, name, value) {
    return '<div>' +
      '<label style="display:block;font-size:12px;font-weight:600;color:var(--moss);margin-bottom:4px">' + label + '</label>' +
      '<input id="acc-' + name + '" name="' + name + '" type="text" value="' + esc(value || '') + '" style="width:100%;border:1px solid var(--border);padding:7px 10px;font-size:13px;font-family:inherit;border-radius:3px;background:#fff;color:var(--charcoal)">' +
    '</div>';
  }

  // ── XSS escape ────────────────────────────────────────────────────────────
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  // ── Start ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
