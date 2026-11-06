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
      // etiquetas pequenas (ex.: "PARA QUEM É") e títulos em linha com ícone não recebem a linha de cota
      var hs = getComputedStyle(h);
      if (parseFloat(hs.fontSize) < 24 || hs.display.indexOf('flex') > -1 || hs.textTransform === 'uppercase' && parseFloat(hs.fontSize) < 30) return;
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
    if (!g || t.__fx || !m.offsetWidth) return; t.__fx = 1; // faixa escondida (versão celular no computador) monta quando aparecer
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
    waFloat();
    legible();
    reveal();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { legible(); $$('.fx-marq').forEach(marquee); }, 200); });
  }

  /* ================= leitura confortável =================
     Textos de leitura: peso médio, tamanho mínimo e contraste reforçado
     (pensado para quem usa óculos e para telas pequenas de iPhone e Android). */
  var TXT = 'p,address,dd,.qa-a p,.cr-sub,figcaption span,.fnote,.support,.cs-t,.pj-list li,.t-txt p,.c-txt p,.rs-txt p,li > p,li > span:not([class])';
  var SMALL = /(note|support|fnote|cap|tag|eyebrow|legal|chip|lab|cr-sub)/;
  function rgb(c) { var m = c && c.match(/[\d.]+/g); return m ? m.slice(0, 4).map(Number) : null; }
  function lum(c) { var a = c.slice(0, 3).map(function (v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * a[0] + .7152 * a[1] + .0722 * a[2]; }
  function bgOf(el) {
    for (var e = el; e && e !== document.documentElement; e = e.parentElement) {
      var c = rgb(getComputedStyle(e).backgroundColor);
      if (c && (c[3] === undefined || c[3] > .5)) return c;
      if (getComputedStyle(e).backgroundImage !== 'none') return null; // fundo com imagem/gradiente: não mexe
    }
    return [255, 255, 255];
  }
  function mix(a, b, t) { return 'rgb(' + [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }).join(',') + ')'; }
  function legible() {
    var mobile = innerWidth < 700;
    $$(TXT).forEach(function (el) {
      if (el.closest('#inicio,[data-screen-label="01 Abertura"],header,nav,.hero-tag,.fx-marq,.cr-band,.cr-foot,.carimbo,button,.btn,svg,[data-fx-keep]')) return;
      if (!el.textContent.trim()) return;
      var cs = getComputedStyle(el), small = SMALL.test(el.className || '') || SMALL.test((el.parentElement && el.parentElement.className) || '');
      var min = small ? (mobile ? 14 : 14) : 16;
      if (parseFloat(cs.fontSize) < min) el.style.fontSize = min + 'px';
      if ((+cs.fontWeight || 400) < 500) el.style.fontWeight = '500';
      if (parseFloat(cs.fontSize) <= 20 && parseFloat(cs.lineHeight) / parseFloat(cs.fontSize) < 1.45) el.style.lineHeight = '1.55';
      if (el.__fxc) return; el.__fxc = 1; // cor ajustada só uma vez
      var c = rgb(cs.color), bg = bgOf(el);
      if (!c || !bg) return;
      var dark = lum(bg) < .35;
      if (!dark && lum(c) > .1) el.style.color = mix(c, [16, 22, 32], .45);
      else if (dark && lum(c) < .62) el.style.color = mix(c, [255, 255, 255], .45);
    });
  }

  /* botão flutuante de WhatsApp com a mensagem da empresa (identifica de onde veio o contato) */
  function waFloat() {
    var P = window.PLANEAR;
    if (!P || !P.waLink || document.querySelector('.fx-wa')) return;
    var url = P.waLink();
    if (!url) return;
    var a = document.createElement('a');
    a.className = 'fx-wa';
    a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', 'Falar pelo WhatsApp');
    a.setAttribute('data-btn', 'whatsapp-flutuante');
    a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.89 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.17-3.48-8.42z"/></svg><span>WhatsApp</span>';
    a.addEventListener('click', function () { (window.dataLayer = window.dataLayer || []).push({ event: 'clique_whatsapp', origem: 'botao_flutuante' }); });
    document.body.appendChild(a);
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
