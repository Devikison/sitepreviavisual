/* Vivi Marques | Mapeamento de Perfil Comportamental
   Interações: topo com vidro, revelação, frases da identificação, bússola DISC,
   linha do "como funciona", vídeo, barra fixa no celular e rolagem suave da roda do mouse. */
(function () {
  "use strict";
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* Topo */
  var top = $(".top"), hero = $(".hero"), mbar = $(".mbar");
  var ultimoY = window.scrollY;
  function aoRolar() {
    var y = window.scrollY, d = y - ultimoY;
    if (top) {
      top.classList.toggle("is-scrolled", y > 12);
      var passouHero = hero ? y > hero.offsetTop + hero.offsetHeight - 80 : y > 600;
      if (!passouHero || d < -3) top.classList.remove("is-hidden");
      else if (d > 3) top.classList.add("is-hidden");
      if (top.contains(document.activeElement)) top.classList.remove("is-hidden");
    }
    ultimoY = y;
    if (mbar && hero) {
      var fimHero = hero.offsetTop + hero.offsetHeight * 0.75;
      var perto = document.body.scrollHeight - (y + window.innerHeight) < 380;
      mbar.classList.toggle("is-on", y > fimHero && !perto);
    }
  }
  window.addEventListener("scroll", aoRolar, { passive: true });
  window.addEventListener("load", aoRolar);
  window.addEventListener("pageshow", aoRolar);
  aoRolar();

  /* Revelação */
  if ("IntersectionObserver" in window && !reduz) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    $$(".rv, .steps").forEach(function (el) { io.observe(el); });
  } else {
    $$(".rv, .steps").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Frases da identificação */
  var pains = $$(".pain"), saida = $("[data-pains-out]");
  var textos = saida ? JSON.parse(saida.getAttribute("data-pains-out")) : null;
  function atualizaPains() {
    if (!saida) return;
    var n = pains.filter(function (p) { return p.getAttribute("aria-pressed") === "true"; }).length;
    var t = n === 0 ? textos[0] : n <= 2 ? textos[1] : textos[2];
    saida.innerHTML = t.replace("{n}", n).replace("{s}", n === 1 ? "" : "s");
  }
  pains.forEach(function (p) {
    p.addEventListener("click", function () {
      p.setAttribute("aria-pressed", p.getAttribute("aria-pressed") === "true" ? "false" : "true");
      atualizaPains();
    });
  });
  atualizaPains();

  /* Bússola DISC */
  var quads = $$(".disc__q"), painel = $(".disc__panel");
  function abre(q) {
    quads.forEach(function (o) { o.classList.toggle("is-on", o === q); o.setAttribute("aria-pressed", o === q ? "true" : "false"); });
    if (painel) {
      painel.querySelector("h3").textContent = q.getAttribute("data-t");
      painel.querySelector("p").textContent = q.getAttribute("data-d");
    }
  }
  quads.forEach(function (q) {
    q.addEventListener("click", function () { abre(q); });
    q.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); abre(q); } });
    if (window.matchMedia("(hover: hover)").matches) q.addEventListener("mouseenter", function () { abre(q); });
  });

  /* Vídeo (VSL): quando houver link, colocar em data-video no botão */
  $$("[data-vsl]").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = b.getAttribute("data-video");
      var box = b.closest(".vsl__player");
      if (!url) { b.querySelector("small").textContent = "Vídeo em breve"; return; }
      var f = document.createElement("iframe");
      f.src = url + (url.indexOf("?") > -1 ? "&" : "?") + "autoplay=1";
      f.allow = "autoplay; fullscreen; picture-in-picture"; f.allowFullscreen = true; f.title = b.getAttribute("aria-label") || "Vídeo";
      box.appendChild(f); b.remove();
    });
  });

  /* Links de checkout sem URL ainda: levam para a oferta */
  $$("[data-link^='checkout']").forEach(function (a) {
    if (a.getAttribute("href") === "#") a.setAttribute("href", "#investimento");
  });

  /* Rolagem suave da roda do mouse: desaceleração contínua por tempo, encerra sem degraus
     (solta ao arrastar a barra, clicar, usar teclado ou toque) */
  if (!reduz && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var alvo = window.scrollY, atual = window.scrollY, rodando = false, ultimo = 0;
    var K = 6.2; // quanto maior, mais rápido assenta
    function max() { return document.documentElement.scrollHeight - window.innerHeight; }
    function passo(agora) {
      var dt = Math.min(0.05, (agora - (ultimo || agora)) / 1000 || 0.016); ultimo = agora;
      var dif = alvo - atual;
      atual += dif * (1 - Math.exp(-K * dt));
      if (Math.abs(alvo - atual) < 0.5) { atual = alvo; rodando = false; ultimo = 0; }
      window.scrollTo(0, atual);
      if (rodando) requestAnimationFrame(passo);
    }
    function iniciar() { if (!rodando) { rodando = true; ultimo = 0; requestAnimationFrame(passo); } }
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      if (e.target.closest("iframe, textarea, [data-noscroll]")) return;
      e.preventDefault();
      if (!rodando) { alvo = atual = window.scrollY; }
      var d = (e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY) * 0.95;
      d = Math.max(-240, Math.min(240, d));
      alvo = Math.max(0, Math.min(max(), alvo + d));
      iniciar();
    }, { passive: false });
    function solta() { rodando = false; ultimo = 0; alvo = atual = window.scrollY; }
    ["mousedown", "keydown", "touchstart"].forEach(function (ev) { window.addEventListener(ev, solta, { passive: true }); });
    window.addEventListener("scroll", function () { if (!rodando) { alvo = atual = window.scrollY; } }, { passive: true });
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute("href").length < 2) return;
      var t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      atual = window.scrollY;
      alvo = Math.min(max(), t.getBoundingClientRect().top + window.scrollY - 84);
      iniciar();
    });
  }
})();

