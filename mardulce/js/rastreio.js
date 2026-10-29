/* Rastreio padrão Descomplica Site
   - Repassa UTMs da URL para links de WhatsApp, site e formulários
   - Monta links de WhatsApp com mensagem pronta por botão (data-wa-msg)
   - Preenche links a partir do CONFIG (data-link="CHAVE")
   - Dispara evento de clique em todo elemento com data-btn (GA4 + Meta Pixel, se aceitos no consent.js)
   Só editar o bloco CONFIG. */
(function () {
  "use strict";

  var CONFIG = {
    whatsapp: "351917469576", // só números, com 351
    msgPadrao: "Olá Dulce! Vim pelo site e gostaria de mais informações.",
    links: {
      // CHAVE: "url"  -> usado por <a data-link="CHAVE">
      // site: "https://...", instagram: "https://instagram.com/...", maps: "https://maps.app.goo.gl/..."
    }
  };

  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"];
  var STORE = "site-utm-v1";

  function lerUTM() {
    var p = new URLSearchParams(location.search), u = {}, achou = false;
    UTM_KEYS.forEach(function (k) { if (p.get(k)) { u[k] = p.get(k); achou = true; } });
    try {
      if (achou) sessionStorage.setItem(STORE, JSON.stringify(u));
      else u = JSON.parse(sessionStorage.getItem(STORE) || "{}");
    } catch (e) { /* navegação privada */ }
    return u;
  }
  var utm = lerUTM();

  function comUTM(url) {
    if (!url || url.charAt(0) === "#" || /^(mailto|tel):/.test(url)) return url;
    try {
      var a = new URL(url, location.href);
      Object.keys(utm).forEach(function (k) { if (!a.searchParams.has(k)) a.searchParams.set(k, utm[k]); });
      return a.toString();
    } catch (e) { return url; }
  }

  function linkWhats(msg) {
    var origem = utm.utm_source ? " [origem: " + utm.utm_source + (utm.utm_campaign ? "/" + utm.utm_campaign : "") + "]" : "";
    return "https://wa.me/" + CONFIG.whatsapp + "?text=" + encodeURIComponent((msg || CONFIG.msgPadrao) + origem);
  }

  function preparar() {
    // Botões de WhatsApp: <a data-wa data-wa-msg="Quero um orçamento de cortinas">
    document.querySelectorAll("[data-wa]").forEach(function (el) {
      if (CONFIG.whatsapp) { el.href = linkWhats(el.getAttribute("data-wa-msg")); el.target = "_blank"; el.rel = "noopener"; }
    });
    // Links do CONFIG: <a data-link="instagram">
    document.querySelectorAll("[data-link]").forEach(function (el) {
      var url = CONFIG.links[el.getAttribute("data-link")];
      if (url) { el.href = comUTM(url); if (/^https?:/.test(url)) { el.target = "_blank"; el.rel = "noopener"; } }
    });
    // Links externos comuns recebem UTM
    document.querySelectorAll('a[href^="http"]:not([data-wa])').forEach(function (el) { el.href = comUTM(el.href); });
    // Formulários recebem campos ocultos com as UTMs
    document.querySelectorAll("form").forEach(function (f) {
      Object.keys(utm).forEach(function (k) {
        if (f.querySelector('[name="' + k + '"]')) return;
        var i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = utm[k]; f.appendChild(i);
      });
    });
  }

  // Evento de clique em data-btn
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-btn]");
    if (!el) return;
    var nome = el.getAttribute("data-btn");
    var whats = el.hasAttribute("data-wa") || /wa\.me|whatsapp/.test(el.href || "");
    if (window.gtag) window.gtag("event", whats ? "clique_whatsapp" : "clique_botao", { botao: nome });
    if (window.fbq) window.fbq(whats ? "track" : "trackCustom", whats ? "Contact" : "CliqueBotao", { botao: nome });
    if (window.dataLayer) window.dataLayer.push({ event: "clique_botao", botao: nome });
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", preparar);
  else preparar();
})();
