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
  /* ---------- Janela de imagem ampliada: fica na mesma seção ---------- */
  var lb = document.getElementById("lb");
  if (lb) {
    document.body.appendChild(lb);
    var lbImg = document.getElementById("lbImg"), lbLeg = document.getElementById("lbLeg"), lbCont = document.getElementById("lbCont");
    var lista = [], pos = 0, origem = null, rolagem = 0;
    function mostra(n) {
      pos = (n + lista.length) % lista.length;
      var b = lista[pos], im = b.querySelector("img"), cap = b.parentNode.querySelector("figcaption");
      lbImg.src = b.getAttribute("data-zoom"); lbImg.alt = im ? im.alt : "";
      lbLeg.textContent = cap ? cap.textContent : ""; lbCont.textContent = (pos + 1) + " / " + lista.length;
    }
    function abre(botao) {
      var car = botao.closest(".car");
      lista = [].slice.call(car.querySelectorAll(".car__btn")).filter(function (x) { return !x.closest('[aria-hidden="true"]'); });
      var alvo = botao.getAttribute("data-zoom");
      var n = 0; lista.forEach(function (x, k) { if (x.getAttribute("data-zoom") === alvo) n = k; });
      origem = lista[n];
      rolagem = window.scrollY;
      document.body.style.position = "fixed"; document.body.style.top = -rolagem + "px"; document.body.style.left = "0"; document.body.style.right = "0";
      mostra(n); lb.hidden = false;
      requestAnimationFrame(function () { lb.classList.add("aberto"); });
      document.getElementById("lbX").focus({ preventScroll: true });
    }
    function fecha() {
      lb.classList.remove("aberto");
      setTimeout(function () { lb.hidden = true; lbImg.removeAttribute("src"); }, 250);
      var html = document.documentElement, antes = html.style.scrollBehavior;
      document.body.style.position = ""; document.body.style.top = ""; document.body.style.left = ""; document.body.style.right = "";
      html.style.scrollBehavior = "auto"; window.scrollTo(0, rolagem); html.style.scrollBehavior = antes;
      if (origem) try { origem.focus({ preventScroll: true }); } catch (e) {}
    }
    document.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest(".car__btn");
      if (!b) return;
      e.preventDefault();
      abre(b);
    });
    document.getElementById("lbX").addEventListener("click", fecha);
    document.getElementById("lbAnt").addEventListener("click", function () { mostra(pos - 1); });
    document.getElementById("lbProx").addEventListener("click", function () { mostra(pos + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) fecha(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") fecha();
      else if (e.key === "ArrowRight") mostra(pos + 1);
      else if (e.key === "ArrowLeft") mostra(pos - 1);
      else if (e.key === "Tab") {
        var f = [].slice.call(lb.querySelectorAll("button")), i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    var xIni = null;
    lb.addEventListener("pointerdown", function (e) { xIni = e.clientX; });
    lb.addEventListener("pointerup", function (e) {
      if (xIni === null) return;
      var dx = e.clientX - xIni; xIni = null;
      if (Math.abs(dx) > 50) mostra(pos + (dx < 0 ? 1 : -1));
    });
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
