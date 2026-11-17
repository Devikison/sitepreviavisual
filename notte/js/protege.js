/* NOTTE | proteção das imagens
   Bloqueia só o menu do botão direito (e o "segurar o dedo" no celular) e o arrastar
   quando o alvo é uma imagem. Não mexe em links, formulário, cookies nem rastreamento. */
(function () {
  "use strict";
  function ehImagem(alvo) {
    return !!(alvo && alvo.closest && alvo.closest("img, picture, .hero__capa, .fecho__fundo"));
  }
  document.addEventListener("contextmenu", function (e) { if (ehImagem(e.target)) e.preventDefault(); }, true);
  document.addEventListener("dragstart", function (e) { if (ehImagem(e.target)) e.preventDefault(); }, true);
})();
