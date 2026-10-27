/* Planear Construtora · comportamento das páginas internas */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Header: esconde ao descer, mostra ao subir (um único rAF) */
  var hdr = document.querySelector('.hdr');
  var lastY = window.scrollY, ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      var menuOpen = document.querySelector('.mnav.is-open');
      if (hdr && !menuOpen) hdr.classList.toggle('is-hidden', y > lastY && y > 140);
      lastY = y;
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  /* Menu mobile */
  var burger = document.querySelector('.burger');
  var mnav = document.getElementById('menu-mobile');
  if (burger && mnav) {
    burger.addEventListener('click', function () {
      var open = !mnav.classList.contains('is-open');
      mnav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    });
    mnav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { mnav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mnav.classList.contains('is-open')) { mnav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
    });
  }

  /* Sumário: aberto no desktop, recolhido no celular; marca a seção atual */
  var det = document.querySelector('.toc details');
  if (det) {
    var mq = window.matchMedia('(min-width: 960px)');
    var sync = function () { det.open = mq.matches; };
    sync();
    mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync);
    det.addEventListener('click', function (e) { if (e.target.closest('a') && !mq.matches) det.open = false; });
  }
  var links = [].slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-on'); a.removeAttribute('aria-current'); });
        var a = map[en.target.id];
        if (a) { a.classList.add('is-on'); a.setAttribute('aria-current', 'true'); }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* Revelar ao rolar */
  var rev = document.querySelectorAll('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    rev.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var d = parseInt(en.target.getAttribute('data-reveal'), 10) || 0;
        setTimeout(function () { en.target.classList.add('is-in'); }, d);
        ro.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    rev.forEach(function (el) { ro.observe(el); });
  }

  var yr = document.querySelector('[data-year]');
  if (yr) yr.textContent = new Date().getFullYear();
})();
