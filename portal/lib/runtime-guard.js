// SHC Portal — reveal useful startup errors instead of leaving a blank page.
(function () {
  'use strict';

  var shown = false;

  function escapeHtml(value) {
    return String(value || 'Unknown error')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function show(message) {
    if (shown) return;
    shown = true;

    var shell = document.getElementById('admin-shell') || document.getElementById('portal-shell-wrap');
    var content = document.getElementById('admin-content') || document.getElementById('portal-content');
    if (shell) shell.classList.add('ready');
    if (!content) return;

    content.innerHTML = '<div class="portal-page"><div class="content-error" style="display:block">' +
      '<strong>The portal could not finish loading.</strong><br>' +
      escapeHtml(message) +
      '<div style="margin-top:12px"><button type="button" onclick="window.location.reload()">Reload portal</button></div>' +
      '</div></div>';
  }

  window.addEventListener('error', function (event) {
    show(event && (event.message || (event.error && event.error.message)));
  });

  window.addEventListener('unhandledrejection', function (event) {
    var reason = event && event.reason;
    show(reason && reason.message ? reason.message : reason);
  });

  window.setTimeout(function () {
    var shell = document.getElementById('admin-shell') || document.getElementById('portal-shell-wrap');
    if (shell && !shell.classList.contains('ready')) {
      show('Initialization timed out. Check the Firebase configuration, account role, and network connection, then reload.');
    }
  }, 12000);
})();
