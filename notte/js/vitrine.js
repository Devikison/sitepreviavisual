/* NOTTE | ocasiões
   Lista vertical: a ocasião que passa pelo meio da tela fica em destaque (dourada).
   Rolagem normal da página, nada desliza para o lado. */
(function () {
  "use strict";
  var lista = document.querySelector("[data-ocas]");
  if (!lista) return;
  var itens = [].slice.call(lista.querySelectorAll(".ocas__item"));
  if (!("IntersectionObserver" in window)) { itens.forEach(function (i) { i.classList.add("is-ativo"); }); return; }
  function ativa(alvo) { itens.forEach(function (i) { i.classList.toggle("is-ativo", i === alvo); }); }
  var io = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) { if (e.isIntersecting) ativa(e.target); });
  }, { rootMargin: "-46% 0px -46% 0px", threshold: 0 });
  itens.forEach(function (i) { io.observe(i); });
})();

/* NOTTE | galeria contínua da oficina
   As fotos correm devagar sem parar; dá para arrastar para os dois lados (mouse ou dedo).
   Ao soltar, desacelera e volta a andar sozinha. Rolagem vertical da página não é bloqueada. */
(function () {
  "use strict";
  var g = document.querySelector("[data-galeria]");
  if (!g) return;
  var trilho = g.querySelector(".galeria__trilho");
  var originais = [].slice.call(trilho.children);
  originais.forEach(function (f) {
    var c = f.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    var im = c.querySelector("img"); if (im) im.alt = "";
    trilho.appendChild(c);
  });
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var VEL_AUTO = 0.045;                 // px por ms (~45 px/s)
  var x = 0, vel = 0, arrastando = false, visivel = true, ultimo = 0;
  var inicioX = 0, inicioY = 0, ultX = 0, ultT = 0, decidido = false, horizontal = false;

  function metade() { return trilho.scrollWidth / 2; }
  function aplica() {
    var m = metade();
    if (m > 0) { while (x <= -m) x += m; while (x > 0) x -= m; }
    trilho.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
  }
  function quadro(t) {
    var dt = ultimo ? Math.min(48, t - ultimo) : 16;
    ultimo = t;
    if (visivel && !arrastando) {
      if (Math.abs(vel) > 0.02) { x += vel * dt; vel *= Math.pow(0.94, dt / 16.67); }
      else if (!reduz) { x -= VEL_AUTO * dt; }
      aplica();
    }
    requestAnimationFrame(quadro);
  }

  g.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    arrastando = true; decidido = e.pointerType === "mouse"; horizontal = decidido;
    inicioX = ultX = e.clientX; inicioY = e.clientY; ultT = performance.now(); vel = 0;
    if (decidido) { g.classList.add("is-arrastando"); try { g.setPointerCapture(e.pointerId); } catch (err) {} }
  });
  g.addEventListener("pointermove", function (e) {
    if (!arrastando) return;
    if (!decidido) {
      var ax = Math.abs(e.clientX - inicioX), ay = Math.abs(e.clientY - inicioY);
      if (ax < 6 && ay < 6) return;
      decidido = true; horizontal = ax > ay;
      if (!horizontal) { arrastando = false; return; }
      g.classList.add("is-arrastando");
      try { g.setPointerCapture(e.pointerId); } catch (err) {}
    }
    var agora = performance.now(), dx = e.clientX - ultX;
    x += dx; aplica();
    var dt = Math.max(1, agora - ultT);
    vel = vel * 0.6 + (dx / dt) * 0.4;
    ultX = e.clientX; ultT = agora;
  });
  function solta() {
    if (!arrastando) return;
    arrastando = false; g.classList.remove("is-arrastando");
    if (performance.now() - ultT > 90) vel = 0;
    vel = Math.max(-2.5, Math.min(2.5, vel));
  }
  g.addEventListener("pointerup", solta);
  g.addEventListener("pointercancel", solta);
  g.addEventListener("lostpointercapture", solta);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (en) { visivel = en[0].isIntersecting; }, { rootMargin: "200px 0px" }).observe(g);
  }
  window.addEventListener("resize", aplica);
  requestAnimationFrame(quadro);
})();
