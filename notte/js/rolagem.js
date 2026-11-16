/* NOTTE | rolagem suave da roda do mouse (sem biblioteca)
   - Só no computador com mouse; no celular/touch fica a rolagem nativa
   - Solta o controle na hora ao pegar a barra, clicar, usar o teclado ou dar zoom (Ctrl + roda)
   - Desligada para quem pede menos movimento (prefers-reduced-motion) */
(function () {
  "use strict";
  var fino = window.matchMedia("(pointer: fine)").matches;
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fino || reduz) return;

  var SUAVIDADE = 0.11;   // quanto menor, mais longo o deslize
  var alvo = window.scrollY, atual = window.scrollY, rodando = false;

  function max() { return document.documentElement.scrollHeight - window.innerHeight; }
  function parar() { rodando = false; alvo = atual = window.scrollY; }

  function quadro() {
    if (!rodando) return;
    atual += (alvo - atual) * SUAVIDADE;
    if (Math.abs(alvo - atual) < 0.5) { atual = alvo; rodando = false; }
    window.scrollTo({ top: atual, behavior: "instant" }); // instant: não somar com o scroll-behavior do CSS
    if (rodando) requestAnimationFrame(quadro);
  }

  function rolavelDentro(el, dy) {
    while (el && el !== document.body) {
      var s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight) {
        if ((dy > 0 && el.scrollTop + el.clientHeight < el.scrollHeight) || (dy < 0 && el.scrollTop > 0)) return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  window.addEventListener("wheel", function (e) {
    if (e.ctrlKey || e.defaultPrevented || rolavelDentro(e.target, e.deltaY)) return;
    var dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    e.preventDefault();
    if (!rodando) { alvo = atual = window.scrollY; }
    alvo = Math.max(0, Math.min(max(), alvo + dy));
    if (!rodando) { rodando = true; requestAnimationFrame(quadro); }
  }, { passive: false });

  ["mousedown", "keydown", "touchstart"].forEach(function (ev) { window.addEventListener(ev, parar, { passive: true }); });
  // âncoras (#proposta etc.) usam o scroll-behavior: smooth do CSS
  document.addEventListener("click", function (e) { if (e.target.closest('a[href^="#"]')) parar(); });
})();
