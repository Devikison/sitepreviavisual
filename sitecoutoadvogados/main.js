/* Couto Advogados: comportamento do site. Sem escuta de rolagem manual: tudo por IntersectionObserver. */
(function () {
  'use strict';
  var d = document, b = d.body, root = d.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* topo em vidro depois do início da página */
  var hd = d.querySelector('.hd'), mark = d.createElement('div');
  mark.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none';
  b.prepend(mark);
  if (hd && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { hd.classList.toggle('on', !es[0].isIntersecting); }).observe(mark);
  }

  /* menu do celular */
  var bt = d.querySelector('.burger');
  function menu(on) {
    b.classList.toggle('menu', on); root.classList.toggle('lock', on);
    if (bt) { bt.setAttribute('aria-expanded', on); bt.setAttribute('aria-label', on ? 'Fechar menu' : 'Abrir menu'); }
  }
  if (bt) {
    bt.addEventListener('click', function () { menu(!b.classList.contains('menu')); });
    d.querySelectorAll('.mm a').forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') menu(false); });
    addEventListener('resize', function () { if (innerWidth > 1080) menu(false); });
  }

  /* título entrando palavra por palavra */
  d.querySelectorAll('[data-split]').forEach(function (h) {
    var t = h.textContent.trim(); h.setAttribute('aria-label', t); h.textContent = '';
    t.split(' ').forEach(function (p, i, a) {
      var s = d.createElement('span'); s.className = 'sw'; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--n', i); s.textContent = p;
      h.appendChild(s); if (i < a.length - 1) h.appendChild(d.createTextNode(' '));
    });
  });

  /* revelação lenta dos blocos */
  var alvo = d.querySelectorAll('.rv,[data-split]');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -7% 0px', threshold: .08 });
    alvo.forEach(function (el) { io.observe(el); });
  } else alvo.forEach(function (el) { el.classList.add('in'); });

  /* cena presa: a foto de fundo acompanha o passo que está na tela */
  d.querySelectorAll('.scn').forEach(function (sc) {
    var imgs = sc.querySelectorAll('.scn__st img'), passos = sc.querySelectorAll('.glass');
    if (!imgs.length || !('IntersectionObserver' in window)) return;
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = +e.target.getAttribute('data-p');
        imgs.forEach(function (im, i) { im.classList.toggle('on', i === n); });
      });
    }, { rootMargin: '-46% 0px -46% 0px' });
    passos.forEach(function (p) { so.observe(p); });
  });

  /* perguntas: abre e fecha devagar, uma por vez */
  var ds = [].slice.call(d.querySelectorAll('.fql details'));
  function fecha(o) {
    var f = o.querySelector('.fa'); f.style.transition = 'none'; f.style.height = f.scrollHeight + 'px';
    requestAnimationFrame(function () {
      f.style.transition = 'height .85s cubic-bezier(.16,1,.3,1)'; f.style.height = '0px';
      setTimeout(function () { o.removeAttribute('open'); f.style.height = ''; }, reduced ? 0 : 860);
    });
  }
  ds.forEach(function (el) {
    var s = el.querySelector('summary'), c = el.querySelector('.fa');
    s.addEventListener('click', function (e) {
      e.preventDefault();
      if (el.hasAttribute('open')) { fecha(el); return; }
      ds.forEach(function (o) { if (o !== el && o.hasAttribute('open')) fecha(o); });
      el.setAttribute('open', ''); c.style.transition = 'none'; c.style.height = '0px';
      requestAnimationFrame(function () {
        c.style.transition = 'height 1s cubic-bezier(.16,1,.3,1)'; c.style.height = c.scrollHeight + 'px';
        setTimeout(function () { c.style.height = ''; }, reduced ? 0 : 1020);
      });
    });
  });

  /* UTM: guarda a origem e leva junto para o WhatsApp */
  var CH = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'], utm = {};
  try {
    var q = new URLSearchParams(location.search), achou = false;
    CH.forEach(function (k) { if (q.get(k)) { utm[k] = q.get(k); achou = true; } });
    if (achou) sessionStorage.setItem('couto-utm', JSON.stringify(utm)); else utm = JSON.parse(sessionStorage.getItem('couto-utm') || '{}');
  } catch (e) { /* navegação privada */ }
  if (utm.utm_source) {
    d.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
      try {
        var u = new URL(a.href), texto = u.searchParams.get('text') || '';
        u.searchParams.set('text', texto + ' [origem: ' + utm.utm_source + (utm.utm_campaign ? '/' + utm.utm_campaign : '') + ']');
        a.href = u.toString();
      } catch (e) { /* mantém o link */ }
    });
  }
  d.addEventListener('click', function (e) {
    var el = e.target.closest('[data-btn]'); if (!el) return;
    var nome = el.getAttribute('data-btn'), wa = /wa\.me/.test(el.href || '');
    if (window.gtag) gtag('event', wa ? 'clique_whatsapp' : 'clique_botao', { botao: nome });
    if (window.fbq) fbq(wa ? 'track' : 'trackCustom', wa ? 'Contact' : 'CliqueBotao', { botao: nome });
    if (window.dataLayer) dataLayer.push({ event: 'clique_botao', botao: nome });
  });

  /* balão do WhatsApp: aparece depois do aviso de cookies e some se a pessoa fechar */
  var wb = d.querySelector('.wb');
  if (wb) {
    var fechado = false;
    try { fechado = sessionStorage.getItem('couto-balao') === '1'; } catch (e) { /* navegação privada */ }
    var abre = function (ms) {
      if (fechado) return;
      setTimeout(function () {
        if (fechado || b.classList.contains('consent-open')) return;
        wb.classList.add('on');
        if (innerWidth < 640) setTimeout(function () { wb.classList.remove('on'); }, 9000);
      }, ms);
    };
    wb.querySelector('.wb__x').addEventListener('click', function () {
      fechado = true; wb.classList.remove('on');
      try { sessionStorage.setItem('couto-balao', '1'); } catch (e) { /* navegação privada */ }
    });
    addEventListener('couto-consent', function () { abre(2600); });
    abre(4200);
  }
})();

/* rolagem suave da roda do mouse, sem biblioteca. Solta o controle na hora se a pessoa
   pegar a barra lateral, clicar, usar o teclado ou o navegador mover a página por outro motivo. */
(function () {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement, alvoY = 0, posY = 0, escrito = 0, anima = false, antes = 0;
  function parar() { anima = false; }
  function temRolagemPropria(el) {
    for (; el && el !== document.body && el !== root && el.nodeType === 1; el = el.parentElement) {
      var o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight) return true;
    }
    return false;
  }
  function passo(t) {
    if (!anima) return;
    if (Math.abs(scrollY - escrito) > 3) { parar(); return; } /* outra coisa moveu a página */
    var dt = Math.min(t - antes, 50); antes = t;
    posY += (alvoY - posY) * (1 - Math.exp(-dt * .0062));
    if (Math.abs(alvoY - posY) < .6) posY = alvoY;
    scrollTo({ top: posY, behavior: 'instant' }); escrito = scrollY;
    if (posY === alvoY) { parar(); return; }
    requestAnimationFrame(passo);
  }
  addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || root.classList.contains('lock') || temRolagemPropria(e.target)) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
    e.preventDefault();
    if (!anima) { posY = alvoY = escrito = scrollY; antes = performance.now(); anima = true; requestAnimationFrame(passo); }
    alvoY = Math.max(0, Math.min(root.scrollHeight - innerHeight, alvoY + dy));
  }, { passive: false });
  ['mousedown', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, parar, { passive: true }); });
})();
