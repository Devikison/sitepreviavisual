/* NOTTE | rolagem suave da roda do mouse (sem biblioteca)
   - Deslize longo e macio, calculado pelo tempo real de cada quadro (igual em telas de 60, 120 ou 144 Hz)
   - Só no computador com mouse; no celular/touch fica a rolagem nativa
   - Solta o controle na hora ao pegar a barra, clicar, usar o teclado ou dar zoom (Ctrl + roda)
   - Desligada para quem pede menos movimento (prefers-reduced-motion) */
(function () {
  "use strict";
  var fino = window.matchMedia("(pointer: fine)").matches;
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fino || reduz) return;

  var SUAVIDADE = 0.055;   // fração percorrida a cada quadro de 60 Hz: menor = mais longo e macio
  var FORCA = 0.85;        // quanto cada clique da roda anda (1 = padrão do sistema)
  var alvo = window.scrollY, atual = window.scrollY, rodando = false, antes = 0;

  function max() { return document.documentElement.scrollHeight - window.innerHeight; }
  function parar() { rodando = false; alvo = atual = window.scrollY; }

  function quadro(agora) {
    if (!rodando) return;
    var dt = Math.min(64, agora - (antes || agora - 16.67)); antes = agora;
    var k = 1 - Math.pow(1 - SUAVIDADE, dt / 16.67);
    atual += (alvo - atual) * k;
    if (Math.abs(alvo - atual) < 0.3) { atual = alvo; rodando = false; }
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
    if (e.ctrlKey || e.defaultPrevented || document.documentElement.classList.contains("menu-aberto") || rolavelDentro(e.target, e.deltaY)) return;
    var dy = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
    e.preventDefault();
    if (!rodando) { alvo = atual = window.scrollY; }
    alvo = Math.max(0, Math.min(max(), alvo + dy * FORCA));
    if (!rodando) { rodando = true; antes = 0; requestAnimationFrame(quadro); }
  }, { passive: false });

  ["mousedown", "keydown", "touchstart"].forEach(function (ev) { window.addEventListener(ev, parar, { passive: true }); });
  // âncoras (#proposta etc.) usam o scroll-behavior: smooth do CSS
  document.addEventListener("click", function (e) { if (e.target.closest('a[href^="#"]')) parar(); });
  window.addEventListener("resize", function () { if (!rodando) alvo = atual = window.scrollY; });
})();
