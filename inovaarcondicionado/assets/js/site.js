/* ============================================================
   INOVA — comportamento do site
   1. Consentimento de cookies (RGPD): Pixel e Google Ads só carregam com "marketing".
   2. Menu, header, revelar ao rolar, contadores, WhatsApp flutuante.
   3. Formulário: n8n + UTMs + WhatsApp (lógica mantida do site anterior).
   4. Smooth scroll (Lenis) só em desktop e sem reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var INOVA = {
    pixelId: '1859517301596350',
    adsId: 'AW-17076769531',
    adsConversion: 'AW-17076769531/U_N7CIOhi5gdEPul684_',
    n8nWebhook: 'https://n8n-n8n-start.dnjlb7.easypanel.host/webhook/inova-site',
    whatsappNumber: '351932270563',
    whatsappRedirect: 'https://criativivo.com.br/redirect/468c61f4-ad3f-4d7f-bd7a-1ecfab6e8f84',
    consentKey: 'inova_consent_v1',
    trackingKey: 'inova_tracking'
  };

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- 1. Consentimento ---------------- */
  var consent = {
    read: function () {
      try { var raw = localStorage.getItem(INOVA.consentKey); return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
    },
    write: function (prefs) {
      var value = { necessary: true, analytics: !!prefs.analytics, marketing: !!prefs.marketing, date: new Date().toISOString() };
      try { localStorage.setItem(INOVA.consentKey, JSON.stringify(value)); } catch (e) { /* sem armazenamento: pede de novo na próxima visita */ }
      return value;
    },
    apply: function (value) {
      if (value && value.marketing) loadMarketing();
      document.dispatchEvent(new CustomEvent('inova:consent', { detail: value }));
    }
  };

  var marketingLoaded = false;
  function loadMarketing() {
    if (marketingLoaded) return;
    marketingLoaded = true;

    // Google Ads (sem page_view automático, igual ao site anterior)
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', INOVA.adsId, { send_page_view: false });
    var g = document.createElement('script');
    g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + INOVA.adsId;
    document.head.appendChild(g);

    // Meta Pixel
    /* eslint-disable */
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    /* eslint-enable */
    window.fbq('init', INOVA.pixelId);
    window.fbq('track', 'PageView');
  }

  function setupCookieUI() {
    var bar = document.getElementById('cookie-bar');
    var modal = document.getElementById('cookie-modal');
    if (!bar || !modal) return;
    var chkAnalytics = modal.querySelector('[name="analytics"]');
    var chkMarketing = modal.querySelector('[name="marketing"]');

    function openBar() { bar.classList.add('is-open'); }
    function closeBar() { bar.classList.remove('is-open'); }
    function openModal() {
      var cur = consent.read() || {};
      if (chkAnalytics) chkAnalytics.checked = !!cur.analytics;
      if (chkMarketing) chkMarketing.checked = !!cur.marketing;
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      var first = modal.querySelector('button, input');
      if (first) first.focus();
    }
    function closeModal() { modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true'); }
    function save(prefs) { var v = consent.write(prefs); consent.apply(v); closeBar(); closeModal(); }

    bar.querySelector('[data-cookie="accept"]').addEventListener('click', function () { save({ analytics: true, marketing: true }); });
    bar.querySelector('[data-cookie="reject"]').addEventListener('click', function () { save({ analytics: false, marketing: false }); });
    bar.querySelector('[data-cookie="settings"]').addEventListener('click', openModal);
    modal.querySelector('[data-cookie="save"]').addEventListener('click', function () {
      save({ analytics: chkAnalytics && chkAnalytics.checked, marketing: chkMarketing && chkMarketing.checked });
    });
    modal.querySelector('[data-cookie="accept-all"]').addEventListener('click', function () { save({ analytics: true, marketing: true }); });
    modal.querySelector('[data-cookie="close"]').addEventListener('click', function () { closeModal(); if (!consent.read()) openBar(); });
    modal.addEventListener('click', function (e) { if (e.target === modal) { closeModal(); if (!consent.read()) openBar(); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.classList.contains('is-open')) { closeModal(); if (!consent.read()) openBar(); } });
    document.querySelectorAll('[data-cookie="reopen"]').forEach(function (b) { b.addEventListener('click', function (e) { e.preventDefault(); openModal(); }); });

    var saved = consent.read();
    if (saved) consent.apply(saved); else openBar();
  }

  /* ---------------- 2. Interface ---------------- */
  function setupHeader() {
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.getElementById('mobile-menu');

    // marca a página atual
    var here = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(function (a) {
      var target = (a.getAttribute('href') || '').split('#')[0];
      if (target && target === here) a.setAttribute('aria-current', 'page');
    });

    // some ao rolar para baixo, volta ao rolar para cima (com desfoque, via CSS)
    if (header) {
      var lastY = window.scrollY, hidden = false, accum = 0;
      var onScroll = function () {
        var y = window.scrollY, dy = y - lastY; lastY = y;
        header.classList.toggle('is-scrolled', y > 8);
        if (menu && menu.classList.contains('is-open')) return;
        accum = (dy > 0) === (accum > 0) ? accum + dy : dy; // acumula na mesma direção
        if (y < 80) { if (hidden) { hidden = false; header.classList.remove('is-hidden'); } return; }
        if (!hidden && accum > 24) { hidden = true; header.classList.add('is-hidden'); }
        else if (hidden && accum < -12) { hidden = false; header.classList.remove('is-hidden'); }
      };
      onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    }

    // indicador que desliza entre as ligações
    var links = document.querySelector('.nav-links');
    var pill = links && links.querySelector('.nav-pill');
    if (links && pill) {
      var current = links.querySelector('a[aria-current="page"]');
      var moveTo = function (a) {
        if (!a) { pill.classList.remove('is-on'); return; }
        pill.style.width = a.offsetWidth + 'px';
        pill.style.transform = 'translateX(' + a.offsetLeft + 'px)';
        pill.classList.add('is-on');
      };
      // a bolha só muda ao clicar: desliza até ao link escolhido e depois abre a página
      links.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function (e) {
          if (a === current || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          moveTo(a); current = a;
          setTimeout(function () { window.location.href = a.href; }, 320);
        });
      });
      var place = function () { pill.style.transition = 'none'; moveTo(current); void pill.offsetWidth; pill.style.transition = ''; };
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(place); else place();
      window.addEventListener('resize', function () { moveTo(current); });
    }

    // menu mobile
    if (toggle && menu) {
      var closeBtn = menu.querySelector('.mm-close');
      var setOpen = function (open) {
        menu.classList.toggle('is-open', open);
        menu.setAttribute('aria-hidden', String(!open));
        document.body.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
        if (open && closeBtn) closeBtn.focus(); else if (!open) toggle.focus();
      };
      toggle.addEventListener('click', function () { setOpen(!menu.classList.contains('is-open')); });
      if (closeBtn) closeBtn.addEventListener('click', function () { setOpen(false); });
      menu.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('is-open')) setOpen(false); });
      if (location.hash === '#menu') setOpen(true); // ligação direta ao menu (ex.: botão "Menu" noutra página)
    }
  }

  function setupReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;
    if (reducedMotion || !('IntersectionObserver' in window)) { items.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  }

  function setupCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    function run(el) {
      var end = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      if (reducedMotion) { el.textContent = end.toLocaleString('pt-PT') + suffix; return; }
      var start = null, dur = 1800;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(end * eased).toLocaleString('pt-PT') + (p === 1 ? suffix : '');
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.5 });
    counters.forEach(function (c) { io.observe(c); });
  }

  function setupFloatingWhatsapp() {
    var btn = document.getElementById('wa-float');
    if (!btn) return;
    var hero = document.querySelector('.hero, .page-hero');
    if (!hero) { btn.classList.add('is-visible'); return; }
    new IntersectionObserver(function (entries) {
      var en = entries[0];
      btn.classList.toggle('is-visible', !en.isIntersecting && en.boundingClientRect.bottom <= 0);
    }).observe(hero);
  }

  function setupSmoothScroll() {
    if (reducedMotion) return;
    if (!window.matchMedia('(min-width: 1024px) and (hover: hover)').matches) return;
    if (typeof window.Lenis !== 'function') return;
    var lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    window.inovaLenis = lenis;
    function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: -100 });
      });
    });
  }

  // Carrossel contínuo: anda sozinho, arrasta-se com rato ou dedo e retoma o andamento ao largar.
  function setupReviewsCarousel() {
    var root = document.getElementById('reviews-carousel');
    if (!root) return;
    var track = root.querySelector('.rv-track');
    var originals = Array.prototype.slice.call(track.children);
    if (originals.length < 2) return;
    // duplica até ter pelo menos 2 ecrãs de largura, para o laço ser invisível
    var copies = 0;
    do {
      originals.forEach(function (el) { var c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
      copies++;
    } while (track.scrollWidth < root.clientWidth * 2 + 1 && copies < 6);

    var gap = parseFloat(getComputedStyle(track).gap) || 0;
    var loopWidth = 0;
    function measure() {
      loopWidth = 0;
      originals.forEach(function (el) { loopWidth += el.getBoundingClientRect().width + gap; });
    }
    measure();
    window.addEventListener('resize', measure);

    var x = 0, baseSpeed = reducedMotion ? 0 : 28; // px por segundo
    var speed = baseSpeed, dragging = false, lastX = 0, lastT = 0, velocity = 0, moved = 0;
    var last = performance.now();

    function wrap() {
      if (loopWidth <= 0) return;
      while (x <= -loopWidth) x += loopWidth;
      while (x > 0) x -= loopWidth;
    }
    function frame(now) {
      var dt = Math.min((now - last) / 1000, .05); last = now;
      if (!dragging) {
        // depois de largar, a velocidade do gesto decai suavemente até ao andamento base
        speed += (baseSpeed - speed) * Math.min(1, dt * 2.2);
        x -= speed * dt;
      }
      wrap();
      track.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    root.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; moved = 0; velocity = 0;
      lastX = e.clientX; lastT = performance.now();
      root.classList.add('is-dragging');
      root.setPointerCapture(e.pointerId);
    });
    root.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var now = performance.now(), dx = e.clientX - lastX, dt = (now - lastT) / 1000;
      x += dx; moved += Math.abs(dx);
      if (dt > 0) velocity = velocity * .4 + (-dx / dt) * .6;
      lastX = e.clientX; lastT = now;
    });
    function release() {
      if (!dragging) return;
      dragging = false;
      root.classList.remove('is-dragging');
      // continua na direção e ritmo do gesto, limitado, e volta ao andamento base
      speed = Math.max(-1400, Math.min(1400, velocity));
      if (Math.abs(speed) < baseSpeed) speed = baseSpeed;
    }
    root.addEventListener('pointerup', release);
    root.addEventListener('pointercancel', release);
    root.addEventListener('lostpointercapture', release);
    root.addEventListener('click', function (e) { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  }

  /* ---------------- 3. Tracking + formulário ---------------- */
  var TRACK_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];

  function capturarParamsURL() {
    var params = new URLSearchParams(window.location.search), dados = {};
    TRACK_KEYS.forEach(function (k) { var v = (params.get(k) || '').trim(); if (v) dados[k] = v; });
    return dados;
  }
  // Atribuição da visita atual: sem UTMs, origem direct. Não reutiliza campanhas antigas.
  function obterTracking() {
    var atual = capturarParamsURL();
    var temUTM = TRACK_KEYS.some(function (k) { return k.indexOf('utm_') === 0 && atual[k]; });
    if (!temUTM) atual.utm_source = 'direct';
    var final = {};
    TRACK_KEYS.forEach(function (k) { final[k] = atual[k] || ''; });
    return final;
  }
  function propagarParamsRedirect() {
    var p = new URLSearchParams(window.location.search), u = {};
    var blacklist = ['senha', 'password', 'token', 'session', 'api_key'];
    p.forEach(function (value, key) { if (blacklist.indexOf(key.toLowerCase()) === -1) u[key] = value; });
    if (!Object.keys(u).length) return;
    document.querySelectorAll('a[href*="criativivo.com.br/redirect/"]').forEach(function (l) {
      try { var url = new URL(l.getAttribute('href')); Object.keys(u).forEach(function (k) { url.searchParams.set(k, u[k]); }); l.setAttribute('href', url.toString()); } catch (e) { /* mantém o link original */ }
    });
  }

  function setupTracking() {
    try { localStorage.setItem(INOVA.trackingKey, JSON.stringify(obterTracking())); } catch (e) { /* sem armazenamento */ }
    propagarParamsRedirect();

    // Cliques no WhatsApp: Contact + Lead (só se o Pixel estiver carregado, ou seja, com consentimento)
    document.addEventListener('click', function (event) {
      var link = event.target.closest && event.target.closest('a[href]');
      if (!link) return;
      var url; try { url = new URL(link.href, window.location.href); } catch (e) { return; }
      var host = url.hostname.toLowerCase();
      var whatsapp = ['wa.me', 'api.whatsapp.com', 'web.whatsapp.com', 'www.whatsapp.com', 'whatsapp.com'].indexOf(host) !== -1
        || url.protocol === 'whatsapp:'
        || (host === 'criativivo.com.br' && url.pathname.indexOf('/redirect/') === 0);
      if (!whatsapp || typeof window.fbq !== 'function') return;
      try {
        window.fbq('track', 'Contact', { content_name: 'WhatsApp' });
        window.fbq('track', 'Lead', { content_name: 'WhatsApp', content_category: 'Clique WhatsApp', lead_source: 'whatsapp_click' });
      } catch (e) { /* analytics bloqueado não impede o destino */ }
    });
    // Ligações "tel:" só funcionam em telemóveis. Em computadores (sem toque) abrem a conversa de WhatsApp com o mesmo número.
    var semToque = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (semToque) {
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        a.setAttribute('title', 'Em computador abre o WhatsApp; no telemóvel liga diretamente');
        a.addEventListener('click', function (e) {
          e.preventDefault();
          window.open('https://api.whatsapp.com/send?phone=' + INOVA.whatsappNumber + '&text=' + encodeURIComponent('Olá Inova! Vim pelo site e gostaria de falar com a equipa.'), '_blank', 'noopener');
        });
      });
    }
    document.querySelectorAll('a[href$="#contacto"], a[href$="contactos.html"]').forEach(function (btn) {
      btn.addEventListener('click', function () { if (typeof window.fbq === 'function') window.fbq('track', 'ViewContent', { content_name: 'Botao Orcamento' }); });
    });
  }

  // Recibo somente após gravação no Sheets (n8n). 2xx vazio ou texto = aceitação HTTP; só o recibo confirma gravação.
  function interpretarRespostaFormulario(texto) {
    if (!texto.trim()) return null;
    var dados;
    try { dados = JSON.parse(texto); } catch (e) {
      if (texto.trim().charAt(0) === '<') throw new Error('Resposta HTML inesperada');
      if (/\b(error|failed|failure|erro|falha)\b/i.test(texto)) throw new Error('Erro no processamento');
      return null;
    }
    if (Array.isArray(dados)) { if (dados.length !== 1) throw new Error('Resposta ambígua'); dados = dados[0]; }
    if (dados && (dados.ok === false || dados.saved === false || dados.success === false || dados.error || ['error', 'failed', 'failure'].indexOf(dados.status) !== -1)) {
      throw new Error('Envio rejeitado pelo sistema');
    }
    return dados;
  }

  function setupForm() {
    var form = document.getElementById('contactForm');
    if (!form) return;
    var envioEmCurso = false, envioConcluido = false;
    var status = document.getElementById('inova-form-status');
    var altWa = document.getElementById('inova-form-alt');
    var btn = form.querySelector('button[type="submit"]');
    var btnLabel = btn.querySelector('span') || btn;
    var originalText = btnLabel.textContent;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (envioEmCurso || envioConcluido) return;
      if (!form.checkValidity()) { form.reportValidity(); return; }
      envioEmCurso = true;
      btnLabel.textContent = 'A enviar...'; btn.disabled = true;
      status.textContent = 'A confirmar o envio...'; altWa.hidden = true;

      var tracking = obterTracking();
      var val = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; };
      var payload = {
        nome: val('name'), telefone: val('phone'), email: val('email'), mensagem: val('message'),
        utm_source: tracking.utm_source, utm_medium: tracking.utm_medium, utm_campaign: tracking.utm_campaign,
        utm_content: tracking.utm_content, utm_term: tracking.utm_term, gclid: tracking.gclid, fbclid: tracking.fbclid,
        pagina_url: window.location.href, referrer: document.referrer || '', data_envio: new Date().toISOString(),
        consentimento_privacidade: true
      };
      var texto = ['Olá Inova! Vim pelo site e gostaria de solicitar um orçamento.', '', 'Nome: ' + payload.nome, 'Telefone: ' + payload.telefone, 'E-mail: ' + payload.email, '', 'Mensagem: ' + payload.mensagem].join('\n');
      var linkWa = 'https://api.whatsapp.com/send?phone=' + INOVA.whatsappNumber + '&text=' + encodeURIComponent(texto);
      altWa.href = linkWa;

      var controller = new AbortController();
      var limite = setTimeout(function () { controller.abort(); }, 15000);

      fetch(INOVA.n8nWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: controller.signal })
        .then(function (r) { if (!r.ok) throw new Error('Resposta HTTP sem sucesso'); return r.text(); })
        .then(function (t) {
          var recibo = interpretarRespostaFormulario(t);
          var confirmada = Boolean(recibo && recibo.ok === true && recibo.saved === true && typeof recibo.receipt_id === 'string' && recibo.receipt_id.trim());
          envioConcluido = true;
          status.textContent = confirmada ? 'Pedido recebido. A abrir o WhatsApp com a mensagem preenchida.' : 'Envio aceite pelo sistema. A abrir o WhatsApp para continuar o atendimento.';
          altWa.hidden = false;
          btnLabel.textContent = confirmada ? 'Pedido recebido' : 'Continuar no WhatsApp';
          try { if (confirmada && typeof window.fbq === 'function') window.fbq('track', 'Lead', { content_category: 'Orcamento Inova' }, { eventID: 'inova-' + recibo.receipt_id }); } catch (e) { /* ok */ }
          var redirecionado = false;
          var abrir = function () { if (redirecionado) return; redirecionado = true; window.location.href = linkWa; };
          setTimeout(abrir, 2000);
          try {
            if (confirmada && typeof window.gtag === 'function') {
              window.gtag('event', 'conversion', { send_to: INOVA.adsConversion, transaction_id: 'inova-' + recibo.receipt_id, event_callback: abrir, event_timeout: 1800 });
            } else { abrir(); }
          } catch (e) { abrir(); }
        })
        .catch(function () {
          status.textContent = 'Não foi possível confirmar a receção do pedido. Para evitar duplicados, pode continuar pelo WhatsApp ou tentar novamente mais tarde.';
          altWa.hidden = false; btnLabel.textContent = originalText; btn.disabled = false; envioEmCurso = false;
        })
        .finally(function () { clearTimeout(limite); });
    });
  }

  /* ---------------- arranque ---------------- */
  function init() {
    setupCookieUI();
    setupHeader();
    setupReveal();
    setupCounters();
    setupFloatingWhatsapp();
    setupReviewsCarousel();
    setupTracking();
    setupForm();
    setupSmoothScroll();
    var y = document.getElementById('year'); if (y) y.textContent = String(new Date().getFullYear());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
