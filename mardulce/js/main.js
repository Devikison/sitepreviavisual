/* MarDulce | interações do site: menu, topo, revelar, abas, filtros da galeria, formulário para WhatsApp */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Rolagem suave (Lenis local). Desligada para quem pede menos movimento
  var lenis = null;
  if (!reduz && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.35, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true, wheelMultiplier: .9 });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute("href").length < 2) return;
      var alvo = document.querySelector(a.getAttribute("href"));
      if (alvo) { e.preventDefault(); lenis.scrollTo(alvo, { offset: -100 }); }
    });
  }

  // Ano no rodapé
  document.querySelectorAll("[data-ano]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Topo sólido depois do início da página
  var topo = document.querySelector("[data-topo]");
  if (topo) {
    var marco = document.createElement("div");
    marco.style.cssText = "position:absolute;top:0;height:80px;width:1px;pointer-events:none";
    document.body.prepend(marco);
    new IntersectionObserver(function (e) { topo.classList.toggle("is-solido", !e[0].isIntersecting); }).observe(marco);
  }

  // Menu móvel
  var burger = document.querySelector("[data-burger]");
  var menu = document.getElementById("menu");
  function fechar() {
    if (!burger) return;
    burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menu");
    menu.classList.remove("is-aberto"); document.body.classList.remove("menu-aberto");
    if (lenis) lenis.start();
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var abrir = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", String(abrir));
      burger.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
      menu.classList.toggle("is-aberto", abrir);
      document.body.classList.toggle("menu-aberto", abrir);
      if (lenis) { if (abrir) lenis.stop(); else lenis.start(); }
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) fechar(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fechar(); });
  }

  // Revelar ao entrar no ecrã
  var alvos = document.querySelectorAll("[data-revelar]");
  if (reduz || !("IntersectionObserver" in window)) {
    alvos.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    alvos.forEach(function (el) { io.observe(el); });
  }

  // Abas de serviços (setas do teclado + âncora #cor, #tratamentos, #corte)
  document.querySelectorAll("[data-abas]").forEach(function (lista) {
    var abas = Array.prototype.slice.call(lista.querySelectorAll('[role="tab"]'));
    function ativar(aba, foco) {
      abas.forEach(function (a) {
        var on = a === aba;
        a.setAttribute("aria-selected", String(on)); a.tabIndex = on ? 0 : -1;
        document.getElementById(a.getAttribute("aria-controls")).hidden = !on;
      });
      if (foco) aba.focus();
    }
    abas.forEach(function (a, i) {
      a.addEventListener("click", function () { ativar(a); });
      a.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (n) { e.preventDefault(); ativar(abas[(i + n + abas.length) % abas.length], true); }
      });
    });
    var hash = location.hash.replace("#", "");
    var alvo = abas.filter(function (a) { return a.id === "aba-" + hash; })[0];
    if (alvo) ativar(alvo);
  });

  // Filtros da galeria
  var filtros = document.querySelector("[data-filtros]");
  if (filtros) {
    filtros.addEventListener("click", function (e) {
      var b = e.target.closest("[data-filtro]");
      if (!b) return;
      var f = b.getAttribute("data-filtro");
      filtros.querySelectorAll("[data-filtro]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      document.querySelectorAll("[data-galeria] [data-cat]").forEach(function (it) { it.hidden = f !== "todos" && it.getAttribute("data-cat") !== f; });
    });
  }

  // Formulário de marcação: valida e abre o WhatsApp com a mensagem pronta
  var form = document.querySelector("[data-form-wa]");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (c) {
        var campo = c.closest(".campo"), erro = campo.querySelector(".campo__erro");
        var vazio = !c.value.trim();
        campo.classList.toggle("tem-erro", vazio);
        erro.textContent = vazio ? "Preenche este campo, por favor." : "";
        if (vazio && ok) { c.focus(); ok = false; }
      });
      if (!ok) return;
      var d = new FormData(form);
      var msg = "Olá Dulce! Gostava de fazer uma marcação.\n" +
        "Nome: " + d.get("nome") + "\nSalão: " + d.get("salao") + "\nServiço: " + d.get("servico") +
        (d.get("dias") ? "\nDisponibilidade: " + d.get("dias") : "") +
        (d.get("mensagem") ? "\nMensagem: " + d.get("mensagem") : "");
      var link = document.querySelector("[data-wa]");
      var numero = link ? (link.href.match(/wa\.me\/(\d+)/) || [])[1] : "";
      window.open("https://wa.me/" + numero + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
  }

  // Perguntas (details): abrir e fechar com altura animada
  document.querySelectorAll("details.faq__item").forEach(function (d) {
    var sum = d.querySelector("summary"), corpo = d.querySelector(".faq__corpo"), anim = null;
    if (!sum || !corpo || reduz || !corpo.animate) return;
    sum.addEventListener("click", function (e) {
      e.preventDefault();
      var atual = corpo.offsetHeight;
      if (anim) anim.cancel();
      var aFechar = d.classList.contains("fechando");
      if (!d.open || aFechar) {
        d.classList.remove("fechando");
        d.open = true;
        anim = corpo.animate(
          [{ height: (aFechar ? atual : 0) + "px", opacity: aFechar ? 1 : 0 }, { height: corpo.scrollHeight + "px", opacity: 1 }],
          { duration: 750, easing: "cubic-bezier(.19, 1, .22, 1)" }
        );
        anim.onfinish = function () { anim = null; };
      } else {
        d.classList.add("fechando");
        anim = corpo.animate(
          [{ height: atual + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
          { duration: 600, easing: "cubic-bezier(.65, 0, .35, 1)" }
        );
        anim.onfinish = function () { d.open = false; d.classList.remove("fechando"); anim = null; };
      }
    });
  });

  // Aviso do modo revisão
  var aviso = document.querySelector("[data-revisao]");
  var fecharAviso = document.querySelector("[data-revisao-fechar]");
  try { if (sessionStorage.getItem("revisao-aviso") === "0" && aviso) aviso.classList.add("is-off"); } catch (e) { /* privado */ }
  if (fecharAviso) fecharAviso.addEventListener("click", function () {
    aviso.classList.add("is-off");
    try { sessionStorage.setItem("revisao-aviso", "0"); } catch (e) { /* privado */ }
  });
})();
