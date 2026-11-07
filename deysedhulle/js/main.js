/* Dra. Deyse Dhulle: interações do site */
(function () {
  "use strict";
  var WHATS = "5591992660072";
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Topo: vidro ao rolar ---------- */
  var topo = $("[data-topo]");
  if (topo) {
    var sentinela = document.createElement("div");
    sentinela.style.cssText = "position:absolute;top:0;left:0;width:1px;height:40px;pointer-events:none";
    document.body.prepend(sentinela);
    new IntersectionObserver(function (e) { topo.classList.toggle("is-solid", !e[0].isIntersecting); }).observe(sentinela);
  }

  /* ---------- Menu mobile ---------- */
  var burger = $("[data-burger]");
  function fecharMenu() { if (!topo) return; topo.classList.remove("is-open"); if (burger) { burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menu"); } }
  if (burger) {
    burger.addEventListener("click", function () {
      var aberto = topo.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", aberto ? "true" : "false");
      burger.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
    });
    $$("#menu a").forEach(function (a) { a.addEventListener("click", fecharMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharMenu(); });
  }

  /* ---------- Item ativo no menu ---------- */
  var links = $$('#menu a[href^="#"]');
  if (links.length) {
    var mapa = {};
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute("href").slice(1)); if (s) mapa[s.id] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && mapa[e.target.id]) {
          links.forEach(function (l) { l.removeAttribute("aria-current"); });
          mapa[e.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(mapa).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---------- Revelação na rolagem ---------- */
  var reveal = $$("[data-reveal]");
  if (reduz || !("IntersectionObserver" in window)) reveal.forEach(function (el) { el.classList.add("in"); });
  else {
    var ior = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); ior.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
    reveal.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + "ms"; ior.observe(el); });
  }

  /* ---------- WhatsApp flutuante: aparece depois do hero ---------- */
  var zap = $(".zap"), hero = $(".hero");
  if (zap && hero) new IntersectionObserver(function (e) { zap.classList.toggle("is-on", !e[0].isIntersecting); }, { threshold: .15 }).observe(hero);

  /* ---------- Abas de tratamentos (teclado incluso) ---------- */
  var abas = $$("[data-tab]");
  function ativarAba(btn, foco) {
    abas.forEach(function (b) {
      var on = b === btn;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      var p = document.getElementById(b.getAttribute("aria-controls"));
      if (p) { p.hidden = !on; if (on && !reduz) { p.classList.remove("is-novo"); void p.offsetWidth; p.classList.add("is-novo"); } }
    });
    if (foco) btn.focus();
  }
  abas.forEach(function (b, i) {
    b.addEventListener("click", function () { ativarAba(b); });
    b.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight") n = abas[(i + 1) % abas.length];
      if (e.key === "ArrowLeft") n = abas[(i - 1 + abas.length) % abas.length];
      if (e.key === "Home") n = abas[0];
      if (e.key === "End") n = abas[abas.length - 1];
      if (n) { e.preventDefault(); ativarAba(n, true); }
    });
  });

  function abrirTratamento(id) {
    var d = document.getElementById(id);
    if (!d) return;
    var painel = d.closest("[role=tabpanel]");
    var aba = painel && $('[aria-controls="' + painel.id + '"]');
    if (aba) ativarAba(aba);
    d.open = true;
    rolarAte(d);
  }
  if (location.hash && document.getElementById(location.hash.slice(1)) && document.getElementById(location.hash.slice(1)).matches("details.trat")) {
    abrirTratamento(location.hash.slice(1));
  }

  /* ---------- Guia: o que você quer melhorar ---------- */
  var dadosEl = $("#guia-dados"), saida = $("[data-resultado]");
  var GUIA = dadosEl ? JSON.parse(dadosEl.textContent) : {};
  function utmTxt() {
    try { var u = JSON.parse(sessionStorage.getItem("site-utm-v1") || "{}"); return u.utm_source ? " [origem: " + u.utm_source + (u.utm_campaign ? "/" + u.utm_campaign : "") + "]" : ""; } catch (e) { return ""; }
  }
  function linkWa(msg) { return "https://wa.me/" + WHATS + "?text=" + encodeURIComponent(msg + utmTxt()); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var SETA = '<svg class="ic" aria-hidden="true"><use href="#i-arrow"/></svg>';
  var ZAP = '<svg class="ic" aria-hidden="true"><use href="#i-wa"/></svg>';

  function mostrar(id) {
    var html;
    if (id === "nao-sei") {
      var m = "Olá, Dra. Deyse! Vim pelo site, ainda não sei qual tratamento fazer e quero agendar a Consulta Estética.";
      html = '<p class="resultado__tit">Comece pela Consulta Estética</p>' +
        '<p class="resultado__nota">É nela que a Dra. Deyse avalia sua pele, entende sua rotina e indica o protocolo certo para você. Sem achismo e sem gastar com o que não precisa.</p>' +
        '<a class="btn btn--solid" href="' + linkWa(m) + '" target="_blank" rel="noopener" data-btn="guia-nao-sei">' + ZAP + "<span>Agendar avaliação</span></a>";
    } else {
      var g = GUIA[id]; if (!g) return;
      var itens = g.trat.map(function (t) {
        return '<li><a href="#' + t.id + '" data-abre="' + t.id + '"><span><strong>' + esc(t.nome) + "</strong><span>" + esc(t.resumo) + "</span></span>" + SETA + "</a></li>";
      }).join("");
      var msg = "Olá, Dra. Deyse! Vim pelo site e quero tratar: " + g.nome.toLowerCase() + ". Pode me orientar?";
      html = '<p class="resultado__tit">' + esc(g.nome) + "</p>" +
        '<p class="resultado__nota">Protocolos que costumam ser indicados para esse caso. A escolha final acontece na avaliação, de acordo com a sua pele.</p>' +
        '<ul class="resultado__lista">' + itens + "</ul>" +
        '<a class="btn btn--solid" href="' + linkWa(msg) + '" target="_blank" rel="noopener" data-btn="guia-' + id + '">' + ZAP + "<span>Quero uma orientação</span></a>";
    }
    saida.innerHTML = html;
    if (!reduz) { saida.classList.remove("is-novo"); void saida.offsetWidth; saida.classList.add("is-novo"); }
  }
  $$("[data-guia]").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("[data-guia]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      mostrar(b.getAttribute("data-guia"));
      if (window.matchMedia("(max-width: 960px)").matches) rolarAte(saida, 90);
    });
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-abre]");
    if (!a) return;
    e.preventDefault();
    abrirTratamento(a.getAttribute("data-abre"));
    history.replaceState(null, "", "#" + a.getAttribute("data-abre"));
  });

  /* ---------- Rolagem: âncoras e deslize suave da roda do mouse ---------- */
  var alvoY = null, rodando = false;
  function maxY() { return document.documentElement.scrollHeight - innerHeight; }
  function rolarAte(el, folga) {
    var y = el.getBoundingClientRect().top + scrollY - ((topo ? topo.offsetHeight : 0) + (folga || 16));
    if (reduz) { scrollTo(0, y); return; }
    alvoY = null;
    scrollTo({ top: y, behavior: "smooth" });
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]:not([data-abre]):not([data-cookie-settings])');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var el = id ? document.getElementById(id) : null;
    if (!el) return;
    e.preventDefault();
    rolarAte(el);
    history.replaceState(null, "", "#" + id);
  });

  var finoPonteiro = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!reduz && finoPonteiro) {
    function passo() {
      if (alvoY === null) { rodando = false; return; }
      var y = scrollY, d = alvoY - y;
      if (Math.abs(d) < .6) { scrollTo(0, alvoY); alvoY = null; rodando = false; return; }
      scrollTo(0, y + d * .12);
      requestAnimationFrame(passo);
    }
    function soltar() { alvoY = null; }
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var el = e.target;
      while (el && el !== document.body) {
        var cs = getComputedStyle(el);
        if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight) return;
        el = el.parentElement;
      }
      e.preventDefault();
      var delta = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      alvoY = Math.max(0, Math.min(maxY(), (alvoY === null ? scrollY : alvoY) + delta));
      if (!rodando) { rodando = true; requestAnimationFrame(passo); }
    }, { passive: false });
    ["mousedown", "keydown", "touchstart"].forEach(function (t) { window.addEventListener(t, soltar, { passive: true }); });
  }
})();
