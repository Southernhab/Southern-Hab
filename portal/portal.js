(function () {
  'use strict';

  // ── Sidebar mobile toggle ─────────────────────────────────────────────────
  function setupSidebar() {
    var sidebar = document.getElementById('portal-sidebar');
    var overlay = document.getElementById('sidebar-overlay');
    var menuBtn = document.querySelector('.topbar-menu-btn');
    if (!sidebar || !menuBtn) return;

    function open() {
      sidebar.classList.add('open');
      if (overlay) overlay.classList.add('visible');
      menuBtn.setAttribute('aria-expanded', 'true');
      menuBtn.textContent = '✕';
    }

    function close() {
      sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('visible');
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.textContent = '☰';
    }

    menuBtn.addEventListener('click', function () {
      if (sidebar.classList.contains('open')) close();
      else open();
    });

    if (overlay) overlay.addEventListener('click', close);

    // Close on nav link click (mobile)
    sidebar.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        if (window.innerWidth <= 900) close();
      });
    });
  }

  // ── Tab system ────────────────────────────────────────────────────────────
  function setupTabs(container) {
    var btns = Array.from(container.querySelectorAll(':scope > .tab-bar > .tab-btn'));
    var panels = Array.from(container.querySelectorAll(':scope > .tab-panel'));
    if (!btns.length) return;

    btns.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('active'); });
        panels.forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        if (panels[i]) panels[i].classList.add('active');
      });
    });

    // Activate first by default if none active
    if (!btns.some(function (b) { return b.classList.contains('active'); })) {
      btns[0] && btns[0].classList.add('active');
      panels[0] && panels[0].classList.add('active');
    }
  }

  // ── Project action buttons ─────────────────────────────────────────────────
  function setupProjectActions() {
    document.querySelectorAll('[data-action]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var action = btn.getAttribute('data-action');
        var project = btn.getAttribute('data-project') || 'this project';
        var messages = {
          question: 'Your question about "' + project + '" has been submitted. SHC will respond shortly.',
          approve: 'Your preliminary approval for "' + project + '" has been recorded. This does not replace a signed contract.',
          defer: '"' + project + '" has been marked as deferred. SHC has been notified.',
          proposal: 'Your request for a formal proposal on "' + project + '" has been submitted.',
          info: 'Your request for more information on "' + project + '" has been submitted.',
          schedule: 'Your schedule-change request for "' + project + '" has been submitted.'
        };
        alert(messages[action] || 'Request submitted.');
      });
    });
  }

  // ── Message compose ───────────────────────────────────────────────────────
  function setupMessageCompose() {
    var form = document.getElementById('compose-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var subj = form.querySelector('[name="subject"]');
      if (subj && subj.value.trim()) {
        alert('Message sent to SHC. You will receive a reply within 1–2 business days.');
        form.reset();
      }
    });
  }

  // ── Sign-out link (demo) ──────────────────────────────────────────────────
  function setupSignOut() {
    document.querySelectorAll('.sign-out-link').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        window.location.href = '/portal/';
      });
    });
  }

  // ── Login form (demo) ─────────────────────────────────────────────────────
  function setupLogin() {
    var form = document.getElementById('login-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      window.location.href = '/portal/overview/';
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    setupSidebar();
    document.querySelectorAll('.tabbed').forEach(setupTabs);
    setupProjectActions();
    setupMessageCompose();
    setupSignOut();
    setupLogin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
