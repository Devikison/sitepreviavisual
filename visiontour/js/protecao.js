/* Proteção contra cópia casual: botão direito, copiar, arrastar imagem e atalhos.
   Só cancela a ação padrão do navegador (preventDefault). Nunca interrompe a propagação
   nem toca no clique, então GTM, GA4 e Meta Pixel continuam recebendo todos os eventos.
   Campos de formulário seguem livres. */
(function () {
  "use strict";
  document.documentElement.classList.add("protegido");
  function livre(t) {
    if (t && t.nodeType === 3) t = t.parentElement;
    return !!(t && t.closest && t.closest('input, textarea, select, [contenteditable="true"]'));
  }
  ["contextmenu", "copy", "cut", "dragstart", "selectstart"].forEach(function (ev) {
    document.addEventListener(ev, function (e) { if (!livre(e.target)) e.preventDefault(); });
  });
  document.addEventListener("keydown", function (e) {
    if (!(e.ctrlKey || e.metaKey) || livre(e.target)) return;
    if (/^[acxspu]$/i.test(e.key)) e.preventDefault();
  });
})();