/* Ondinha de luz no clique dos botões em metal líquido */
document.addEventListener("pointerdown", function (e) {
  var b = e.target.closest(".btn:not(.btn--ghost)");
  if (!b || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var r = b.getBoundingClientRect(), s = document.createElement("span");
  s.className = "btn__ripple"; s.style.left = (e.clientX - r.left) + "px"; s.style.top = (e.clientY - r.top) + "px";
  b.appendChild(s); setTimeout(function () { s.remove(); }, 750);
});

/* Perguntas frequentes: abre e fecha devagar (altura + fade); abrir uma fecha a outra */
(function () {
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var DUR = 650, EASE = "cubic-bezier(.22,.61,.36,1)";
  function fechar(d) {
    var ans = d.querySelector(".ans"); if (!ans || d.dataset.anim) return;
    if (reduz) { d.open = false; return; }
    d.dataset.anim = 1; d.classList.add("is-closing");
    var a = ans.animate([{ height: ans.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: DUR, easing: EASE });
    a.onfinish = function () { d.open = false; d.classList.remove("is-closing"); delete d.dataset.anim; };
  }
  function abrir(d) {
    var ans = d.querySelector(".ans"); if (!ans || d.dataset.anim) return;
    d.open = true; if (reduz) return;
    d.dataset.anim = 1;
    var h = ans.offsetHeight;
    var a = ans.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: DUR + 100, easing: EASE });
    a.onfinish = function () { delete d.dataset.anim; };
  }
  document.querySelectorAll(".faq details").forEach(function (d) {
    d.querySelector("summary").addEventListener("click", function (e) {
      e.preventDefault();
      if (d.open) { fechar(d); return; }
      document.querySelectorAll(".faq details[open]").forEach(function (o) { if (o !== d) fechar(o); });
      abrir(d);
    });
  });
})();

