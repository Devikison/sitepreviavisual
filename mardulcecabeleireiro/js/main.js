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

  // Indicador de rolagem dourado (telemóvel): só usa JS onde não há animação por rolagem em CSS
  var rolagem = document.querySelector(".rolagem");
  if (rolagem && !(window.CSS && CSS.supports("animation-timeline: scroll()"))) {
    var pedido = false;
    var atualizar = function () {
      pedido = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      rolagem.style.setProperty("--progresso", max > 0 ? Math.min(1, scrollY / max) : 0);
    };
    addEventListener("scroll", function () { if (!pedido) { pedido = true; requestAnimationFrame(atualizar); } }, { passive: true });
    atualizar();
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
      var msg = "Olá Marlene! Gostava de fazer uma marcação.\n" +
        "Nome: " + d.get("nome") + "\nSalão: " + d.get("salao") + "\nServiço: " + d.get("servico") +
        (d.get("dias") ? "\nDisponibilidade: " + d.get("dias") : "") +
        (d.get("mensagem") ? "\nMensagem: " + d.get("mensagem") : "");
      var link = document.querySelector("[data-wa]");
      var numero = link ? (link.href.match(/wa\.me\/(\d+)/) || [])[1] : "";
      window.open("https://wa.me/" + numero + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
  }

  // Perguntas (details): acordeão com altura animada; abrir uma fecha a que estava aberta
  var animar = !reduz && Element.prototype.animate;
  function abrir(d) {
    var corpo = d.querySelector(".faq__corpo"), atual = corpo.offsetHeight, aFechar = d.classList.contains("fechando");
    if (d._anim) d._anim.cancel();
    d.classList.remove("fechando");
    d.open = true;
    if (!animar) return;
    d._anim = corpo.animate(
      [{ height: (aFechar ? atual : 0) + "px", opacity: aFechar ? 1 : 0 }, { height: corpo.scrollHeight + "px", opacity: 1 }],
      { duration: 750, easing: "cubic-bezier(.19, 1, .22, 1)" }
    );
    d._anim.onfinish = function () { d._anim = null; };
  }
  function fechar(d) {
    if (!d.open || d.classList.contains("fechando")) return;
    var corpo = d.querySelector(".faq__corpo"), atual = corpo.offsetHeight;
    if (d._anim) d._anim.cancel();
    if (!animar) { d.open = false; return; }
    d.classList.add("fechando");
    d._anim = corpo.animate(
      [{ height: atual + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
      { duration: 600, easing: "cubic-bezier(.65, 0, .35, 1)" }
    );
    d._anim.onfinish = function () { d.open = false; d.classList.remove("fechando"); d._anim = null; };
  }
  document.querySelectorAll("details.faq__item").forEach(function (d) {
    var sum = d.querySelector("summary");
    if (!sum || !d.querySelector(".faq__corpo")) return;
    sum.addEventListener("click", function (e) {
      e.preventDefault();
      if (d.open && !d.classList.contains("fechando")) { fechar(d); return; }
      var lista = d.closest(".faq__lista") || document;
      lista.querySelectorAll("details.faq__item[open]").forEach(function (outro) { if (outro !== d) fechar(outro); });
      abrir(d);
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

/* rolagem suave da roda do mouse, sem biblioteca. Solta o controle na hora se a pessoa
   pegar a barra lateral, clicar, usar o teclado ou o navegador mover a página por outro motivo. */
(function () {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement, alvoY = 0, posY = 0, escrito = 0, anima = false, antes = 0;
  function parar() { anima = false; }
  function travada() { return getComputedStyle(root).overflowY === 'hidden' || getComputedStyle(document.body).overflowY === 'hidden' || getComputedStyle(document.body).position === 'fixed'; }
  function temRolagemPropria(el) {
    for (; el && el !== document.body && el !== root && el.nodeType === 1; el = el.parentElement) {
      var o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight) return true;
    }
    return false;
  }
  function passo(t) {
    if (!anima) return;
    if (Math.abs(scrollY - escrito) > 3) { parar(); return; } /* outra coisa moveu a página */
    var dt = Math.min(t - antes, 50); antes = t;
    posY += (alvoY - posY) * (1 - Math.exp(-dt * .0062));
    if (Math.abs(alvoY - posY) < .6) posY = alvoY;
    scrollTo({ top: posY, behavior: 'instant' }); escrito = scrollY;
    if (posY === alvoY) { parar(); return; }
    requestAnimationFrame(passo);
  }
  addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || travada() || temRolagemPropria(e.target)) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
    e.preventDefault();
    if (!anima) { posY = alvoY = escrito = scrollY; antes = performance.now(); anima = true; requestAnimationFrame(passo); }
    alvoY = Math.max(0, Math.min(root.scrollHeight - innerHeight, alvoY + dy));
  }, { passive: false });
  ['mousedown', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, parar, { passive: true }); });
})();
