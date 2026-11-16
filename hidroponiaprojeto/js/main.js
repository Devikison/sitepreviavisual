/* Plantar em Casa: barra flutuante, entradas, dúvidas e pop-up de saída */
(function () {
  "use strict";
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Barra flutuante: some ao descer depois da 2ª seção, volta ao subir ---------- */
  var barra = document.getElementById("barra");
  var marco = document.getElementById("projetos");
  if (barra && marco) {
    var ultimo = window.scrollY, pedido = false;
    var atualiza = function () {
      pedido = false;
      var y = window.scrollY;
      var limite = marco.offsetTop + marco.offsetHeight * 0.35;
      var desceu = y > ultimo + 4, subiu = y < ultimo - 4;
      if (y < limite || subiu) barra.classList.remove("oculta");
      else if (desceu) barra.classList.add("oculta");
      if (desceu || subiu) ultimo = y;
    };
    window.addEventListener("scroll", function () {
      if (!pedido) { pedido = true; requestAnimationFrame(atualiza); }
    }, { passive: true });
    barra.addEventListener("focusin", function () { barra.classList.remove("oculta"); });
  }

  /* ---------- Entradas por seção ---------- */
  var itens = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduz) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -6% 0px" });
    itens.forEach(function (el) { io.observe(el); });
  } else { itens.forEach(function (el) { el.classList.add("in"); }); }

  /* ---------- Dúvidas: abre e fecha suave, uma por vez ---------- */
  var fichas = [].slice.call(document.querySelectorAll(".ficha"));
  fichas.forEach(function (f) {
    var b = f.querySelector(".ficha__q");
    b.addEventListener("click", function () {
      var abrir = !f.classList.contains("aberta");
      fichas.forEach(function (o) { o.classList.remove("aberta"); o.querySelector(".ficha__q").setAttribute("aria-expanded", "false"); });
      if (abrir) { f.classList.add("aberta"); b.setAttribute("aria-expanded", "true"); }
    });
  });

  /* ---------- Pop-up de saída (computador, uma vez por sessão) ---------- */
  var dlg = document.getElementById("saida");
  if (dlg && dlg.showModal && window.matchMedia("(pointer: fine)").matches) {
    var visto = false;
    try { visto = sessionStorage.getItem("pec-saida") === "1"; } catch (e) {}
    var pode = false;
    setTimeout(function () { pode = true; }, 15000);
    document.addEventListener("mouseout", function (e) {
      if (visto || !pode || e.relatedTarget || e.clientY > 8) return;
      visto = true;
      try { sessionStorage.setItem("pec-saida", "1"); } catch (er) {}
      dlg.showModal();
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.closest("[data-fechar]")) dlg.close(); });
  }
})();
