/* =====================================================================
   PLANEAR CONSTRUTORA · arquivo compartilhado por todas as páginas
   ---------------------------------------------------------------------
   DADOS DA EMPRESA: preencha aqui quando chegarem. Vale para o site e
   para as páginas de Privacidade, Termos e Cookies.
   whatsapp: número com DDD, ex. '(15) 99999-9999'. Liga o ícone do rodapé
             e o envio do formulário pelo WhatsApp.
   email:    e-mail que recebe os pedidos do formulário (FormSubmit) e os
             pedidos de privacidade. No 1º envio chega um e-mail de ativação
             do FormSubmit: clicar em "Activate".
   cnpj:     ex. '12.345.678/0001-90'. Vazio = não aparece.
   linkedin: link completo da página da empresa. Vazio = ícone escondido.
   Sem whatsapp e sem email o formulário fica em modo demonstração.
   ===================================================================== */
window.PLANEAR = {
  whatsapp: '',
  email: '',
  cnpj: '',
  instagram: 'https://www.instagram.com/planearconstrutora/',
  linkedin: '',
  gtm: 'GTM-5WPWR92P'
};

(function () {
  var P = window.PLANEAR;
  var KEY = 'planear_consent';
  var VERSION = 1;
  var base = (document.currentScript && document.currentScript.src || '').replace(/[^/]*$/, '');

  /* ---------- Consentimento (Google Consent Mode v2) + GTM ---------- */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  function read() {
    try { var c = JSON.parse(localStorage.getItem(KEY)); return c && c.v === VERSION ? c : null; } catch (e) { return null; }
  }
  function signals(c) {
    var a = c && c.analytics ? 'granted' : 'denied', m = c && c.marketing ? 'granted' : 'denied';
    return { analytics_storage: a, ad_storage: m, ad_user_data: m, ad_personalization: m };
  }
  var saved = read();
  gtag('consent', 'default', Object.assign(signals(null), { functionality_storage: 'granted', security_storage: 'granted', wait_for_update: 500 }));
  if (saved) gtag('consent', 'update', signals(saved));

  if (P.gtm) {
    window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(P.gtm);
    document.head.appendChild(s);
  }

  function store(analytics, marketing) {
    var c = { v: VERSION, analytics: !!analytics, marketing: !!marketing, ts: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    gtag('consent', 'update', signals(c));
    window.dataLayer.push({ event: 'consent_update', consent_analytics: c.analytics, consent_marketing: c.marketing });
    return c;
  }

  /* ---------- Utilidades de dados ---------- */
  P.waNumber = function () {
    var n = String(P.whatsapp || '').replace(/\D/g, '');
    return n && n.length <= 11 ? '55' + n : n;
  };
  P.waLink = function (msg) {
    var n = P.waNumber();
    return n ? 'https://wa.me/' + n + '?text=' + encodeURIComponent(msg || 'Olá, Planear! Vim pelo site e quero falar sobre minha obra.') : '';
  };

  /* Preenche [data-cfg] e [data-cfg-link] nas páginas estáticas */
  function fill() {
    document.querySelectorAll('[data-cfg]').forEach(function (el) {
      var v = String(P[el.getAttribute('data-cfg')] || '').trim();
      var wrap = el.closest('[data-cfg-wrap]') || el;
      if (v) { el.textContent = v; wrap.hidden = false; } else { wrap.hidden = true; }
    });
    document.querySelectorAll('[data-cfg-link]').forEach(function (el) {
      var k = el.getAttribute('data-cfg-link');
      var url = k === 'whatsapp' ? P.waLink() : k === 'email' ? (P.email ? 'mailto:' + P.email : '') : P[k];
      if (url) { el.href = url; el.hidden = false; } else { el.hidden = true; }
    });
    document.querySelectorAll('[data-cfg-has]').forEach(function (el) {
      var keys = el.getAttribute('data-cfg-has').split(',');
      el.hidden = !keys.some(function (k) { return k === 'whatsapp' ? P.waNumber() : P[k]; });
    });
    document.querySelectorAll('[data-cfg-none]').forEach(function (el) {
      var keys = el.getAttribute('data-cfg-none').split(',');
      el.hidden = keys.some(function (k) { return k === 'whatsapp' ? P.waNumber() : P[k]; });
    });
  }

  /* ---------- Banner de cookies (canto inferior esquerdo) ---------- */
  var css = '' +
    '.pc-ck{position:fixed;left:clamp(12px,2vw,24px);bottom:clamp(12px,2vw,24px);z-index:90;width:min(372px,calc(100vw - 24px));font-family:"Inter Tight","Helvetica Neue",Helvetica,Arial,sans-serif;color:#0E2A22;background:rgba(255,255,255,.9);border:1px solid rgba(255,255,255,.95);border-radius:16px;box-shadow:inset 0 1px 0 #fff,0 24px 50px -24px rgba(5,42,33,.55),0 2px 8px -4px rgba(5,42,33,.2);backdrop-filter:blur(18px) saturate(160%);-webkit-backdrop-filter:blur(18px) saturate(160%);padding:16px 16px 14px;opacity:0;transform:translate3d(0,14px,0);transition:opacity .5s cubic-bezier(.2,.7,.2,1),transform .5s cubic-bezier(.2,.7,.2,1);user-select:none}' +
    '.pc-ck.pc-in{opacity:1;transform:none}' +
    '.pc-ck p{margin:0;font-size:14px;line-height:1.5;color:#3F5953}' +
    '.pc-ck p a{color:#0A5A45;font-weight:700;text-underline-offset:3px}.pc-ck p a:hover{color:#A35E58}' +
    '.pc-ck-t{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:14px;font-weight:700;letter-spacing:.01em;color:#0E2A22}' +
    '.pc-ck-t i{width:8px;height:8px;border-radius:50%;background:#12A07A;box-shadow:0 0 0 4px rgba(18,160,122,.16)}' +
    '.pc-ck-a{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}' +
    '.pc-ck button{font:inherit;font-size:14px;font-weight:600;min-height:40px;padding:0 14px;border-radius:6px;cursor:pointer;transition:background .4s cubic-bezier(.2,.7,.2,1),color .4s cubic-bezier(.2,.7,.2,1),border-color .4s cubic-bezier(.2,.7,.2,1),transform .4s cubic-bezier(.2,.7,.2,1)}' +
    '.pc-ck button:focus-visible{outline:3px solid #12A27A;outline-offset:2px}' +
    '.pc-ck .pc-p{background:linear-gradient(180deg,#0F8C69,#0A6E53);color:#fff;border:1px solid #086148;box-shadow:inset 0 1px 0 rgba(255,255,255,.24),0 8px 16px -10px rgba(5,42,33,.7)}' +
    '.pc-ck .pc-p:hover{background:linear-gradient(180deg,#12A07A,#0B7A5C);transform:translateY(-1px)}' +
    '.pc-ck .pc-s{background:linear-gradient(180deg,#fff,#F1F7F4);color:#0E2A22;border:1px solid rgba(14,42,34,.18)}' +
    '.pc-ck .pc-s:hover{background:#0A5A45;color:#fff;border-color:#0A5A45}' +
    '.pc-ck .pc-g{background:none;border:0;color:#0A5A45;padding:0 6px;text-decoration:underline;text-underline-offset:3px}' +
    '.pc-ck .pc-g:hover{color:#A35E58}' +
    '.pc-ck-x{position:absolute;top:8px;right:8px;width:32px!important;min-height:32px!important;padding:0!important;display:flex;align-items:center;justify-content:center;background:none;border:0;color:#3F5953}' +
    '.pc-ck-x:hover{color:#0A5A45;background:#E3F1EB!important}' +
    '.pc-ck-o{display:flex;flex-direction:column;gap:2px;margin-top:12px;border-top:1px solid rgba(14,42,34,.1);padding-top:6px}' +
    '.pc-ck-o label{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0;font-size:14px;font-weight:600;cursor:pointer}' +
    '.pc-ck-o small{display:block;font-size:12.5px;font-weight:400;color:#3F5953;margin-top:1px}' +
    '.pc-sw{position:relative;flex:none;width:40px;height:24px}' +
    '.pc-sw input{position:absolute;inset:0;opacity:0;margin:0;cursor:pointer}' +
    '.pc-sw span{position:absolute;inset:0;border-radius:999px;background:#CFDCD7;transition:background .3s}' +
    '.pc-sw span:after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(5,42,33,.3);transition:transform .3s cubic-bezier(.2,.7,.2,1)}' +
    '.pc-sw input:checked+span{background:#0A6E53}.pc-sw input:checked+span:after{transform:translateX(16px)}' +
    '.pc-sw input:disabled+span{background:#8FBFAE;cursor:not-allowed}' +
    '.pc-sw input:focus-visible+span{outline:3px solid #12A27A;outline-offset:2px}' +
    '@media (prefers-reduced-motion:reduce){.pc-ck{transition:none}}';

  var ICON_X = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  var box = null;

  function close() {
    if (!box) return;
    var b = box; box = null;
    b.classList.remove('pc-in');
    setTimeout(function () { b.remove(); }, 450);
  }

  function open(withOptions) {
    if (box) { if (withOptions) showOptions(); return; }
    if (!document.getElementById('pc-ck-css')) {
      var st = document.createElement('style'); st.id = 'pc-ck-css'; st.textContent = css; document.head.appendChild(st);
    }
    box = document.createElement('div');
    box.className = 'pc-ck';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-live', 'polite');
    box.setAttribute('aria-label', 'Preferências de cookies');
    box.innerHTML =
      '<p class="pc-ck-t"><i aria-hidden="true"></i>Cookies</p>' +
      '<p>Usamos cookies para o site funcionar e, com sua permissão, para medir visitas e melhorar anúncios. <a href="' + base + 'politica-de-cookies/">Saiba mais</a>.</p>' +
      '<div class="pc-ck-a">' +
        '<button type="button" class="pc-p" data-ck="all">Aceitar</button>' +
        '<button type="button" class="pc-s" data-ck="none">Recusar</button>' +
        '<button type="button" class="pc-g" data-ck="opts" aria-expanded="false">Personalizar</button>' +
      '</div>';
    if (read()) {
      var x = document.createElement('button');
      x.type = 'button'; x.className = 'pc-ck-x'; x.setAttribute('aria-label', 'Fechar'); x.innerHTML = ICON_X;
      x.addEventListener('click', close);
      box.appendChild(x);
    }
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ck]'); if (!b) return;
      var k = b.getAttribute('data-ck');
      if (k === 'all') { store(true, true); close(); }
      else if (k === 'none') { store(false, false); close(); }
      else if (k === 'opts') { showOptions(); }
      else if (k === 'save') { store(box.querySelector('[name=ck-a]').checked, box.querySelector('[name=ck-m]').checked); close(); }
    });
    document.body.appendChild(box);
    requestAnimationFrame(function () { requestAnimationFrame(function () { box && box.classList.add('pc-in'); }); });
    if (withOptions) showOptions();
  }

  function showOptions() {
    if (!box || box.querySelector('.pc-ck-o')) return;
    var c = read() || {};
    var o = document.createElement('div');
    o.className = 'pc-ck-o';
    o.innerHTML =
      '<label>Necessários<small>Funcionamento e segurança do site.</small><span class="pc-sw"><input type="checkbox" checked disabled aria-label="Cookies necessários, sempre ativos"><span></span></span></label>' +
      '<label>Estatística<small>Visitas e uso do site (Google Analytics, Clarity).</small><span class="pc-sw"><input type="checkbox" name="ck-a"' + (c.analytics ? ' checked' : '') + '><span></span></span></label>' +
      '<label>Marketing<small>Medir e melhorar anúncios (Google Ads, Meta).</small><span class="pc-sw"><input type="checkbox" name="ck-m"' + (c.marketing ? ' checked' : '') + '><span></span></span></label>';
    box.insertBefore(o, box.querySelector('.pc-ck-a'));
    var acts = box.querySelector('.pc-ck-a');
    acts.innerHTML = '<button type="button" class="pc-p" data-ck="save">Salvar escolhas</button><button type="button" class="pc-s" data-ck="all">Aceitar todos</button>';
    var first = o.querySelector('[name=ck-a]'); if (first) first.focus();
  }

  P.openCookies = function () { open(true); };

  /* Qualquer elemento com data-cookie-prefs reabre as preferências */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cookie-prefs]');
    if (t) { e.preventDefault(); open(true); }
  });

  function boot() {
    fill();
    if (!read()) setTimeout(function () { open(false); }, 900);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
