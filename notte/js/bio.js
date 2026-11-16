/* NOTTE | link na bio
   Os links de WhatsApp e UTMs saem de js/rastreio.js. Aqui só: UTM de origem nos links internos e animação. */
(function () {
  "use strict";
  // Links internos levam a etiqueta de origem "link na bio" (padrão 2!H)
  document.querySelectorAll('a[data-btn^="bio-"]:not([data-wa])').forEach(function (a) {
    try {
      var u = new URL(a.getAttribute("href"), location.href);
      if (!u.searchParams.has("utm_source")) {
        u.searchParams.set("utm_source", "link_in_bio");
        u.searchParams.set("utm_medium", "organico");
        u.searchParams.set("utm_campaign", a.getAttribute("data-btn") === "bio-imersao-empresas" ? "imersao_empresas" : "institucional");
        u.searchParams.set("utm_content", a.getAttribute("data-btn").replace("bio-", ""));
      }
      a.href = u.toString();
    } catch (e) {}
  });
  var leque = document.querySelector(".bio__leque");
  if (leque) setTimeout(function () { leque.classList.add("is-aberto"); }, 300);

  var root = document.documentElement.getAttribute("data-root") || "";
  new MutationObserver(function () {
    document.querySelectorAll('.consent a[href="politica-de-cookies.html"]').forEach(function (a) { a.setAttribute("href", root + "politica-de-cookies.html"); });
  }).observe(document.body, { childList: true });
})();