/* Relatório em pilha: o cartão de trás encolhe, recua e esmaece conforme é coberto */
(function () {
  var lista = document.querySelector(".stack");
  if (!lista || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var cards = [].slice.call(lista.querySelectorAll(".stack__card"));
  var ativo = false, agendado = false;
  function calc() {
    agendado = false;
    var rs = cards.map(function (c) { return c.getBoundingClientRect(); });
    cards.forEach(function (c, i) {
      var prof = 0, r = rs[i];
      for (var j = i + 1; j < cards.length; j++) {
        var cob = (r.bottom - rs[j].top) / r.height;
        prof += Math.max(0, Math.min(1, cob));
      }
      prof = Math.min(prof, 4);
      var s = 1 - prof * 0.04, y = -prof * 3;
      c.style.transform = prof ? "translateY(" + y + "px) scale(" + s + ")" : "";
      c.style.filter = prof ? "brightness(" + (1 - prof * 0.035) + ")" : "";
      var op = prof ? Math.max(0.15, 1 - prof * 0.9) : 1;
      for (var k = 0; k < c.children.length; k++) c.children[k].style.opacity = op;
      c.classList.toggle("is-fundo", prof > 0.6);
    });
  }
  function pedir() { if (ativo && !agendado) { agendado = true; requestAnimationFrame(calc); } }
  new IntersectionObserver(function (es) { ativo = es[0].isIntersecting; if (ativo) pedir(); }, { rootMargin: "200px 0px" }).observe(lista);
  window.addEventListener("scroll", pedir, { passive: true });
  window.addEventListener("resize", pedir);
})();


/* Botão flutuante de WhatsApp: aparece depois do topo; balão abre sozinho uma vez por visita */
(function () {
  var box = document.querySelector("[data-wa-float]"), hero = document.querySelector(".hero");
  if (!box) return;
  var KEY = "vm-balao-fechado", mostrouBalao = false, timer;
  function fechado() { try { return sessionStorage.getItem(KEY) === "1"; } catch (e) { return false; } }
  function abrirBalao() {
    if (fechado() || mostrouBalao || !box.classList.contains("is-on")) return;
    mostrouBalao = true;
    box.classList.add("has-bubble");
    timer = setTimeout(function () { box.classList.remove("has-bubble"); }, 9000);
  }
  function aoRolar() {
    var passou = hero ? window.scrollY > hero.offsetTop + hero.offsetHeight * 0.6 : window.scrollY > 500;
    box.classList.toggle("is-on", passou);
    if (!passou) box.classList.remove("has-bubble");
    if (passou && !mostrouBalao) setTimeout(abrirBalao, 1400);
  }
  window.addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();
  box.querySelector(".wa-bubble__x").addEventListener("click", function () {
    clearTimeout(timer); box.classList.remove("has-bubble");
    try { sessionStorage.setItem(KEY, "1"); } catch (e) {}
  });
})();


/* Molduras do topo: revelar só quando todas as imagens estiverem decodificadas */
(function () {
  document.querySelectorAll(".frame-i, .frame-e").forEach(function (f) {
    var feito = false;
    function mostrar() { if (!feito) { feito = true; requestAnimationFrame(function () { f.classList.add("is-ready"); }); } }
    var imgs = [].slice.call(f.querySelectorAll("img"));
    Promise.all(imgs.map(function (i) {
      if (i.complete && i.naturalWidth) return i.decode ? i.decode().catch(function () {}) : Promise.resolve();
      return new Promise(function (ok) { i.addEventListener("load", ok, { once: true }); i.addEventListener("error", ok, { once: true }); })
        .then(function () { return i.decode ? i.decode().catch(function () {}) : null; });
    })).then(mostrar);
    setTimeout(mostrar, 2500);
  });
})();


/* Perguntas frequentes v2: uma aberta por vez */
(function () {
  var itens = [].slice.call(document.querySelectorAll(".faq__item"));
  function set(item, abrir) {
    item.classList.toggle("is-open", abrir);
    item.querySelector(".faq__q button").setAttribute("aria-expanded", abrir ? "true" : "false");
  }
  itens.forEach(function (item) {
    item.querySelector(".faq__q button").addEventListener("click", function () {
      var abrir = !item.classList.contains("is-open");
      itens.forEach(function (o) { if (o !== item) set(o, false); });
      set(item, abrir);
    });
  });
})();


/* Surgimento ao rolar: sobe 18px saindo de um desfoque, em cascata nos grupos */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  var alvos = [".sec-head > *", ".what__text > *", ".disc", ".report2__aside > *", ".about__photo", ".about > div:last-child > *",
    ".pain", ".pains__result", ".who__item", ".sec-note", ".tile", ".offer2__price", ".offer2__lbl", ".faq__item", ".fact",
    ".step", ".final .wrap > *", ".vsl__grid > *", ".foot__grid > *", ".foot__base"];
  var lista = [];
  alvos.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.closest(".hero") || el.classList.contains("is-in") && el.classList.contains("rv")) return;
      if (lista.indexOf(el) === -1) lista.push(el);
    });
  });
  // atraso em cascata entre irmãos do mesmo grupo
  lista.forEach(function (el) {
    el.classList.add("rv2");
    var irmaos = [].filter.call(el.parentElement.children, function (x) { return lista.indexOf(x) > -1; });
    var i = irmaos.indexOf(el);
    el.style.setProperty("--d", Math.min(i, 6) * 80 + "ms");
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("rv2-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.01 });
  lista.forEach(function (el) { io.observe(el); });
})();

/* Fim da página: revela o que ainda não apareceu (rodapé) */
(function () {
  function fim() {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 6)
      document.querySelectorAll(".rv2:not(.rv2-in)").forEach(function (el) { el.classList.add("rv2-in"); });
  }
  window.addEventListener("scroll", fim, { passive: true });
})();

