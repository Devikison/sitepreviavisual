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
  // A abertura aparece sempre ao carregar (o botão fica na base da tela e não pode depender da rolagem)
  document.querySelectorAll(".hero .rev, .hero .split").forEach(function (el) { el.classList.add("is-on"); });
  var alvos = document.querySelectorAll(".rev:not(.is-on), .split:not(.is-on)");
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

  /* Deslize luxuoso até a seção ao clicar num link interno (#...) */
  var animando = null;
  function cancelarIr() { if (animando) { cancelAnimationFrame(animando); animando = null; } }
  ["wheel", "touchstart", "keydown"].forEach(function (ev) { window.addEventListener(ev, cancelarIr, { passive: true }); });
  function suave(t) { return t < .5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2; } // entra e freia bem devagar
  function irPara(alvo) {
    var y0 = window.scrollY, y1 = Math.max(0, Math.min(alvo.getBoundingClientRect().top + y0, document.documentElement.scrollHeight - window.innerHeight));
    var dist = Math.abs(y1 - y0); if (dist < 2) return;
    if (reduz) { window.scrollTo({ top: y1, behavior: "instant" }); return; }
    var dur = Math.max(900, Math.min(1700, 600 + dist * 0.35)), t0 = null;
    cancelarIr();
    (function passo(agora) {
      if (t0 === null) t0 = agora;
      var k = Math.min(1, (agora - t0) / dur);
      window.scrollTo({ top: y0 + (y1 - y0) * suave(k), behavior: "instant" });
      if (k < 1) animando = requestAnimationFrame(passo); else { animando = null; alvo.classList.add("is-chegou"); setTimeout(function () { alvo.classList.remove("is-chegou"); }, 1600); }
    })(performance.now());
    animando = animando || 1;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute("href"); if (id.length < 2) return;
    var alvo = document.querySelector(id); if (!alvo) return;
    e.preventDefault();
    var esperar = document.documentElement.classList.contains("menu-aberto") ? 380 : 0;
    setTimeout(function () { irPara(alvo); history.replaceState(null, "", id); }, esperar);
  });

  /* Link da barra marca a seção em que a pessoa está */
  var navLinks = document.querySelectorAll(".topo__nav a");
  if (navLinks.length && "IntersectionObserver" in window) {
    var ioN = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (l) { l.setAttribute("aria-current", l.getAttribute("href") === "#" + e.target.id ? "true" : "false"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (l) { var s = document.querySelector(l.getAttribute("href")); if (s) ioN.observe(s); });
    var heroEl = document.querySelector(".hero");
    if (heroEl) new IntersectionObserver(function (es) { if (es[0].isIntersecting) navLinks.forEach(function (l) { l.setAttribute("aria-current", "false"); }); }, { rootMargin: "-45% 0px -50% 0px" }).observe(heroEl);
  }

  /* Como acontece no celular: o card de trás encolhe, escurece e vai para o fundo conforme o próximo sobe */
  var pilha = document.querySelectorAll(".passo");
  if (pilha.length > 1 && !reduz) {
    var pedido = false;
    var empilhar = function () {
      pedido = false;
      var celular = window.innerWidth <= 1000;
      for (var k = 0; k < pilha.length; k++) {
        var el = pilha[k];
        if (!celular || k === pilha.length - 1) { el.style.transform = ""; el.style.filter = ""; continue; }
        var r = el.getBoundingClientRect(), n = pilha[k + 1].getBoundingClientRect();
        var p = Math.max(0, Math.min(1, (r.bottom - n.top) / (r.height * 0.85)));
        el.style.transform = "scale(" + (1 - p * 0.08).toFixed(4) + ") translateY(" + (-p * 10).toFixed(1) + "px)";
        el.style.filter = "brightness(" + (1 - p * 0.5).toFixed(3) + ") saturate(" + (1 - p * 0.3).toFixed(3) + ")";
      }
    };
    var pedir = function () { if (!pedido) { pedido = true; requestAnimationFrame(empilhar); } };
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", pedir);
    empilhar();
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
