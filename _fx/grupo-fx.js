/* GRUPO PLANEAR / TAMBELLI · efeitos compartilhados (ver grupo-fx.css) */
(function () {
  'use strict';
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ================= entrada ao rolar ================= */
  // Fica fora: abertura, cabeçalho, rodapé e as áreas que já têm animação própria
  var SKIP = '#inicio,.hero,header,footer,[data-stack],[data-scrub],[data-reveal],[data-fx-skip],#como-funciona,form,.fx-marq,[data-fx-track],.cracha,[data-screen-label="01 Abertura"],[data-screen-label="04 Como funciona"],[data-screen-label="03 Serviços"],[data-screen-label="05 O que você não vai passar"]';
  var PICK = '.fx-car,.crachas,h2,h3,p,li,figure,blockquote,address,iframe,.btn,.cl-grid,.pj-list,.cs-list,.faq-list,.qa,article';

  function skipped(el) { return !!el.closest(SKIP); }

  function tag() {
    var main = document.querySelector('main') || document.body;
    var picked = [];
    $$(PICK, main).forEach(function (el) {
      if (skipped(el) || el.closest('.fx')) return;
      if (picked.some(function (p) { return p.contains(el); })) return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      picked.push(el);
    });
    // atraso em cascata entre irmãos (peças encaixando uma a uma)
    picked.forEach(function (el) {
      var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty('--fx-d', Math.min(sib, 8) * 110 + 'ms');
      if (el.tagName === 'FIGURE' || el.tagName === 'IFRAME') el.classList.add('fx-img');
      else {
        el.classList.add('fx');
        if (el.tagName === 'ARTICLE' || el.tagName === 'LI' && el.closest('.cl-grid')) el.classList.add('fx-card');
      }
    });
    // títulos de seção ganham a linha de cota
    $$('h2', document.querySelector('main') || document.body).forEach(function (h) {
      if (skipped(h) && !h.closest('[data-reveal]')) return;
      if (h.querySelector('.fx-cota') || h.closest('.fx-marq')) return;
      var c = document.createElement('span');
      c.className = 'fx-cota';
      c.setAttribute('aria-hidden', 'true');
      c.innerHTML = '<b></b><i></i><em></em><s></s>';
      var ta = getComputedStyle(h).textAlign;
      if (ta === 'center') c.classList.add('fx-c'); else if (ta === 'right' || ta === 'end') c.classList.add('fx-r');
      h.appendChild(c);
      if (!h.classList.contains('fx')) cotas.push(c);
    });
    return picked;
  }
  var cotas = [];

  function reveal() {
    var els = tag();
    if (reduced) {
      els.concat(cotas).forEach(function (e) { e.classList.add('fx-in'); });
      return;
    }
    document.documentElement.classList.add('fx-on');
    // checagem direta na rolagem: confiável dentro de carrosséis e em páginas montadas por script
    var pend = els.concat(cotas), ticking = false;
    function check() {
      ticking = false;
      var lim = innerHeight * 0.9;
      pend = pend.filter(function (e) {
        if (!e.isConnected) return false;
        var r = e.getBoundingClientRect();
        if (r.top < lim && r.bottom > 0) { e.classList.add('fx-in'); return false; }
        return true;
      });
    }
    function onScroll() { if (!ticking && pend.length) { ticking = true; requestAnimationFrame(check); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    setTimeout(check, 120);
  }

  /* ================= carrossel arrastável ================= */
  var ARW_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  var ARW_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  function carousel(track) {
    if (track.__fx) return; track.__fx = 1;
    var wrap = document.createElement('div');
    wrap.className = 'fx-car';
    track.parentNode.insertBefore(wrap, track);
    wrap.appendChild(track);
    track.setAttribute('data-fx-track', '');
    if (!track.hasAttribute('tabindex')) track.tabIndex = 0;
    var nav = document.createElement('div');
    nav.className = 'fx-nav';
    nav.innerHTML = '<button type="button" class="fx-arw" data-fx-prev aria-label="Fotos anteriores">' + ARW_L + '</button><span class="fx-bar" aria-hidden="true"><i></i></span><button type="button" class="fx-arw" data-fx-next aria-label="Próximas fotos">' + ARW_R + '</button>';
    wrap.appendChild(nav);
    var prev = nav.querySelector('[data-fx-prev]'), next = nav.querySelector('[data-fx-next]'), bar = nav.querySelector('.fx-bar i');

    function step() {
      var it = track.firstElementChild;
      if (!it) return track.clientWidth;
      var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      return it.getBoundingClientRect().width + gap;
    }
    function update() {
      var max = track.scrollWidth - track.clientWidth;
      var p = max > 0 ? track.scrollLeft / max : 0;
      var vis = track.scrollWidth ? track.clientWidth / track.scrollWidth : 1;
      bar.style.width = Math.max(8, vis * 100) + '%';
      bar.style.transform = 'translateX(' + (p * (100 / Math.max(vis, 0.08) - 100)) + '%)';
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= max - 2;
      nav.style.display = max <= 2 ? 'none' : '';
    }
    prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    track.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); next.click(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev.click(); }
    });

    // arrastar com o mouse (no toque o navegador já arrasta nativamente)
    var down = false, moved = false, x0 = 0, s0 = 0, lastX = 0, lastT = 0, vel = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; x0 = lastX = e.clientX; s0 = track.scrollLeft; lastT = performance.now(); vel = 0;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - x0;
      if (!moved && Math.abs(dx) > 4) { moved = true; track.classList.add('fx-drag'); }
      if (!moved) return;
      track.scrollLeft = s0 - dx;
      var now = performance.now();
      vel = (e.clientX - lastX) / Math.max(1, now - lastT); lastX = e.clientX; lastT = now;
    });
    function end() {
      if (!down) return;
      down = false;
      if (!moved) return;
      // solta com inércia e encaixa no item mais próximo
      var target = track.scrollLeft - vel * 260;
      var st = step();
      target = Math.round(target / st) * st;
      track.classList.remove('fx-drag');
      track.scrollTo({ left: target, behavior: 'smooth' });
    }
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    track.addEventListener('lostpointercapture', end);
    track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    update();
    setTimeout(update, 600);
  }

  /* ================= faixa infinita ================= */
  function marquee(m) {
    var t = m.querySelector('.fx-marq-t');
    var g = t && t.querySelector('.fx-marq-g');
    if (!g || t.__fx) return; t.__fx = 1;
    // repete o grupo até cobrir 2x a largura da tela, depois duplica (loop sem emenda)
    var base = g.innerHTML, n = 0;
    while (g.scrollWidth < Math.max(innerWidth, 1200) && n++ < 12) g.insertAdjacentHTML('beforeend', base);
    var clone = g.cloneNode(true); clone.setAttribute('aria-hidden', 'true');
    t.appendChild(clone);
    var speed = +m.getAttribute('data-speed') || 70; // px por segundo
    t.style.setProperty('--fx-t', (g.scrollWidth / speed).toFixed(1) + 's');
  }

  function init() {
    $$('[data-fx-carousel]').forEach(carousel);
    $$('.fx-marq').forEach(marquee);
    tint();
    reveal();
  }

  /* ícones duotone: o preenchimento suave acompanha a cor do traço de cada site */
  function tint() {
    $$('svg').forEach(function (svg) {
      if (!svg.querySelector('[style*="fill-opacity"]')) return;
      var paint = function () {
        var st = getComputedStyle(svg).stroke;
        if (st && st !== 'none' && st.indexOf('url') < 0) svg.style.color = st;
      };
      paint();
      var host = svg.closest('a,button,article,li,.card');
      if (host) { host.addEventListener('mouseenter', function () { setTimeout(paint, 60); setTimeout(paint, 500); }); host.addEventListener('mouseleave', function () { setTimeout(paint, 60); setTimeout(paint, 500); }); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(init, 60); });
  else setTimeout(init, 60);
  // páginas montadas por script (Construtora): roda de novo quando o conteúdo aparecer
  window.addEventListener('load', function () { setTimeout(function () { $$('[data-fx-carousel]').forEach(carousel); $$('.fx-marq').forEach(marquee); }, 300); });
})();