/* Faixas infinitas: velocidade constante (~55 px/s) independente do comprimento */
(function () {
  function ajusta() {
    document.querySelectorAll(".marquee").forEach(function (m) {
      var set = m.querySelector(".marquee__set"), tr = m.querySelector(".marquee__track");
      if (set && tr) tr.style.animationDuration = Math.max(30, set.getBoundingClientRect().width / 55) + "s";
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajusta); else ajusta();
  window.addEventListener("resize", ajusta);
})();


/* Celular: títulos em escada (cada linha igual ou menor que a de cima) */
(function () {
  var mq = window.matchMedia("(max-width: 860px)");
  function linhas(h) {
    var rg = document.createRange(); rg.selectNodeContents(h);
    var m = {};
    [].forEach.call(rg.getClientRects(), function (r) {
      if (r.width < 2) return; var k = Math.round(r.top);
      if (!m[k]) m[k] = [1e9, -1e9]; m[k][0] = Math.min(m[k][0], r.left); m[k][1] = Math.max(m[k][1], r.right);
    });
    return Object.keys(m).sort(function (a, b) { return a - b; }).map(function (k) { return m[k][1] - m[k][0]; });
  }
  function nota(ws, base) {
    var s = 0; for (var i = 1; i < ws.length; i++) s += Math.max(0, ws[i] - ws[i - 1] * 1.03);
    if (ws.length > 1 && ws[ws.length - 1] < ws[0] * 0.28) s += 60; // evita última linha com uma palavra só
    return s + Math.max(0, ws.length - base) * 18;
  }
  function ajusta() {
    document.querySelectorAll("main h1, main h2").forEach(function (h) {
      h.style.removeProperty("max-width");
      if (!mq.matches || !h.offsetParent) return;
      h.style.setProperty("text-wrap", "wrap", "important");
      var brs = h.querySelectorAll("br.q").length;
      if (brs) {
        h.classList.add("q-on");
        var wq = linhas(h);
        if (wq.length === brs + 1 && nota(wq, wq.length) === 0) return;
        h.classList.remove("q-on");
      }
      var cheio = h.getBoundingClientRect().width, w0 = linhas(h), base = w0.length;
      var melhor = { n: nota(w0, base), f: 1 };
      for (var f = 0.98; f >= 0.46; f -= 0.02) {
        h.style.setProperty("max-width", Math.round(cheio * f) + "px", "important");
        var ws = linhas(h); if (ws.length > base + 1) break;
        var n = nota(ws, base); if (n < melhor.n - 0.5) melhor = { n: n, f: f };
        if (n === 0) break;
      }
      if (melhor.f < 1) h.style.setProperty("max-width", Math.round(cheio * melhor.f) + "px", "important");
      else h.style.removeProperty("max-width");
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajusta); else ajusta();
  var tm; window.addEventListener("resize", function () { clearTimeout(tm); tm = setTimeout(ajusta, 150); });
})();


/* Números contando até o valor final quando aparecem na tela */
(function () {
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var els = [].slice.call(document.querySelectorAll(".fact strong"));
  if (!els.length || !("IntersectionObserver" in window)) return;
  var fmt = new Intl.NumberFormat("pt-BR");
  els.forEach(function (el) {
    var m = el.textContent.trim().match(/^([\d.]+)(.*)$/);
    if (!m) return;
    el.dataset.alvo = m[1].replace(/\./g, ""); el.dataset.suf = m[2];
    if (!reduz) el.textContent = "0" + m[2];
  });
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; io.unobserve(e.target);
      var el = e.target, alvo = +el.dataset.alvo, suf = el.dataset.suf || "", t0 = null, dur = 1800;
      if (reduz || !alvo) { el.textContent = fmt.format(alvo) + suf; return; }
      function passo(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur), e3 = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt.format(Math.round(alvo * e3)) + suf;
        if (p < 1) requestAnimationFrame(passo);
      }
      requestAnimationFrame(passo);
    });
  }, { threshold: 0.6 });
  els.forEach(function (el) { if (el.dataset.alvo) io.observe(el); });
})();

/* Proteção das imagens: sem menu de "salvar imagem" e sem arrastar (só em imagens; não afeta rastreamento nem cliques) */
(function () {
  var SEL = "img, picture, svg image, video, .frame-i, .frame-e, .vsl__player, .report__photo, .about__photo, .final__photo, .stack__card, .disc__wheel";
  document.addEventListener("contextmenu", function (e) { if (e.target.closest && e.target.closest(SEL)) e.preventDefault(); });
  document.addEventListener("dragstart", function (e) { if (e.target.closest && e.target.closest("img, picture, svg image, video")) e.preventDefault(); });
  document.querySelectorAll("img").forEach(function (i) { i.setAttribute("draggable", "false"); });
})();
