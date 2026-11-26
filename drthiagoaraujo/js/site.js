(function () {
  "use strict";
  var doc = document;

  // ano no rodapé
  doc.querySelectorAll("[data-ano]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // topo fixo depois do primeiro bloco
  var topo = doc.querySelector("[data-topo]");
  var alvo = doc.querySelector(".hero, .ph");
  if (topo && alvo && "IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      topo.classList.toggle("is-fixo", !es[0].isIntersecting);
    }, { rootMargin: "-120px 0px 0px 0px" }).observe(alvo);
  }

  // menu do celular
  var burger = doc.querySelector(".burger"), menu = doc.getElementById("menu");
  function fecha() { burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menu"); menu.hidden = true; doc.body.style.overflow = ""; }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var abre = burger.getAttribute("aria-expanded") !== "true";
      if (!abre) return fecha();
      burger.setAttribute("aria-expanded", "true"); burger.setAttribute("aria-label", "Fechar menu");
      menu.hidden = false; doc.body.style.overflow = "hidden";
      topo.classList.add("is-fixo");
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) fecha(); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { fecha(); burger.focus(); } });
  }

  // entradas por rolagem
  var itens = doc.querySelectorAll(".rv, .mk");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    itens.forEach(function (el) { io.observe(el); });
  } else {
    itens.forEach(function (el) { el.classList.add("in"); });
  }

  // abas da página de tratamentos
  var abas = doc.querySelectorAll(".abas a");
  if (abas.length && "IntersectionObserver" in window) {
    var mapa = {};
    abas.forEach(function (a) { mapa[a.getAttribute("href").slice(1)] = a; });
    var ioB = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        abas.forEach(function (a) { a.classList.remove("is-on"); });
        var a = mapa[e.target.id]; if (a) a.classList.add("is-on");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    doc.querySelectorAll(".bloco").forEach(function (b) { ioB.observe(b); });
  }

  // formulário: abre o WhatsApp com a mensagem pronta
  var form = doc.getElementById("form-contato");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["nome", "mensagem"].forEach(function (n) {
        var c = form.elements[n], box = c.closest(".campo"), err = box.querySelector(".erro");
        var vazio = !c.value.trim();
        box.classList.toggle("tem-erro", vazio);
        err.textContent = vazio ? (n === "nome" ? "Informe como podemos chamar você." : "Conte em poucas linhas como podemos ajudar.") : "";
        if (vazio && ok) { c.focus(); ok = false; }
      });
      if (!ok) return;
      var txt = "Olá! Meu nome é " + form.elements.nome.value.trim() + ".\nAssunto: " + form.elements.assunto.value + ".\n\n" + form.elements.mensagem.value.trim();
      window.open("https://wa.me/" + form.getAttribute("data-whats") + "?text=" + encodeURIComponent(txt), "_blank", "noopener");
    });
  }
})();
