/* Méthode Fissurée | comportamento da página
   EDITAR AQUI: links de pagamento (checkout em euro) */
(function () {
  "use strict";

  var CHECKOUT = {
    basico: "https://pay.cakto.com.br/izqqq2v",
    premium: "https://pay.cakto.com.br/7633tir",
    premium14: "https://pay.cakto.com.br/swozpwg"
  };

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Links de pagamento (com UTMs da visita) ---------- */
  function utms() {
    var keep = {}, p = new URLSearchParams(location.search);
    p.forEach(function (v, k) { if (/^(utm_|src|sck|xcod|fbclid|gclid)/.test(k)) keep[k] = v; });
    try {
      if (Object.keys(keep).length) sessionStorage.setItem("mf-utm", JSON.stringify(keep));
      else keep = JSON.parse(sessionStorage.getItem("mf-utm") || "{}");
    } catch (e) { /* navegação privada */ }
    return keep;
  }
  var visita = utms();
  function linkCheckout(chave) {
    var url = CHECKOUT[chave];
    if (!url || url.charAt(0) === "[") return "#planos";
    try {
      var u = new URL(url);
      Object.keys(visita).forEach(function (k) { if (!u.searchParams.has(k)) u.searchParams.set(k, visita[k]); });
      return u.toString();
    } catch (e) { return url; }
  }
  $$("[data-checkout]").forEach(function (a) { a.href = linkCheckout(a.getAttribute("data-checkout")); });

  /* ---------- Oferta ao escolher o Básico ---------- */
  var oferta = $("#oferta");
  $$("[data-basico]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (oferta && typeof oferta.showModal === "function") {
        oferta.showModal();
        var bt = $(".b2", oferta); if (bt) bt.classList.add("is-open");
      } else {
        location.href = linkCheckout("basico");
      }
    });
  });
  if (oferta) {
    $$("[data-fechar]", oferta).forEach(function (b) { b.addEventListener("click", function () { oferta.close(); }); });
    oferta.addEventListener("click", function (e) { if (e.target === oferta) oferta.close(); });
  }

  /* ---------- Entradas por seção ---------- */
  var blocos = $$("[data-reveal]");
  blocos.forEach(function (b) { $$(":scope > *", b).forEach(function (el, i) { el.style.setProperty("--i", Math.min(i, 4)); }); });
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "100000px 0px -10% 0px", threshold: 0 });
    blocos.forEach(function (b) { io.observe(b); });
  } else {
    blocos.forEach(function (b) { b.classList.add("is-in"); });
  }

  /* ---------- Faixa de resultados: proporção de cada foto ---------- */
  $$(".strip__item img").forEach(function (im) {
    var w = +im.getAttribute("width"), hh = +im.getAttribute("height");
    if (w && hh) im.parentNode.style.setProperty("--r", (w / hh).toFixed(3));
  });

  /* ---------- Faixa de resultados: setas e arrastar ---------- */
  var strip = $("#strip");
  if (strip) {
    $$("[data-strip]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var dir = +btn.getAttribute("data-strip");
        strip.scrollBy({ left: dir * strip.clientWidth * 0.7, behavior: reduce ? "auto" : "smooth" });
      });
    });
    var ini = 0, pos = 0, arrastando = false, moveu = false;
    strip.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse") return;
      arrastando = true; moveu = false; ini = e.clientX; pos = strip.scrollLeft;
      strip.setPointerCapture(e.pointerId);
    });
    strip.addEventListener("pointermove", function (e) {
      if (!arrastando) return;
      var dx = e.clientX - ini;
      if (Math.abs(dx) > 4) { moveu = true; strip.classList.add("is-drag"); }
      strip.scrollLeft = pos - dx;
    });
    var soltar = function () { arrastando = false; strip.classList.remove("is-drag"); };
    strip.addEventListener("pointerup", soltar);
    strip.addEventListener("pointercancel", soltar);
    strip.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") strip.scrollBy({ left: 320, behavior: "smooth" });
      if (e.key === "ArrowLeft") strip.scrollBy({ left: -320, behavior: "smooth" });
    });
  }

  /* ---------- Barra superior: solta do topo, some depois da 2a seção e volta ao subir ---------- */
  var barraTopo = $(".nav"), segunda = $(".dor");
  if (barraTopo) {
    var ultimoY = window.scrollY, pedido = false;
    var atualizarBarra = function () {
      pedido = false;
      var y = window.scrollY, desce = y > ultimoY + 2, sobe = y < ultimoY - 2;
      barraTopo.classList.toggle("is-solta", y > 12);
      var celular = window.matchMedia("(max-width: 767px)").matches;
      var ref = celular ? $(".hero") : segunda;
      var limite = ref ? ref.offsetTop + ref.offsetHeight : 1200;
      if (y < limite) barraTopo.classList.remove("is-oculta");
      else if (desce) barraTopo.classList.add("is-oculta");
      else if (sobe) barraTopo.classList.remove("is-oculta");
      ultimoY = y;
    };
    window.addEventListener("scroll", function () { if (!pedido) { pedido = true; requestAnimationFrame(atualizarBarra); } }, { passive: true });
    barraTopo.addEventListener("focusin", function () { barraTopo.classList.remove("is-oculta"); });
    atualizarBarra();
  }

  /* ---------- FAQ: abre e fecha devagar; abrir uma fecha a outra ---------- */
  var perguntas = $$(".qa");
  var EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
  var fechar = function (det) {
    var corpo = $(".qa__a", det);
    if (!det.open) return;
    if (reduce || !corpo || !corpo.animate) { det.open = false; return; }
    if (det._anim) det._anim.cancel();
    det.classList.add("is-closing");
    det._anim = corpo.animate(
      [{ height: corpo.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0, marginBottom: "0px", paddingTop: "0px", paddingBottom: "0px" }],
      { duration: 520, easing: EASE }
    );
    det._anim.onfinish = function () { det.open = false; det.classList.remove("is-closing"); det._anim = null; };
  };
  var abrir = function (det) {
    var corpo = $(".qa__a", det);
    perguntas.forEach(function (outra) { if (outra !== det) fechar(outra); });
    if (det._anim) det._anim.cancel();
    det.classList.remove("is-closing");
    det.open = true;
    if (reduce || !corpo || !corpo.animate) return;
    det._anim = corpo.animate(
      [{ height: "0px", opacity: 0, marginBottom: "0px", paddingTop: "0px", paddingBottom: "0px" }, { height: corpo.offsetHeight + "px", opacity: 1 }],
      { duration: 620, easing: EASE }
    );
    det._anim.onfinish = function () { det._anim = null; };
  };
  perguntas.forEach(function (det) {
    var sum = $("summary", det);
    if (!sum) return;
    sum.addEventListener("click", function (e) {
      e.preventDefault();
      if (det.open && !det.classList.contains("is-closing")) fechar(det); else abrir(det);
    });
  });

  /* ---------- Rolagem suave e sutil da roda do mouse (só computador) ----------
     Solta o controle quando a pessoa pega a barra de rolagem, usa o teclado, clica num link ou toca a tela. */
  var mouseFino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (mouseFino && !reduce) {
    var raiz = document.scrollingElement || document.documentElement;
    var alvoY = raiz.scrollTop, atualY = alvoY, rodando = false, ativo = true;
    var maxY = function () { return raiz.scrollHeight - window.innerHeight; };
    var parar = function () { rodando = false; alvoY = atualY = raiz.scrollTop; };
    var antes = 0;
    var passo = function (agora) {
      if (!rodando) return;
      var dt = antes ? Math.min(48, agora - antes) : 16.67;
      antes = agora;
      atualY += (alvoY - atualY) * (1 - Math.pow(1 - 0.075, dt / 16.67));
      if (Math.abs(alvoY - atualY) < 0.15) { atualY = alvoY; rodando = false; antes = 0; }
      raiz.style.scrollBehavior = "auto";
      window.scrollTo(0, atualY);
      if (rodando) requestAnimationFrame(passo);
      else raiz.style.scrollBehavior = "";
    };
    var temRolagemPropria = function (el) {
      while (el && el !== document.body) {
        if (el.tagName === "DIALOG") return true;
        var s = getComputedStyle(el);
        if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight) return true;
        el = el.parentElement;
      }
      return false;
    };
    window.addEventListener("wheel", function (e) {
      if (!ativo || e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY) || temRolagemPropria(e.target)) return;
      if (oferta && oferta.open) return;
      e.preventDefault();
      if (!rodando) { atualY = raiz.scrollTop; alvoY = atualY; }
      var d = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      alvoY = Math.max(0, Math.min(maxY(), alvoY + d));
      if (!rodando) { rodando = true; antes = 0; requestAnimationFrame(passo); }
    }, { passive: false });
    ["mousedown", "keydown", "touchstart"].forEach(function (ev) {
      window.addEventListener(ev, function () { if (rodando) parar(); }, { passive: true });
    });
    document.addEventListener("click", function (e) { if (e.target.closest('a[href^="#"]')) parar(); });
  }

  /* ---------- Proteção das imagens: sem botão direito, sem arrastar, sem toque longo ----------
     Vale só para imagens; links, botões e scripts de rastreamento seguem normais. */
  var ehImagem = function (el) { return el && el.closest && el.closest("img, picture, .frame, .hero__frame, .item__img, .selo"); };
  document.addEventListener("contextmenu", function (e) { if (ehImagem(e.target)) e.preventDefault(); });
  document.addEventListener("dragstart", function (e) { if (ehImagem(e.target)) e.preventDefault(); });

  /* ---------- Barra de rolagem vermelha no celular (o sistema não deixa pintar a nativa) ---------- */
  if (window.matchMedia("(pointer: coarse)").matches) {
    var trilho = document.createElement("div");
    trilho.className = "sbar"; trilho.setAttribute("aria-hidden", "true");
    var polegar = document.createElement("div");
    polegar.className = "sbar__thumb";
    trilho.appendChild(polegar); document.body.appendChild(trilho);
    document.documentElement.classList.add("has-sbar");
    var raizS = document.scrollingElement || document.documentElement, esconder = null, pedidoS = false, arrastando = false;
    var medir = function () {
      pedidoS = false;
      var total = raizS.scrollHeight, vis = window.innerHeight, altT = trilho.clientHeight;
      if (total <= vis + 4) { trilho.classList.remove("is-on"); return; }
      var h = Math.max(44, altT * vis / total);
      var pos = (altT - h) * (raizS.scrollTop / (total - vis));
      polegar.style.height = h + "px";
      polegar.style.transform = "translateY(" + pos + "px)";
    };
    var mostrar = function () {
      trilho.classList.add("is-on");
      clearTimeout(esconder);
      if (!arrastando) esconder = setTimeout(function () { trilho.classList.remove("is-on"); }, 1100);
      if (!pedidoS) { pedidoS = true; requestAnimationFrame(medir); }
    };
    window.addEventListener("scroll", mostrar, { passive: true });
    window.addEventListener("resize", function () { requestAnimationFrame(medir); });
    var inicioY = 0, inicioTopo = 0;
    polegar.addEventListener("touchstart", function (e) {
      arrastando = true; trilho.classList.add("is-drag", "is-on"); clearTimeout(esconder);
      inicioY = e.touches[0].clientY; inicioTopo = raizS.scrollTop;
    }, { passive: true });
    polegar.addEventListener("touchmove", function (e) {
      if (!arrastando) return;
      e.preventDefault();
      var total = raizS.scrollHeight, vis = window.innerHeight, altT = trilho.clientHeight, h = polegar.offsetHeight;
      var dy = e.touches[0].clientY - inicioY;
      raizS.style.scrollBehavior = "auto";
      window.scrollTo(0, inicioTopo + dy * (total - vis) / Math.max(1, altT - h));
    }, { passive: false });
    var soltarS = function () { if (!arrastando) return; arrastando = false; trilho.classList.remove("is-drag"); raizS.style.scrollBehavior = ""; mostrar(); };
    polegar.addEventListener("touchend", soltarS); polegar.addEventListener("touchcancel", soltarS);
    medir();
  }
})();
