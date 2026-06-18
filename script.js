(function () {
  'use strict';

  function makeToggleBtn(label, controlsId, className) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = label;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', controlsId);
    return btn;
  }

  function bindToggle(btn, panel, labelClosed, labelOpen) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      if (open) {
        btn.setAttribute('aria-expanded', 'false');
        btn.textContent = labelClosed;
        panel.classList.remove('open');
      } else {
        btn.setAttribute('aria-expanded', 'true');
        btn.textContent = labelOpen;
        panel.classList.add('open');
      }
    });
  }

  function collapseAfterTwo(container, btnLabel, panelId) {
    var paras = Array.from(container.querySelectorAll(':scope > p'));
    if (paras.length <= 2) return;
    var panel = document.createElement('div');
    panel.className = 'desc-collapsible';
    panel.id = panelId;
    for (var i = 2; i < paras.length; i++) {
      panel.appendChild(paras[i]);
    }
    var btn = makeToggleBtn(btnLabel, panelId, 'desc-toggle');
    paras[1].insertAdjacentElement('afterend', panel);
    paras[1].insertAdjacentElement('afterend', btn);
    bindToggle(btn, panel, btnLabel, 'Show Less');
  }

  // ── 1. Mobile hamburger nav ───────────────────────────────────────────────
  function setupMobileNav() {
    var nav = document.querySelector('nav.container-fluid');
    if (!nav) return;

    var menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.type = 'button';
    menuBtn.textContent = 'Menu';
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.setAttribute('aria-controls', 'mobile-nav-panel');

    var panel = document.createElement('div');
    panel.className = 'mobile-nav-panel';
    panel.id = 'mobile-nav-panel';
    panel.setAttribute('hidden', '');
    panel.innerHTML =
      '<ul>' +
      '<li><a href="/">Home</a></li>' +
      '<li><a href="/industrial-municipal-utility/">Industrial, Municipal &amp; Utility</a></li>' +
      '<li><a href="/private-land-services/">Private Lands</a></li>' +
      '<li><a href="/about/">About</a></li>' +
      '<li><a href="/contact/">Contact</a></li>' +
      '</ul>';

    panel.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });

    var secondUl = nav.querySelector('ul:last-child');
    if (secondUl) {
      var li = document.createElement('li');
      li.className = 'mobile-menu-item';
      li.appendChild(menuBtn);
      secondUl.insertBefore(li, secondUl.querySelector('li:last-child'));
    }

    nav.parentNode.insertBefore(panel, nav.nextSibling);

    function closeMenu() {
      menuBtn.setAttribute('aria-expanded', 'false');
      menuBtn.textContent = 'Menu';
      panel.setAttribute('hidden', '');
    }

    menuBtn.addEventListener('click', function () {
      if (menuBtn.getAttribute('aria-expanded') === 'true') {
        closeMenu();
      } else {
        menuBtn.setAttribute('aria-expanded', 'true');
        menuBtn.textContent = 'Close';
        panel.removeAttribute('hidden');
      }
    });

    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && !panel.contains(e.target)) {
        closeMenu();
      }
    });
  }

  // ── 2. Service page description collapsible ───────────────────────────────
  function setupServiceCollapsible() {
    var section = document.querySelector('section.section');
    if (!section || !section.querySelector('a.back-link')) return;
    var h2s = section.querySelectorAll('h2');
    if (!h2s.length) return;
    var serviceH2 = h2s[0];
    var expectH2 = null;
    for (var i = 0; i < h2s.length; i++) {
      if (h2s[i].textContent.toLowerCase().indexOf('what the client') !== -1) {
        expectH2 = h2s[i];
        break;
      }
    }
    var descParas = [];
    var node = serviceH2.nextElementSibling;
    while (node && node !== expectH2) {
      if (node.tagName === 'P') descParas.push(node);
      node = node.nextElementSibling;
    }
    if (descParas.length <= 2) return;
    var panel = document.createElement('div');
    panel.className = 'desc-collapsible';
    panel.id = 'desc-extra';
    for (var j = 2; j < descParas.length; j++) {
      panel.appendChild(descParas[j]);
    }
    var btn = makeToggleBtn('Read Full Description', 'desc-extra', 'desc-toggle');
    descParas[1].insertAdjacentElement('afterend', panel);
    descParas[1].insertAdjacentElement('afterend', btn);
    bindToggle(btn, panel, 'Read Full Description', 'Show Less');
  }

  // ── 3. Homepage hero collapsible ──────────────────────────────────────────
  function setupHeroCollapsible() {
    var heroDiv = document.querySelector('.hero > div');
    if (!heroDiv) return;
    collapseAfterTwo(heroDiv, 'Read More', 'hero-extra');
  }

  // ── 4. Overview page intro collapsible (.page-header) ────────────────────
  function setupOverviewCollapsible() {
    var header = document.querySelector('.page-header');
    if (!header) return;
    collapseAfterTwo(header, 'Read More', 'overview-extra');
  }

  // ── 5. About page collapsibles ────────────────────────────────────────────
  function setupAboutCollapsibles() {
    var sections = document.querySelectorAll('section.section, section.section.dark, section.section.alt');
    sections.forEach(function (sec, idx) {
      collapseAfterTwo(sec, 'Read More', 'about-extra-' + idx);
    });
  }

  // ── 6. Contact form tab selector ──────────────────────────────────────────
  function setupContactFormSelector() {
    var grid = document.querySelector('.grid-2');
    if (!grid) return;
    var forms = Array.from(grid.querySelectorAll('form'));
    if (forms.length < 2) return;

    var selectorDiv = document.createElement('div');
    selectorDiv.className = 'form-selector';
    selectorDiv.setAttribute('role', 'group');
    selectorDiv.setAttribute('aria-label', 'Select inquiry type');

    var tabData = [
      { label: 'Private Land Inquiry', formIndex: 1 },
      { label: 'Industrial / Municipal Inquiry', formIndex: 0 }
    ];

    var tabs = tabData.map(function (data, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'form-tab' + (i === 0 ? ' active' : '');
      btn.textContent = data.label;
      btn.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
      btn.addEventListener('click', function () {
        tabs.forEach(function (t, j) {
          t.setAttribute('aria-pressed', j === i ? 'true' : 'false');
          t.classList.toggle('active', j === i);
        });
        forms.forEach(function (f, j) {
          f.classList.toggle('form-hidden', j !== data.formIndex);
        });
      });
      selectorDiv.appendChild(btn);
      return btn;
    });

    forms[0].classList.add('form-hidden');

    grid.parentNode.insertBefore(selectorDiv, grid);
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    setupMobileNav();
    setupServiceCollapsible();
    setupHeroCollapsible();
    setupOverviewCollapsible();
    setupAboutCollapsibles();
    setupContactFormSelector();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
