/* Rolagem suave no computador (Lenis). No toque, a rolagem nativa do aparelho continua. */
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  var OFFSET = 88;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lenis = null;

  // navegadores automatizados (testes, robôs) usam a rolagem nativa
  if (!reduced && !navigator.webdriver && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ duration: 1.05, wheelMultiplier: 0.95, smoothWheel: true, syncTouch: false });
    (function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    })(performance.now());
    window.arcaLenis = lenis;
  }

  // links internos: mesma suavidade e descontando a barra superior
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href*="#"]');
    if (!link || link.target === '_blank') return;
    var url = new URL(link.href, location.href);
    var samePage = url.pathname.replace(/index.html$/, '') === location.pathname.replace(/index.html$/, '');
    if (!samePage || !url.hash || url.hash === '#') return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -OFFSET });
    else {
      var y = target.getBoundingClientRect().top + window.scrollY - OFFSET;
      window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    }
    history.pushState(null, '', url.hash);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (header) header.classList.remove('is-hidden');
  });
})();
