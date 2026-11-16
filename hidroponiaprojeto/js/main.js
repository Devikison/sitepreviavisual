/* Plantar em Casa: barra flutuante, entradas, dúvidas e pop-up de saída */
(function () {
  "use strict";
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Aviso do topo: data de hoje ---------- */
  var d = new Date(), dd = ("0" + d.getDate()).slice(-2), mm = ("0" + (d.getMonth() + 1)).slice(-2);
  document.querySelectorAll("[data-hoje]").forEach(function (el) { el.textContent = dd + "/" + mm + "/" + d.getFullYear(); });

  /* ---------- Vídeo do topo: som ao tocar ---------- */
  var caixa = document.getElementById("video");
  if (caixa) {
    var v = caixa.querySelector("video"), som = caixa.querySelector("[data-som]"), mudo = caixa.querySelector("[data-mudo]");
    if (reduz) { v.removeAttribute("autoplay"); v.pause(); }
    som.addEventListener("click", function () {
      v.muted = false; v.currentTime = 0; v.loop = false; v.play();
      caixa.classList.add("com-som"); mudo.hidden = false; mudo.focus();
    });
    mudo.addEventListener("click", function () {
      v.muted = !v.muted;
      mudo.innerHTML = v.muted ? '<i class="ph-fill ph-speaker-slash" aria-hidden="true"></i>' : '<i class="ph-fill ph-speaker-high" aria-hidden="true"></i>';
      mudo.setAttribute("aria-label", v.muted ? "Ligar o som" : "Desligar o som");
    });
    v.addEventListener("ended", function () { v.loop = true; v.muted = true; v.play(); caixa.classList.remove("com-som"); mudo.hidden = true; });
  }

  /* ---------- Carrosséis contínuos com arraste ---------- */
  [].forEach.call(document.querySelectorAll(".car"), function (car) {
    var trilho = car.querySelector(".car__trilho");
    var originais = [].slice.call(trilho.children);
    originais.forEach(function (el) {
      var c = el.cloneNode(true); c.setAttribute("aria-hidden", "true");
      var b = c.querySelector("button"); if (b) b.tabIndex = -1;
      trilho.appendChild(c);
    });
    var sentido = car.dataset.dir === "dir" ? 1 : -1;
    var base = reduz ? 0 : 0.5, vel = base, x = 0, metade = 0, visivel = true;
    var arrastando = false, inicioX = 0, inicioPos = 0, ultimoX = 0, inercia = 0, moveu = false;
    function mede() { metade = trilho.scrollWidth / 2; }
    function prende() { if (!metade) return; while (x <= -metade) x += metade; while (x > 0) x -= metade; }
    function quadro() {
      if (visivel && !arrastando) {
        x += sentido * vel + inercia;
        inercia *= 0.94; if (Math.abs(inercia) < 0.05) inercia = 0;
        prende();
        trilho.style.transform = "translate3d(" + x + "px,0,0)";
      }
      requestAnimationFrame(quadro);
    }
    mede(); window.addEventListener("resize", mede);
    [].forEach.call(trilho.querySelectorAll("img"), function (im) { im.addEventListener("load", mede); });
    if (sentido === 1) x = -metade / 2;
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; }).observe(car);
    car.addEventListener("pointerdown", function (e) {
      arrastando = true; moveu = false; inercia = 0; inicioX = ultimoX = e.clientX; inicioPos = x;
      car.classList.add("arrastando");
    });
    car.addEventListener("pointermove", function (e) {
      if (!arrastando) return;
      var dx = e.clientX - inicioX;
      if (!moveu && Math.abs(dx) > 6) { moveu = true; try { car.setPointerCapture(e.pointerId); } catch (er) {} }
      if (moveu) { x = inicioPos + dx; prende(); trilho.style.transform = "translate3d(" + x + "px,0,0)"; inercia = e.clientX - ultimoX; ultimoX = e.clientX; }
    });
    function solta() { if (!arrastando) return; arrastando = false; car.classList.remove("arrastando"); inercia = Math.max(-30, Math.min(30, inercia)); }
    car.addEventListener("pointerup", solta); car.addEventListener("pointercancel", solta); car.addEventListener("pointerleave", solta);
    car.addEventListener("click", function (e) { if (moveu) { e.preventDefault(); e.stopPropagation(); moveu = false; } }, true);
    car.addEventListener("mouseenter", function () { vel = base * 0.25; });
    car.addEventListener("mouseleave", function () { vel = base; });
    requestAnimationFrame(quadro);
  });
  var zoom = document.getElementById("zoom"), zoomImg = document.getElementById("zoomImg");
  if (zoom && zoom.showModal) {
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-zoom]");
      if (!b) return;
      zoomImg.src = b.getAttribute("data-zoom"); zoomImg.alt = b.querySelector("img").alt;
      zoom.showModal();
    });
    zoom.addEventListener("click", function (e) { if (e.target === zoom || e.target.closest("[data-fechar]")) zoom.close(); });
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
