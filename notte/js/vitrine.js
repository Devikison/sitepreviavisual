/* NOTTE | vitrine de ocasiões
   Computador: a seção fica presa e os cards deslizam para o lado conforme a rolagem.
   Celular, tablet ou "reduzir movimento": carrossel nativo de arrastar com encaixe. */
(function () {
  "use strict";
  var sec = document.querySelector("[data-vitrine]");
  if (!sec) return;
  var janela = sec.querySelector(".vitrine__janela");
  var trilho = sec.querySelector(".vitrine__trilho");
  var cards = [].slice.call(trilho.children);
  var numerados = cards.filter(function (c) { return c.querySelector(".vitrine__num"); });
  var atualEl = sec.querySelector(".vitrine__atual");
  var barra = sec.querySelector(".vitrine__barra i");
  var mqDesk = window.matchMedia("(min-width: 1024px) and (min-height: 620px)");
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)");
  var modoFixo = false, dist = 0, pedido = false, ativoIdx = -1;

  function marca(i, p) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    if (i !== ativoIdx) {
      cards.forEach(function (c, k) { c.classList.toggle("is-ativo", k === i); });
      ativoIdx = i;
      var n = Math.min(i, numerados.length - 1) + 1;
      if (atualEl) atualEl.textContent = (n < 10 ? "0" : "") + n;
    }
    if (barra) barra.style.transform = "scaleX(" + Math.max(0.04, Math.min(1, p)).toFixed(3) + ")";
  }

  function medir() {
    modoFixo = mqDesk.matches && !reduz.matches;
    sec.classList.toggle("vitrine--fixa", modoFixo);
    trilho.style.transform = "";
    sec.style.height = "";
    if (!modoFixo) { aoRolarLado(); return; }
    var estilo = getComputedStyle(janela);
    var padE = parseFloat(estilo.paddingLeft) || 0;
    var padD = parseFloat(estilo.paddingRight) || 0;
    dist = Math.max(0, trilho.scrollWidth + padE + padD - janela.clientWidth);
    sec.style.height = (window.innerHeight + dist) + "px";
    aoRolar();
  }

  function aoRolar() {
    if (!modoFixo) return;
    var topo = sec.getBoundingClientRect().top;
    var p = dist > 0 ? Math.max(0, Math.min(1, -topo / dist)) : 0;
    trilho.style.transform = "translate3d(" + (-p * dist).toFixed(1) + "px,0,0)";
    marca(Math.round(p * (cards.length - 1)), p);
  }

  function aoRolarLado() {
    if (modoFixo) return;
    var max = janela.scrollWidth - janela.clientWidth;
    var p = max > 0 ? janela.scrollLeft / max : 0;
    var centro = janela.scrollLeft + janela.clientWidth * 0.35, melhor = 0, menor = Infinity;
    cards.forEach(function (c, k) { var d = Math.abs(c.offsetLeft - centro); if (d < menor) { menor = d; melhor = k; } });
    marca(melhor, p);
  }

  function pedir() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(function () { pedido = false; aoRolar(); });
  }

  window.addEventListener("scroll", pedir, { passive: true });
  janela.addEventListener("scroll", function () { requestAnimationFrame(aoRolarLado); }, { passive: true });
  window.addEventListener("resize", medir);
  if (mqDesk.addEventListener) { mqDesk.addEventListener("change", medir); reduz.addEventListener("change", medir); }
  window.addEventListener("load", medir);
  medir();
})();
