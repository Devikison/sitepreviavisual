/* Rolagem: deslize próprio da roda do mouse, sem biblioteca. Bibliotecas de rolagem por JS
   (Lenis e parecidas) travam a barra lateral. Aqui o controle é solto na hora se a pessoa pegar
   a barra, clicar, usar o teclado ou se o navegador mover a página por outro motivo.
   No toque, vale a rolagem nativa do aparelho. */
(function () {
  'use strict';
  var header = document.querySelector('.site-header');
  var OFFSET = 88;
  var root = document.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- deslize da roda do mouse ----------
  if (!reduced && window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    var alvoY = 0, posY = 0, escrito = 0, anima = false, antes = 0;
    var parar = function () { anima = false; };
    var temRolagemPropria = function (el) {
      for (; el && el !== document.body && el !== root && el.nodeType === 1; el = el.parentElement) {
        var o = getComputedStyle(el).overflowY;
        if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight) return true;
      }
      return false;
    };
    var passo = function (t) {
      if (!anima) return;
      if (Math.abs(window.scrollY - escrito) > 3) { parar(); return; } // outra coisa moveu a página
      var dt = Math.min(t - antes, 50);
      antes = t;
      posY += (alvoY - posY) * (1 - Math.exp(-dt * 0.0062));
      if (Math.abs(alvoY - posY) < 0.6) posY = alvoY;
      window.scrollTo({ top: posY, behavior: 'instant' });
      escrito = window.scrollY;
      if (posY === alvoY) { parar(); return; }
      requestAnimationFrame(passo);
    };
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || temRolagemPropria(e.target)) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? window.innerHeight : 1);
      e.preventDefault();
      if (!anima) {
        posY = alvoY = escrito = window.scrollY;
        antes = performance.now();
        anima = true;
        requestAnimationFrame(passo);
      }
      alvoY = Math.max(0, Math.min(root.scrollHeight - window.innerHeight, alvoY + dy));
    }, { passive: false });
    ['mousedown', 'keydown', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, parar, { passive: true });
    });
  }

  // ---------- links internos: descontam a barra superior ----------
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href*="#"]');
    if (!link || link.target === '_blank') return;
    var url = new URL(link.href, location.href);
    var samePage = url.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '');
    if (!samePage || !url.hash || url.hash === '#') return;
    var target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;
    e.preventDefault();
    var y = target.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
    history.pushState(null, '', url.hash);
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    if (header) header.classList.remove('is-hidden');
  });
})();
