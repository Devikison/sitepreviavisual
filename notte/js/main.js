/* NOTTE | interações das páginas
   Número do WhatsApp: editar também em js/rastreio.js (CONFIG.whatsapp). */
(function () {
  "use strict";

  var WHATSAPP = "5511995354212"; // [CONFIRMAR] WhatsApp oficial da NOTTE
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement.getAttribute("data-root") || "";

  /* Títulos entrando palavra por palavra */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (parte) {
            if (!parte) return;
            if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var s = document.createElement("span"); s.textContent = parte; s.style.setProperty("--i", i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    })(el);
  });

  /* Revelação pela rolagem */
  var alvos = document.querySelectorAll(".rev, .split");
  if (reduz || !("IntersectionObserver" in window)) {
    alvos.forEach(function (el) { el.classList.add("is-on"); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-on"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    alvos.forEach(function (el) { io.observe(el); });
  }

  /* Leque de fitas do hero abre ao carregar */
  var leque = document.querySelector("[data-leque]");
  if (leque) setTimeout(function () { leque.classList.add("is-aberto"); }, reduz ? 0 : 350);

  /* Topo em vidro ao rolar + botão flutuante do celular */
  var topo = document.querySelector("[data-topo]");
  var flutua = document.querySelector(".whats-flutua");
  var proposta = document.getElementById("proposta");
  var naProposta = false;
  if (proposta && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { naProposta = es[0].isIntersecting; tick(); }, { threshold: 0.05 }).observe(proposta);
  }
  var hero = document.querySelector(".hero"), ultimoY = window.scrollY;
  function tick() {
    var y = window.scrollY, dy = y - ultimoY;
    if (topo) {
      topo.classList.toggle("is-vidro", y > 24);
      var fimHero = hero ? hero.offsetHeight * 0.85 : window.innerHeight * 0.85;
      // some só depois da primeira seção, descendo; volta ao subir (com folga para não piscar)
      if (y > fimHero && dy > 6) topo.classList.add("is-oculto");
      else if (dy < -6 || y <= fimHero) topo.classList.remove("is-oculto");
    }
    if (Math.abs(dy) > 6) ultimoY = y;
    if (flutua) flutua.classList.toggle("is-on", y > window.innerHeight * 0.7 && !naProposta);
  }
  window.addEventListener("scroll", tick, { passive: true });
  if (topo) topo.addEventListener("focusin", function () { topo.classList.remove("is-oculto"); });
  tick();

  /* FAQ: abre e fecha animando a altura, um por vez */
  document.querySelectorAll("[data-faq] details").forEach(function (d) {
    var sum = d.querySelector("summary"), resp = d.querySelector(".faq__resp");
    sum.addEventListener("click", function (e) {
      e.preventDefault();
      if (d.open) fechar(d); else {
        document.querySelectorAll("[data-faq] details[open]").forEach(fechar);
        d.open = true;
        if (!reduz && resp.animate) resp.animate([{ height: "0px", opacity: 0 }, { height: resp.scrollHeight + "px", opacity: 1 }], { duration: 700, easing: "cubic-bezier(.22,.8,.24,1)" });
      }
    });
    function fechar(el) {
      var r = el.querySelector(".faq__resp");
      if (reduz || !r.animate) { el.open = false; return; }
      var a = r.animate([{ height: r.scrollHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 500, easing: "cubic-bezier(.22,.8,.24,1)" });
      a.onfinish = function () { el.open = false; };
    }
  });

  /* Como acontece: o card no centro da tela define a foto e o nível da pirâmide */
  var roteiro = document.querySelector("[data-roteiro]");
  if (roteiro && "IntersectionObserver" in window) {
    var passos = roteiro.querySelectorAll("[data-passo]");
    var fotos = roteiro.querySelectorAll("[data-foto]");
    var niveis = roteiro.querySelectorAll("[data-nivel]");
    var ativar = function (n) {
      passos.forEach(function (el) { el.classList.toggle("is-ativo", el.getAttribute("data-passo") === n); });
      fotos.forEach(function (el) { el.classList.toggle("is-ativo", el.getAttribute("data-foto") === n); });
      niveis.forEach(function (el) { el.classList.toggle("is-ativo", el.getAttribute("data-nivel") === n); });
    };
    ativar("0");
    var ioR = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) ativar(e.target.getAttribute("data-passo")); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    passos.forEach(function (el) { ioR.observe(el); });
  }

  /* Luz que segue o mouse nos cards (só com mouse) */
  if (window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-luz] > li").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", (e.clientX - r.left) + "px");
        card.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });
  }

  /* Menu hambúrguer */
  var menu = document.querySelector("[data-menu]"), abrirBt = document.querySelector("[data-menu-abrir]");
  if (menu && abrirBt) {
    var abrir = function () {
      menu.hidden = false; document.documentElement.classList.add("menu-aberto");
      abrirBt.setAttribute("aria-expanded", "true"); abrirBt.setAttribute("aria-label", "Fechar menu");
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add("is-aberto"); }); });
      var f = menu.querySelector(".menu__fechar"); if (f) f.focus({ preventScroll: true });
    };
    var fechar = function (voltarFoco) {
      menu.classList.remove("is-aberto"); document.documentElement.classList.remove("menu-aberto");
      abrirBt.setAttribute("aria-expanded", "false"); abrirBt.setAttribute("aria-label", "Abrir menu");
      setTimeout(function () { if (!menu.classList.contains("is-aberto")) menu.hidden = true; }, reduz ? 0 : 700);
      if (voltarFoco) abrirBt.focus({ preventScroll: true });
    };
    abrirBt.addEventListener("click", function () { if (menu.classList.contains("is-aberto")) fechar(true); else abrir(); });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("[data-menu-fechar]")) fechar(true);
      else if (e.target.closest("a")) fechar(false);
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("is-aberto")) fechar(true); });
  }

  /* Pré-formulário: valida e abre o WhatsApp com as respostas */
  var form = document.querySelector("[data-whats-form]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, primeiro = null;
      form.querySelectorAll("[required]").forEach(function (c) {
        var campo = c.closest(".campo"), vazio = !c.value.trim();
        campo.classList.toggle("is-erro", vazio);
        if (vazio) { ok = false; primeiro = primeiro || c; }
      });
      if (!ok) { primeiro.focus(); return; }

      var v = function (n) { var f = form.elements[n]; return f && f.value.trim(); };
      var linhas = [
        "Olá, Mell! Quero uma proposta da Imersão Olfativa para a minha empresa.",
        "",
        "Nome: " + v("nome"),
        "Empresa: " + v("empresa") + (v("cargo") ? " (" + v("cargo") + ")" : ""),
        "Tipo de evento: " + v("tipo"),
        "Convidados: " + v("convidados"),
        "Quando: " + v("data")
      ];
      if (v("local")) linhas.push("Local: " + v("local"));
      if (v("obs")) linhas.push("Observações: " + v("obs"));

      var utm = {};
      try { utm = JSON.parse(sessionStorage.getItem("site-utm-v1") || "{}"); } catch (err) {}
      if (utm.utm_source) linhas.push("", "[origem: " + utm.utm_source + (utm.utm_campaign ? "/" + utm.utm_campaign : "") + (utm.utm_content ? "/" + utm.utm_content : "") + "]");

      var conv = v("convidados");
      if (window.fbq) window.fbq("track", "Lead", { content_name: "imersao_empresas", convidados: conv });
      if (window.gtag) window.gtag("event", "generate_lead", { form: "imersao_empresas", convidados: conv });
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: "lead_imersao", convidados: conv, tipo_evento: v("tipo") });

      window.open("https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(linhas.join("\n")), "_blank", "noopener");
    });
    form.addEventListener("input", function (e) {
      var c = e.target.closest(".campo");
      if (c && e.target.value.trim()) c.classList.remove("is-erro");
    });
  }

  /* Link do aviso de cookies funciona em subpastas */
  if (root) {
    new MutationObserver(function () {
      document.querySelectorAll('.consent a[href="politica-de-cookies.html"]').forEach(function (a) { a.setAttribute("href", root + "politica-de-cookies.html"); });
    }).observe(document.body, { childList: true });
  }
})();
