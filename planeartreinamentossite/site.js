/* Sites institucionais do grupo Planear/Tambelli: comportamento da página.
   Toda animação de rolagem acontece num único requestAnimationFrame e só
   mexe em transform e opacity. */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var C = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Menu mobile ---------- */
  var hdr = $('.hdr'), burger = $('.burger'), mnav = $('#menu-mobile');
  function setMenu(open) {
    if (!mnav) return;
    mnav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  if (burger) burger.addEventListener('click', function () { setMenu(!mnav.classList.contains('is-open')); });
  if (mnav) mnav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mnav && mnav.classList.contains('is-open')) { setMenu(false); burger.focus(); } });

  /* ---------- Rolagem suave (roda do mouse, amortecida pelo tempo) ---------- */
  var sm = { on: false, cur: window.scrollY, target: window.scrollY, last: 0, lambda: 4.2 };
  var maxY = function () { return doc.scrollHeight - window.innerHeight; };
  function scrollToY(y) {
    y = Math.max(0, Math.min(maxY(), y));
    if (reduced) { window.scrollTo(0, y); return; }
    if (!fine) { window.scrollTo({ top: y, behavior: 'smooth' }); return; }
    if (!sm.on) { sm.cur = window.scrollY; sm.last = 0; }
    sm.target = y; sm.on = true; sm.lambda = 3.4;
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href').slice(1);
    var t = id ? document.getElementById(id) : null;
    if (!t && id) return;
    e.preventDefault();
    scrollToY(t ? t.getBoundingClientRect().top + window.scrollY - (id === 'inicio' ? 0 : 96) : 0);
    if (t) { t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
  });
  if (fine && !reduced) {
    doc.style.scrollBehavior = 'auto';
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey || e.defaultPrevented) return;
      if (e.target.closest && e.target.closest('iframe,select,textarea,[data-native-scroll]')) return;
      e.preventDefault();
      var dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 40; else if (e.deltaMode === 2) dy *= window.innerHeight;
      if (!sm.on) { sm.cur = window.scrollY; sm.target = window.scrollY; sm.last = 0; }
      sm.target = Math.max(0, Math.min(maxY(), sm.target + dy));
      sm.on = true; sm.lambda = 4.2;
    }, { passive: false });
    var stop = function () { sm.on = false; };
    window.addEventListener('keydown', stop, { passive: true });
    window.addEventListener('mousedown', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
  }
  function smoothStep(t) {
    if (!sm.on) return;
    var dt = sm.last ? Math.min(0.064, (t - sm.last) / 1000) : 1 / 60;
    sm.last = t;
    var d = sm.target - sm.cur;
    if (Math.abs(d) < 0.25) { sm.cur = sm.target; window.scrollTo(0, sm.cur); sm.on = false; return; }
    sm.cur += d * (1 - Math.exp(-sm.lambda * dt));
    window.scrollTo(0, sm.cur);
  }

  /* ---------- Header: esconde ao descer ---------- */
  var lastY = window.scrollY, hidden = false;
  function headerStep() {
    if (!hdr) return;
    var y = window.scrollY, d = y - lastY;
    if (Math.abs(d) < 4) return;
    lastY = y;
    var hide = d > 0 && y > 140 && !(mnav && mnav.classList.contains('is-open'));
    if (hide !== hidden) { hidden = hide; hdr.classList.toggle('is-hidden', hide); }
  }

  /* ---------- Cards empilhados ---------- */
  var stacks = $$('[data-stack]').map(function (s) {
    return { s: s, head: $('.stack-head', s), hy: 0, idx: $$('.idx li', s), active: -1,
      cards: $$('.card', s).map(function (c) { return { c: c, shade: $('.shade', c), top0: parseFloat(c.getAttribute('data-top')) || 120 }; }) };
  });
  function layoutStacks() {
    var desk = window.innerWidth >= 960;
    var hb = hdr ? hdr.offsetTop + hdr.offsetHeight : 82;
    stacks.forEach(function (g) {
      if (desk) {
        if (g.head) g.head.style.top = '120px';
        g.cards.forEach(function (o) { o.c.style.top = o.top0 + 'px'; });
        return;
      }
      var ht = Math.round(hb + 8);
      if (g.head) g.head.style.top = ht + 'px';
      var base = ht + (g.head ? g.head.offsetHeight : 0) + 14;
      g.cards.forEach(function (o, i) { o.c.style.top = (base + i * 12) + 'px'; });
    });
  }

  /* ---------- Como funciona ---------- */
  var st = $('[data-steps]');
  var S = st ? {
    stext: $$('.stext', st), scenes: $$('[data-scene]', st), sfill: $('.sbar i', st),
    tabs: $$('[data-tab]', st).map(function (e) { return { e: e, fill: $('[data-tabfill]', e) }; }),
    kel: $$('[data-k]', st).map(function (e) { var p = e.getAttribute('data-k').split(','); return { e: e, sc: +p[0], a: +p[1], b: +p[2], t: p[3], last: -1 }; }),
    cur: 0, target: 0, init: false, visible: false, active: -1
  } : null;
  var cl = function (x) { return Math.min(1, Math.max(0, x)); };
  var ease = function (x) { return x * x * (3 - 2 * x); };
  function paintSteps(p) {
    var n = 4, s = p * n;
    S.stext.forEach(function (e, i) {
      var o;
      if (i === 0 && s < 0.5) o = 1; else if (i === n - 1 && s > n - 0.5) o = 1;
      else o = cl((0.5 - Math.abs(s - i - 0.5)) / 0.18);
      o = ease(o);
      var y = (s - i - 0.5) * -28;
      e.style.opacity = o.toFixed(3);
      e.style.transform = reduced ? 'none' : 'translate3d(0,' + Math.max(-30, Math.min(30, y)).toFixed(1) + 'px,0)';
      e.style.pointerEvents = o > 0.5 ? 'auto' : 'none';
    });
    S.scenes.forEach(function (e, i) {
      var o;
      if (i === 0 && s < 0.5) o = 1; else if (i === n - 1 && s > n - 0.5) o = 1;
      else o = cl(1.6 - Math.abs(s - i - 0.5) * 2.4);
      e.style.opacity = ease(o).toFixed(3);
    });
    S.kel.forEach(function (k) {
      var l = cl((s - k.sc + 0.1) / 0.75);
      var t = reduced ? 1 : ease(cl((l - k.a) / (k.b - k.a)));
      t = Math.round(t * 1000) / 1000;
      if (t === k.last) return;
      k.last = t;
      var x = k.e.style;
      if (k.t === 'sx') x.transform = 'scaleX(' + t + ')';
      else if (k.t === 'sy') x.transform = 'scaleY(' + t + ')';
      else if (k.t === 'fade') { x.opacity = t; x.transform = 'translate3d(0,' + ((1 - t) * 14).toFixed(1) + 'px,0)'; }
      else if (k.t === 'drop') { x.opacity = t; x.transform = 'translate3d(0,' + ((1 - t) * -60).toFixed(1) + 'px,0)'; }
      else if (k.t === 'pop') { x.opacity = t; x.transform = 'scale(' + (0.5 + t * 0.5).toFixed(3) + ')'; }
      else if (k.t === 'sweep') { x.transform = 'translate3d(' + (t * 100).toFixed(2) + '%,0,0)'; x.opacity = t <= 0 || t >= 1 ? 0 : (1 - ease(cl((t - 0.85) / 0.15))).toFixed(3); }
    });
    var at = Math.min(n - 1, Math.floor(s));
    S.tabs.forEach(function (o, i) { if (o.fill) o.fill.style.transform = 'scaleX(' + cl(s - i).toFixed(3) + ')'; });
    if (at !== S.active) {
      S.active = at;
      S.tabs.forEach(function (o, i) { o.e.style.opacity = i === at ? 1 : 0.55; o.e.style.background = i === at ? 'rgba(255,255,255,.08)' : 'transparent'; });
    }
    if (S.sfill) S.sfill.style.transform = 'scaleY(' + p.toFixed(4) + ')';
  }

  /* ---------- Contato: fundo com parallax ---------- */
  var pq = $('.contact'), pbg = pq && $('.contact-bg img', pq), psh = pq && $('.pshade', pq);

  /* ---------- Loop único ---------- */
  var dirty = true;
  window.addEventListener('scroll', function () { dirty = true; }, { passive: true });
  var rw = window.innerWidth;
  window.addEventListener('resize', function () {
    if ((window.innerWidth < 960) !== (rw < 960)) setMenu(false);
    rw = window.innerWidth; layoutStacks(); dirty = true;
  }, { passive: true });

  function frame() {
    var vh = window.innerHeight;
    if (dirty) {
      dirty = false;
      if (pq && pbg && !reduced) {
        var pr = pq.getBoundingClientRect();
        if (pr.bottom > 0 && pr.top < vh) {
          var t = cl((vh - pr.top) / (pr.height + vh));
          pbg.style.transform = 'translate3d(0,' + ((0.5 - t) * 40).toFixed(1) + 'px,0) scale(' + (1.12 - t * 0.1).toFixed(4) + ')';
          if (psh) psh.style.opacity = (Math.max(0, t - 0.75) * 2.4).toFixed(3);
        }
      }
      stacks.forEach(function (g) {
        var sr = g.s.getBoundingClientRect();
        if (!(sr.bottom > 0 && sr.top < vh)) return;
        var rects = g.cards.map(function (o) { return o.c.getBoundingClientRect(); });
        var active = 0;
        g.cards.forEach(function (o, i) {
          var next = rects[i + 1], t = 0;
          if (next) t = cl(1 - (next.top - rects[i].top) / rects[i].height);
          if (next && t > 0.5) active = i + 1;
          if (!reduced) {
            o.c.style.transform = 'scale(' + (1 - t * 0.06).toFixed(4) + ') translateZ(0)';
            if (o.shade) o.shade.style.opacity = (t * 0.4).toFixed(3);
          }
        });
        // o título acompanha o último card quando ele começa a sair da tela
        if (g.head && g.cards.length) {
          var lc = g.cards[g.cards.length - 1];
          var d = rects[rects.length - 1].top - (parseFloat(lc.c.style.top) || 0);
          var y = d < -0.5 ? Math.round(d * 10) / 10 : 0;
          if (y !== g.hy) { g.hy = y; g.head.style.transform = y ? 'translate3d(0,' + y + 'px,0)' : ''; }
        }
        if (g.idx.length && active !== g.active) {
          g.active = active;
          g.idx.forEach(function (li, i) { li.classList.toggle('on', i === active); });
        }
      });
      if (S) {
        var r = st.getBoundingClientRect();
        S.target = cl(-r.top / ((st.offsetHeight - vh) || 1));
        S.visible = r.bottom > 0 && r.top < vh;
      }
    }
    if (S && (S.visible || Math.abs(S.target - S.cur) > 0.0005)) {
      var k = reduced ? 1 : 0.14, dd = S.target - S.cur;
      if (Math.abs(dd) > 0.0003 || !S.init) { S.init = true; S.cur += dd * k; paintSteps(S.cur); }
    }
  }
  function tick(t) { smoothStep(t); headerStep(); frame(); requestAnimationFrame(tick); }

  /* ---------- Revelar ao rolar ---------- */
  var rev = $$('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) rev.forEach(function (e) { e.classList.add('in'); });
  else {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) {
        if (!x.isIntersecting) return;
        var d = +x.target.getAttribute('data-reveal') || 0;
        x.target.style.transitionDelay = d + 'ms';
        x.target.classList.add('in');
        io.unobserve(x.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    rev.forEach(function (e) { io.observe(e); });
  }

  /* ---------- Inclinação sutil dos cards ---------- */
  if (fine && !reduced) {
    var tel = null, rx = 0, ry = 0, pend = false;
    var paintTilt = function () { pend = false; if (tel) tel.style.transform = 'perspective(900px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(0)'; };
    document.addEventListener('pointermove', function (e) {
      var t = e.target.closest && e.target.closest('[data-tilt]');
      if (t !== tel) { if (tel) tel.style.transform = ''; tel = t; }
      if (!tel) return;
      var r = tel.getBoundingClientRect();
      ry = (((e.clientX - r.left) / r.width) - 0.5) * 6;
      rx = -(((e.clientY - r.top) / r.height) - 0.5) * 6;
      if (!pend) { pend = true; requestAnimationFrame(paintTilt); }
    }, { passive: true });
  }

  /* ---------- Dúvidas ---------- */
  $$('.qa').forEach(function (q) {
    var b = $('button', q), a = $('.qa-a', q);
    b.addEventListener('click', function () {
      var open = !q.classList.contains('open');
      $$('.qa.open').forEach(function (o) { if (o !== q) { o.classList.remove('open'); $('button', o).setAttribute('aria-expanded', 'false'); $('.qa-a', o).setAttribute('aria-hidden', 'true'); } });
      q.classList.toggle('open', open);
      b.setAttribute('aria-expanded', String(open));
      a.setAttribute('aria-hidden', String(!open));
    });
  });

  /* ---------- Formulário ---------- */
  var form = $('#form-contato');
  if (form) {
    var box = form.parentNode;
    var fail = $('.fail', form), btn = $('button[type=submit]', form), btnLabel = btn ? btn.querySelector('span:last-child') : null;
    var showErr = function (name, on) {
      var el = form.querySelector('[data-err="' + name + '"]');
      if (el) el.hidden = !on;
      $$('[name="' + name + '"]', form).forEach(function (i) { if (i.type !== 'radio') i.setAttribute('aria-invalid', on ? 'true' : 'false'); });
    };
    form.addEventListener('change', function (e) { if (e.target.name) showErr(e.target.name, false); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = new FormData(form);
      if (f.get('empresa_site')) return;
      var g = function (k) { return String(f.get(k) || '').trim(); };
      var bad = [];
      $$('[data-field]', form).forEach(function (el) {
        var name = el.getAttribute('data-field'), kind = el.getAttribute('data-kind'), req = el.hasAttribute('data-required');
        var v = g(name), ok = true;
        if (req && !v) ok = false;
        if (ok && kind === 'tel' && v.replace(/\D/g, '').length < 10) ok = false;
        if (ok && kind === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ok = false;
        showErr(name, !ok);
        if (!ok) bad.push(name);
      });
      if (bad.length) {
        var first = form.querySelector('[name="' + bad[0] + '"]');
        if (first) first.focus();
        return;
      }
      if (fail) fail.hidden = true;
      var dados = {};
      $$('[data-field]', form).forEach(function (el) { dados[el.getAttribute('data-label')] = g(el.getAttribute('data-field')) || '-'; });
      var wa = String(C.whatsapp || '').replace(/\D/g, '');
      if (wa && wa.length <= 11) wa = '55' + wa;
      var email = String(C.email || '').trim();
      var ok = function () {
        (window.dataLayer = window.dataLayer || []).push({ event: 'generate_lead', form_name: C.formName || 'contato' });
        box.innerHTML = '<div class="sent" role="status"><i aria-hidden="true"></i><p>Recebemos sua mensagem. Nossa equipe vai falar com você pelo contato informado.</p></div>';
      };
      var bad2 = function () { if (btn) { btn.disabled = false; if (btnLabel) btnLabel.textContent = 'Enviar'; } if (fail) fail.hidden = false; };
      if (btn) { btn.disabled = true; if (btnLabel) btnLabel.textContent = 'Enviando…'; }
      if (wa) {
        var txt = (C.waIntro || 'Olá! Vim pelo site.') + '\n\n' + Object.keys(dados).map(function (k) { return '*' + k + ':* ' + dados[k]; }).join('\n');
        window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      }
      if (email) {
        var body = Object.assign({}, dados, { _subject: 'Novo contato pelo site ' + (C.name || '') + ': ' + (dados.Nome || ''), _template: 'table', _captcha: 'false' });
        if (g('email')) body._replyto = g('email');
        fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) })
          .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { (r.ok && String(j.success) !== 'false') || wa ? ok() : bad2(); }); })
          .catch(function () { wa ? ok() : bad2(); });
        return;
      }
      if (wa) { ok(); return; }
      console.info('[site] Formulário em modo demonstração: preencha whatsapp/email no arquivo de dados da empresa.', dados);
      setTimeout(ok, 900);
    });
  }

  /* ---------- Rodapé e dados da empresa ---------- */
  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  layoutStacks();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layoutStacks(); dirty = true; });
  window.addEventListener('load', function () { layoutStacks(); dirty = true; });
  requestAnimationFrame(tick);
})();
