/* Dr. Felipe Alcoléa | link na bio
   Links e WhatsApp ficam no CONFIG de js/rastreio.js.
   Enquanto um link não estiver preenchido, o botão avisa em vez de levar ao topo da página. */
(function () {
  "use strict";

  // Garantia: depois da entrada, tira as animações para nada ficar escondido
  // em navegadores que pausam a animação (abas em segundo plano, capturas de prévia).
  setTimeout(function () { document.documentElement.classList.remove("js"); }, 2600);

  var toast = document.querySelector(".toast");
  var timer;

  function avisar(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove("is-on"); }, 2600);
  }

  document.addEventListener("click", function (e) {
    var el = e.target.closest("a[data-wa], a[data-link]");
    if (!el || el.getAttribute("href") !== "#") return;
    e.preventDefault();
    avisar("Este link está sendo configurado. Volte em breve.");
  });
})();
