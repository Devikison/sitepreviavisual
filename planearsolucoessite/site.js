/* Sites institucionais do grupo Planear/Tambelli: motor comum.
   Cada site tem o próprio layout e CSS; aqui ficam só os comportamentos.
   Toda animação de rolagem roda num único requestAnimationFrame e só mexe
   em transform e opacity (ou troca de classe). */
(function () {
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var C = window.SITE || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var cl = function (x) { return Math.min(1, Math.max(0, x)); };

  /* ---------- Repasse de UTM (WhatsApp e formulário) ---------- */
  var utm = {};
  try {
    var q = new URLSearchParams(location.search);
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(function (k) { if (q.get(k)) utm[k] = q.get(k); });
    if (Object.keys(utm).length) sessionStorage.setItem('site_utm', JSON.stringify(utm));
    else utm = JSON.parse(sessionStorage.getItem('site_utm') || '{}');
  } catch (e) { utm = {}; }
  var utmLine = function () {
    var o = [utm.utm_source, utm.utm_medium, utm.utm_campaign].filter(Boolean).join(' / ');
    return o ? '\n\n(origem: ' + o + ')' : '';
  };
  window.addEventListener('load', function () {
    if (!utmLine()) return;
    $$('a[href*="wa.me/"]').forEach(function (a) {
      try { var u = new URL(a.href); u.searchParams.set('text', (u.searchParams.get('text') || '') + utmLine()); a.href = u.toString(); } catch (e) {}
    });
  });

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
    scrollToY(t ? t.getBoundingClientRect().top + window.scrollY - (id === 'inicio' ? 0 : 88) : 0);
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
    hdr.classList.toggle('is-scrolled', y > 24);
    var hide = d > 0 && y > 160 && !(mnav && mnav.classList.contains('is-open'));
    if (hide !== hidden) { hidden = hide; hdr.classList.toggle('is-hidden', hide); }
  }

  /* ---------- Cards empilhados (position: sticky + escala/sombra) ---------- */
  var stacks = $$('[data-stack]').map(function (s) {
    return { s: s, head: $('.stack-head', s), hy: 0, idx: $$('[data-idx]', s), active: -1,
      cards: $$('.card', s).map(function (c) { return { c: c, shade: $('.shade', c), top0: parseFloat(c.getAttribute('data-top')) || 110 }; }) };
  });
  function layoutStacks() {
    var desk = window.innerWidth >= 960;
    var hb = hdr ? hdr.offsetTop + hdr.offsetHeight : 76;
    stacks.forEach(function (g) {
      if (desk) {
        if (g.head) g.head.style.top = (hb + 32) + 'px';
        g.cards.forEach(function (o) { o.c.style.top = o.top0 + 'px'; });
        return;
      }
      var ht = Math.round(hb + 8);
      if (g.head) g.head.style.top = ht + 'px';
      var base = ht + (g.head ? g.head.offsetHeight : 0) + 14;
      g.cards.forEach(function (o, i) { o.c.style.top = (base + i * 12) + 'px'; });
    });
  }

  /* ---------- Efeitos ligados à rolagem ----------
     [data-scrub="pin|pass"] calcula o progresso p (0 a 1) da seção.
       pin:  seção alta com conteúdo grudado; p vai de 0 a 1 enquanto ela passa.
       pass: p vai de 0 (topo a 85% da tela) a 1 (fim da seção chega a 70% da tela).
       enter: p vai de 0 a 1 logo na entrada (topo de 90% a 30% da tela).
     Filhos:
       [data-x]                 trilho horizontal que anda conforme p
       [data-fill="i"]          escala 0 a 1 na fatia i (data-axis="x|y")
       [data-on="i"]            ganha .on quando a fatia i começa
       [data-cur="i"]           ganha .on só enquanto a fatia i é a atual
       [data-bar]               escala igual a p (data-axis)
     [data-follow]: p segue os itens [data-on] pela tela (etapa atual = a que passou do meio). */
  var scrubs = $$('[data-scrub]').map(function (s) {
    return { s: s, mode: s.getAttribute('data-scrub'), n: +s.getAttribute('data-n') || 4,
      x: $('[data-x]', s), fills: $$('[data-fill]', s), ons: $$('[data-on]', s), curs: $$('[data-cur]', s), bars: $$('[data-bar]', s),
      p: -1, cur: 0, k: 0, follow: s.hasAttribute('data-follow') };
  });
  function scale(el, v) { el.style.transform = (el.getAttribute('data-axis') === 'y' ? 'scaleY(' : 'scaleX(') + v.toFixed(4) + ')'; }
  function paintScrub(g) {
    var p = g.cur, n = g.n, s = g.follow && !g.pinned ? p * (n - 1) + 0.001 : p * n;
    var desk = window.innerWidth >= 960;
    if (g.x) {
      if (desk) {
        var pv = g.x.parentNode, ps = getComputedStyle(pv);
        var w = Math.max(0, g.x.scrollWidth - (pv.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight)));
        // cada item chega alinhado à esquerda no meio da sua fatia, junto com a troca da etapa atual
        var it = g.x.children, f = Math.max(0, Math.min(it.length - 1, p * n - 0.5)), i0 = Math.floor(f), i1 = Math.min(it.length - 1, i0 + 1);
        var x = it.length ? it[i0].offsetLeft + (it[i1].offsetLeft - it[i0].offsetLeft) * (f - i0) - it[0].offsetLeft : w * p;
        g.x.style.transform = 'translate3d(' + (-Math.min(w, x)).toFixed(1) + 'px,0,0)';
      } else g.x.style.transform = '';
    }
    g.fills.forEach(function (e) { scale(e, reduced ? 1 : cl(s - (+e.getAttribute('data-fill')))); });
    g.bars.forEach(function (e) { scale(e, reduced ? 1 : p); });
    var at = Math.min(n - 1, Math.floor(s));
    g.ons.forEach(function (e) { e.classList.toggle('on', reduced || s >= +e.getAttribute('data-on')); });
    g.curs.forEach(function (e) { e.classList.toggle('on', +e.getAttribute('data-cur') === at); });
  }

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
            if (o.shade) o.shade.style.opacity = (t * 0.45).toFixed(3);
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
      scrubs.forEach(function (g) {
        var r = g.s.getBoundingClientRect();
        g.pinned = g.mode === 'pin' && g.s.offsetHeight > vh * 1.3;
        if (g.pinned) g.k = cl(-r.top / ((g.s.offsetHeight - vh) || 1));
        else if (g.follow && g.ons.length > 1) {
          var a = g.ons[0].getBoundingClientRect(), z = g.ons[g.ons.length - 1].getBoundingClientRect();
          // itens empilhados: a etapa atual é a que passou do meio da tela; lado a lado: avança enquanto o bloco sobe na tela
          g.k = z.top > a.top + 40 ? cl((vh * 0.55 - a.top - 30) / (z.top - a.top)) : cl((vh * 0.8 - Math.min(a.top, z.top)) / (vh * 0.55));
        }
        else if (g.mode === 'pin') g.k = cl((vh * 0.85 - r.top) / ((r.height + vh * 0.15) || 1));
        else if (g.mode === 'enter') g.k = cl((vh * 0.9 - r.top) / (vh * 0.6));
        else g.k = cl((vh * 0.85 - r.top) / ((r.height + vh * 0.15) || 1));
        g.vis = r.bottom > 0 && r.top < vh;
      });
    }
    scrubs.forEach(function (g) {
      var d = g.k - g.cur;
      if (Math.abs(d) < 0.0004 && g.p >= 0) return;
      g.cur += reduced ? d : d * 0.16;
      if (Math.abs(g.k - g.cur) < 0.0004) g.cur = g.k;
      g.p = g.cur;
      paintScrub(g);
    });
  }
  function tick(t) { smoothStep(t); headerStep(); frame(); requestAnimationFrame(tick); }

  /* ---------- Reflexo nos botões ---------- */
  $$('.btn').forEach(function (b) {
    if (b.querySelector('.sheen')) return;
    var s = document.createElement('span'); s.className = 'sheen'; s.setAttribute('aria-hidden', 'true');
    b.insertBefore(s, b.firstChild);
  });

  /* ---------- Parallax suave em imagens de fundo ---------- */
  var plx = $$('[data-parallax]');
  if (plx.length && !reduced) {
    var plxStep = function () {
      var vh = window.innerHeight;
      plx.forEach(function (el) {
        var host = el.parentNode.getBoundingClientRect();
        if (host.bottom < 0 || host.top > vh) return;
        var t = cl((vh - host.top) / (host.height + vh));
        var amt = +el.getAttribute('data-parallax') || 40;
        el.style.transform = 'translate3d(0,' + ((0.5 - t) * amt).toFixed(1) + 'px,0) scale(1.08)';
      });
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(plxStep); }, { passive: true });
    plxStep();
  }

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

  /* ---------- Abas (Para quem é) ---------- */
  $$('[data-tabs]').forEach(function (box) {
    var tabs = $$('[role="tab"]', box), panels = $$('[role="tabpanel"]', box);
    function pick(i, focus) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', String(i === j)); t.tabIndex = i === j ? 0 : -1; });
      panels.forEach(function (p, j) { p.hidden = i !== j; });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') pick((i + 1) % tabs.length, true);
        if (e.key === 'ArrowLeft') pick((i - 1 + tabs.length) % tabs.length, true);
      });
    });
  });

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
        var txt = (C.waIntro || 'Olá! Vim pelo site.') + '\n\n' + Object.keys(dados).map(function (k) { return '*' + k + ':* ' + dados[k]; }).join('\n') + utmLine();
        window.open('https://wa.me/' + wa + '?text=' + encodeURIComponent(txt), '_blank', 'noopener');
      }
      if (email) {
        var body = Object.assign({}, dados, utm, { _subject: 'Novo contato pelo site ' + (C.name || '') + ': ' + (dados.Nome || ''), _template: 'table', _captcha: 'false' });
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

  var yr = $('[data-year]'); if (yr) yr.textContent = new Date().getFullYear();

  layoutStacks();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { layoutStacks(); dirty = true; });
  window.addEventListener('load', function () { layoutStacks(); dirty = true; });
  requestAnimationFrame(tick);
})();
