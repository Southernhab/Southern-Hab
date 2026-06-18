(function () {
  function setupCollapsibleDescription() {
    var section = document.querySelector('section.section');
    if (!section) return;
    if (!section.querySelector('a.back-link')) return;

    var h2s = section.querySelectorAll('h2');
    if (h2s.length < 1) return;

    var serviceH2 = h2s[0];
    var expectH2 = null;
    for (var i = 0; i < h2s.length; i++) {
      if (h2s[i].textContent.trim().toLowerCase().indexOf('what the client') !== -1) {
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

    var collapsible = document.createElement('div');
    collapsible.className = 'desc-collapsible';
    collapsible.id = 'desc-extra';

    for (var j = 2; j < descParas.length; j++) {
      collapsible.appendChild(descParas[j]);
    }

    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'desc-toggle';
    toggleBtn.type = 'button';
    toggleBtn.textContent = 'Read Full Description';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-controls', 'desc-extra');

    var para2 = descParas[1];
    para2.insertAdjacentElement('afterend', collapsible);
    para2.insertAdjacentElement('afterend', toggleBtn);

    toggleBtn.addEventListener('click', function () {
      var expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (expanded) {
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.textContent = 'Read Full Description';
        collapsible.classList.remove('open');
      } else {
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.textContent = 'Show Less';
        collapsible.classList.add('open');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupCollapsibleDescription);
  } else {
    setupCollapsibleDescription();
  }
})();
