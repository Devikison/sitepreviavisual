/* Barra superior: esconde ao rolar para baixo, mostra ao rolar para cima. */
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  if (!header) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var lastY = window.scrollY;
  var ticking = false;
  var MIN_MOVE = 8;   // rolagem mínima (px) para trocar de estado
  var TOP_ZONE = 80;  // perto do topo a barra fica sempre visível

  function menuOpen() {
    var nav = document.getElementById('mobileNav');
    return !!(nav && nav.classList.contains('is-open'));
  }

  function update() {
    ticking = false;
    var y = window.scrollY;
    var dy = y - lastY;

    if (y <= TOP_ZONE || menuOpen() || header.contains(document.activeElement)) {
      header.classList.remove('is-hidden');
      lastY = y;
      return;
    }
    if (dy > MIN_MOVE) {
      header.classList.add('is-hidden');
      lastY = y;
    } else if (dy < -MIN_MOVE) {
      header.classList.remove('is-hidden');
      lastY = y;
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  }, { passive: true });
})();
