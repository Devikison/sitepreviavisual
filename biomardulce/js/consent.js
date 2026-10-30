/* Consentimento de cookies (RGPD).
   Nenhum script de medição carrega antes da escolha da pessoa.
   Para ativar GA4 ou Meta Pixel, preencha os IDs abaixo: eles só carregam com "Aceitar". */
(function () {
  "use strict";

  var CONFIG = {
    ga4: "",        // ex.: "G-XXXXXXXXXX"
    metaPixel: "",  // ex.: "123456789012345"
    vercelAnalytics: false
  };

  var KEY = "site-consent-v1";
  var isLocal = /^(localhost|127\.|192\.168\.)/.test(location.hostname);

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; }
  }
  function save(analytics) {
    var value = { analytics: !!analytics, date: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (e) { /* navegação privada */ }
    return value;
  }

  function addScript(src) {
    var s = document.createElement("script");
    s.async = true; s.src = src;
    document.head.appendChild(s);
  }

  var loaded = false;
  function loadAnalytics() {
    if (loaded || isLocal) return;
    loaded = true;
    if (CONFIG.vercelAnalytics) addScript("/_vercel/insights/script.js");
    if (CONFIG.ga4) {
      addScript("https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.ga4));
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", CONFIG.ga4, { anonymize_ip: true });
    }
    if (CONFIG.metaPixel) {
      /* código padrão do Meta Pixel */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", CONFIG.metaPixel);
      window.fbq("track", "PageView");
    }
  }

  /* ---------- Aviso ---------- */
  var banner;
  function build() {
    banner = document.createElement("section");
    banner.className = "consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Aviso de cookies");
    banner.innerHTML =
      '<p class="consent__title">A tua privacidade</p>' +
      '<p class="consent__text">Usamos cookies essenciais para o site funcionar e, com a tua autorização, cookies de medição para perceber as visitas. Podes mudar a escolha quando quiseres. Sabe mais na <a href="../mardulcecabeleireiro/politica-de-cookies.html">Política de Cookies</a>.</p>' +
      '<div class="consent__actions">' +
      '<button type="button" class="btn btn-gold" data-consent="accept">Aceitar</button>' +
      '<button type="button" class="btn btn-outline" data-consent="reject">Só essenciais</button>' +
      "</div>";
    banner.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (!b) return;
      var accepted = b.getAttribute("data-consent") === "accept";
      save(accepted);
      if (accepted) loadAnalytics();
      hide();
    });
    document.body.appendChild(banner);
  }
  function show() {
    if (!banner) build();
    requestAnimationFrame(function () { banner.classList.add("is-on"); });
  }
  function hide() { if (banner) banner.classList.remove("is-on"); }

  /* links "Preferências de cookies" reabrem o aviso */
  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-cookie-settings]")) { e.preventDefault(); show(); }
  });

  var choice = read();
  if (choice && choice.analytics) loadAnalytics();
  if (!choice) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(show, 900); });
    else setTimeout(show, 900);
  }
})();
