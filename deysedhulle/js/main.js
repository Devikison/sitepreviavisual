/* Dra. Deyse Dhulle: interações do site (sem bibliotecas, só transform e opacity) */
(function () {
  "use strict";
  var WHATS = "5591992660072";
  var doc = document.documentElement;
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var topo = $("[data-topo]");
  var alturaTopo = function () { return topo ? topo.getBoundingClientRect().bottom + 16 : 16; };

  /* ---------- Títulos palavra por palavra (mantém <em>) ---------- */
  $$("[data-split]").forEach(function (el) {
    var i = 0;
    (function andar(no) {
      Array.prototype.slice.call(no.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var s = document.createElement("span"); s.textContent = p; s.style.setProperty("--wi", i++);
            w.appendChild(s); frag.appendChild(w);
          });
          no.replaceChild(frag, n);
        } else if (n.nodeType === 1) andar(n);
      });
    })(el);
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  });

  /* ---------- Entrada do hero ---------- */
  function pronto() {
    doc.classList.add("is-pronto");
    var h1 = $('[data-split="hero"]');
    if (h1) { h1.style.setProperty("--wd", "250ms"); h1.classList.add("in"); }
  }
  if (document.fonts && document.fonts.ready) Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 600); })]).then(function () { requestAnimationFrame(pronto); });
  else requestAnimationFrame(pronto);

  /* ---------- Revelação na rolagem, em cascata ---------- */
  var alvos = $$("[data-reveal], [data-img], [data-split]:not([data-split=hero])");
  if (reduz || !("IntersectionObserver" in window)) alvos.forEach(function (el) { el.classList.add("in", "feito"); });
  else {
    var io = new IntersectionObserver(function (es) {
      var n = 0;
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        el.style.setProperty("--rd", (n++ * 90) + "ms");
        el.classList.add("in");
        io.unobserve(el);
        setTimeout(function () { el.classList.add("feito"); el.style.removeProperty("--rd"); }, 1400 + n * 90);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: .12 });
    alvos.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Menu mobile ---------- */
  var burger = $("[data-burger]");
  $$("#menu > ul > li").forEach(function (li, i) { li.style.setProperty("--i", i); });
  function fecharMenu() {
    if (!topo || !topo.classList.contains("is-open")) return;
    topo.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menu");
  }
  if (burger) {
    burger.addEventListener("click", function () {
      var aberto = topo.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", aberto ? "true" : "false");
      burger.setAttribute("aria-label", aberto ? "Fechar menu" : "Abrir menu");
      topo.classList.remove("is-hidden");
    });
    $$("#menu a").forEach(function (a) { a.addEventListener("click", fecharMenu); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharMenu(); });
    document.addEventListener("click", function (e) { if (!e.target.closest("[data-topo]")) fecharMenu(); });
  }

  /* ---------- Item ativo no menu ---------- */
  var links = $$('#menu a[href^="#"]');
  if (links.length) {
    var mapa = {};
    links.forEach(function (a) { var s = document.getElementById(a.getAttribute("href").slice(1)); if (s) mapa[s.id] = a; });
    var ion = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && mapa[e.target.id]) {
          links.forEach(function (l) { l.removeAttribute("aria-current"); });
          mapa[e.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(mapa).forEach(function (id) { ion.observe(document.getElementById(id)); });
  }

  /* ---------- WhatsApp flutuante: aparece depois do hero ---------- */
  var zap = $(".zap"), hero = $(".hero");
  if (zap && hero) new IntersectionObserver(function (e) { zap.classList.toggle("is-on", !e[0].isIntersecting); }, { threshold: .1 }).observe(hero);

  /* ---------- Abas com indicador deslizante ---------- */
  var abasEl = $(".abas"), luz = $("[data-abas-luz]"), abas = $$("[data-tab]");
  function moverLuz() {
    var b = $('[data-tab][aria-selected="true"]');
    if (!b || !luz) return;
    abasEl.classList.add("tem-luz");
    abasEl.style.setProperty("--ax", b.offsetLeft + "px");
    abasEl.style.setProperty("--aw", b.offsetWidth + "px");
    luz.style.transform = "translateX(" + b.offsetLeft + "px)"; luz.style.width = b.offsetWidth + "px";
  }
  function ativarAba(btn, foco) {
    abas.forEach(function (b) {
      var on = b === btn;
      b.setAttribute("aria-selected", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
      var p = document.getElementById(b.getAttribute("aria-controls"));
      if (!p) return;
      p.hidden = !on;
      if (on) {
        $$(".trat", p).forEach(function (t, i) { t.style.setProperty("--i", i); t.classList.add("in", "feito"); });
        $$("[data-img]", p).forEach(function (f) { f.classList.add("in"); });
        if (!reduz) { p.classList.remove("is-novo"); void p.offsetWidth; p.classList.add("is-novo"); }
      }
    });
    moverLuz();
    if (btn.scrollIntoView && abasEl.scrollWidth > abasEl.clientWidth) btn.scrollIntoView({ block: "nearest", inline: "center", behavior: reduz ? "auto" : "smooth" });
    if (foco) btn.focus();
  }
  abas.forEach(function (b, i) {
    b.addEventListener("click", function () { ativarAba(b); });
    b.addEventListener("keydown", function (e) {
      var n = null;
      if (e.key === "ArrowRight") n = abas[(i + 1) % abas.length];
      if (e.key === "ArrowLeft") n = abas[(i - 1 + abas.length) % abas.length];
      if (e.key === "Home") n = abas[0];
      if (e.key === "End") n = abas[abas.length - 1];
      if (n) { e.preventDefault(); ativarAba(n, true); }
    });
  });
  if (abasEl) { moverLuz(); window.addEventListener("resize", moverLuz); if (document.fonts) document.fonts.ready.then(moverLuz); }

  function abrirTratamento(id) {
    var d = document.getElementById(id);
    if (!d) return;
    var painel = d.closest("[role=tabpanel]");
    var aba = painel && $('[aria-controls="' + painel.id + '"]');
    if (aba) ativarAba(aba);
    $$("details.trat[open]").forEach(function (o) { if (o !== d) o.open = false; });
    d.open = true;
    setTimeout(function () { rolarAte(d); }, 60);
  }
  var hashIni = location.hash.slice(1);
  if (hashIni && document.getElementById(hashIni) && document.getElementById(hashIni).matches("details.trat")) abrirTratamento(hashIni);

  /* ---------- Guia: o que você quer melhorar ---------- */
  var dadosEl = $("#guia-dados"), saida = $("[data-resultado]");
  var GUIA = dadosEl ? JSON.parse(dadosEl.textContent) : {};
  function utmTxt() {
    try { var u = JSON.parse(sessionStorage.getItem("site-utm-v1") || "{}"); return u.utm_source ? " [origem: " + u.utm_source + (u.utm_campaign ? "/" + u.utm_campaign : "") + "]" : ""; } catch (e) { return ""; }
  }
  function linkWa(msg) { return "https://wa.me/" + WHATS + "?text=" + encodeURIComponent(msg + utmTxt()); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function icone(n, c) { return '<svg class="' + (c || "ic") + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function botaoWa(msg, label, id) {
    return '<a class="btn btn--ouro" href="' + linkWa(msg) + '" target="_blank" rel="noopener" data-btn="' + id + '"><span class="btn__ic">' + icone("wa") + '</span><span class="btn__tx">' + label + "</span></a>";
  }
  function mostrar(id) {
    var html;
    if (id === "nao-sei") {
      html = '<p class="eyebrow">Recomendação</p><p class="resultado__tit">Comece pela Consulta Estética</p>' +
        '<p class="resultado__nota">É nela que a Dra. Deyse avalia sua pele, entende sua rotina e indica o protocolo certo para você. Sem achismo e sem gastar com o que não precisa.</p>' +
        botaoWa("Olá, Dra. Deyse! Vim pelo site, ainda não sei qual tratamento fazer e quero agendar a Consulta Estética.", "Agendar avaliação", "guia-nao-sei");
    } else {
      var g = GUIA[id]; if (!g) return;
      var itens = g.trat.map(function (t, i) {
        return '<li style="--i:' + i + '"><a href="#' + t.id + '" data-abre="' + t.id + '"><span class="selo-ic">' + icone("spark") + "</span><span><strong>" + esc(t.nome) + "</strong><span>" + esc(t.resumo) + "</span></span>" + icone("arrow") + "</a></li>";
      }).join("");
      html = '<p class="eyebrow">Indicados para</p><p class="resultado__tit">' + esc(g.nome) + "</p>" +
        '<p class="resultado__nota">A escolha final acontece na avaliação, de acordo com a sua pele.</p>' +
        '<ul class="resultado__lista">' + itens + "</ul>" +
        botaoWa("Olá, Dra. Deyse! Vim pelo site e quero tratar: " + g.nome.toLowerCase() + ". Pode me orientar?", "Quero uma orientação", "guia-" + id);
    }
    saida.innerHTML = html;
    prepararCards(saida);
    prepararMagneticos(saida);
    if (!reduz) { saida.classList.remove("is-novo"); void saida.offsetWidth; saida.classList.add("is-novo"); }
  }
  $$("[data-guia]").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("[data-guia]").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
      mostrar(b.getAttribute("data-guia"));
      if (window.matchMedia("(max-width: 1024px)").matches) rolarAte(saida);
    });
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-abre]");
    if (!a) return;
    e.preventDefault();
    abrirTratamento(a.getAttribute("data-abre"));
    history.replaceState(null, "", "#" + a.getAttribute("data-abre"));
  });

  /* ---------- Sanfonas: uma aberta por vez, com rolagem até ela ---------- */
  $$("details[name]").forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (!d.open) return;
      $$('details[name="' + d.getAttribute("name") + '"][open]').forEach(function (o) { if (o !== d) o.open = false; });
    });
  });

  /* ---------- Luz que segue o cursor e inclinação 3D ---------- */
  function prepararCards(raiz) {
    if (!fino || reduz) return;
    $$(".card", raiz).forEach(function (c) {
      if (c._luz) return; c._luz = 1;
      var tilt = c.classList.contains("card--tilt");
      c.addEventListener("pointermove", function (e) {
        var r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty("--lx", x + "px"); c.style.setProperty("--ly", y + "px");
        if (tilt) { c.style.setProperty("--ry", ((x / r.width - .5) * 7).toFixed(2) + "deg"); c.style.setProperty("--rx", ((.5 - y / r.height) * 7).toFixed(2) + "deg"); }
      });
      c.addEventListener("pointerleave", function () { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); });
    });
  }
  prepararCards(document);

  /* ---------- Botões magnéticos ---------- */
  function prepararMagneticos(raiz) {
    if (!fino || reduz) return;
    $$(".btn, .zap", raiz).forEach(function (b) {
      if (b._mag) return; b._mag = 1;
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.setProperty("--mx-b", ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + "px");
        b.style.setProperty("--my-b", ((e.clientY - r.top - r.height / 2) * .28 - 2).toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () { b.style.setProperty("--mx-b", "0px"); b.style.setProperty("--my-b", "0px"); });
    });
  }
  prepararMagneticos(document);

  /* ---------- Contador ---------- */
  $$("[data-conta]").forEach(function (el) {
    var fim = +el.getAttribute("data-conta");
    if (reduz) return;
    el.textContent = "0";
    new IntersectionObserver(function (es, o) {
      if (!es[0].isIntersecting) return; o.disconnect();
      var t0 = performance.now();
      (function passo(t) { var k = Math.min(1, (t - t0) / 1400); el.textContent = Math.round(fim * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(passo); })(t0);
    }, { threshold: .6 }).observe(el);
  });

  /* ---------- Vidro líquido (refração só em navegadores Chromium) ---------- */
  var marcasUA = navigator.userAgentData && navigator.userAgentData.brands;
  if (marcasUA && marcasUA.some(function (b) { return /Chrom/.test(b.brand); }) && !reduz) doc.classList.add("liquido");

  /* ---------- Símbolo 3D: gira devagar e segue o cursor ---------- */
  var c3d = $("[data-c3d]"), c3dVivo = false, ang = 0, tx = -8, txAlvo = -8, angExtra = 0, angExtraAlvo = 0, cena = null;
  if (c3d) {
    cena = $(".c3d__cena", c3d);
    new IntersectionObserver(function (e) { c3dVivo = e[0].isIntersecting; }).observe(c3d);
    if (fino) {
      var cardC = c3d.closest(".card") || c3d;
      cardC.addEventListener("pointermove", function (e) {
        var r = cardC.getBoundingClientRect();
        angExtraAlvo = ((e.clientX - r.left) / r.width - .5) * 70;
        txAlvo = -8 + ((e.clientY - r.top) / r.height - .5) * -24;
      });
      cardC.addEventListener("pointerleave", function () { angExtraAlvo = 0; txAlvo = -8; });
    }
  }
  function passo3d() {
    if (!cena || !c3dVivo) return;
    if (!reduz) ang = (ang + .22) % 360;
    angExtra += (angExtraAlvo - angExtra) * .08; tx += (txAlvo - tx) * .08;
    cena.style.setProperty("--a", (ang + angExtra).toFixed(2) + "deg");
    cena.style.setProperty("--tx", tx.toFixed(2) + "deg");
  }

  /* ---------- Carrossel infinito de depoimentos (passa devagar, arrasta com inércia) ---------- */
  var car = $("[data-carrossel]"), trilho = car ? $("[data-trilho]", car) : null;
  var cx = 0, cvel = reduz ? 0 : -0.35, cin = 0, arr = false, ax = 0, carVivo = false, metade = 0, moveu = 0;
  function medir() { if (trilho) metade = trilho.scrollWidth / 2; }
  if (car && trilho) {
    medir(); window.addEventListener("resize", medir); window.addEventListener("load", medir);
    new IntersectionObserver(function (e) { carVivo = e[0].isIntersecting; }).observe(car);
    car.addEventListener("pointerdown", function (e) {
      arr = true; ax = e.clientX; cin = 0; moveu = 0;
      car.classList.add("is-arrastando");
      try { car.setPointerCapture(e.pointerId); } catch (er) {}
    });
    car.addEventListener("pointermove", function (e) {
      if (!arr) return;
      var dx = e.clientX - ax; ax = e.clientX;
      cx += dx; cin = dx; moveu += Math.abs(dx);
    });
    function soltar() { if (!arr) return; arr = false; car.classList.remove("is-arrastando"); }
    car.addEventListener("pointerup", soltar);
    car.addEventListener("pointercancel", soltar);
    car.addEventListener("lostpointercapture", soltar);
    car.addEventListener("click", function (e) { if (moveu > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
  }
  function passoCarrossel() {
    if (!trilho || !carVivo || !metade) return;
    if (!arr) { cx += cvel + cin; cin *= 0.95; if (Math.abs(cin) < .05) cin = 0; }
    if (cx <= -metade) cx += metade;
    if (cx > 0) cx -= metade;
    trilho.style.transform = "translate3d(" + cx.toFixed(2) + "px,0,0)";
  }

  /* ---------- Scrollytelling ---------- */
  var hist = $("[data-historia]");
  var marcas = hist ? $$(".historia__marcas li", hist) : [];
  var passosH = hist ? $$(".historia__passo", hist) : [];
  function passoHistoria() {
    if (!hist) return;
    var r = hist.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    var k = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
    hist.style.setProperty("--hp", k.toFixed(3));
    var ativo = 0;
    passosH.forEach(function (p, i) { if (p.getBoundingClientRect().top < innerHeight * .55) ativo = i; });
    marcas.forEach(function (m, i) { m.classList.toggle("on", i === ativo); });
  }

  /* ---------- Rolagem suave (roda do mouse + âncoras) ---------- */
  var sm = { on: false, cur: 0, alvo: 0, last: 0, lambda: 5.2 };
  function maxY() { return doc.scrollHeight - innerHeight; }
  function rolarPara(y, lambda) {
    y = Math.max(0, Math.min(maxY(), y));
    if (reduz) { scrollTo(0, y); return; }
    if (!sm.on) { sm.cur = scrollY; sm.last = 0; }
    sm.alvo = y; sm.lambda = lambda || 3.4; sm.on = true;
  }
  function rolarAte(el) { rolarPara(el.getBoundingClientRect().top + scrollY - alturaTopo(), 3.4); }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]:not([data-abre]):not([data-cookie-settings])');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var el = id ? document.getElementById(id) : null;
    if (!el && id !== "inicio") return;
    e.preventDefault();
    rolarPara(el ? el.getBoundingClientRect().top + scrollY - alturaTopo() : 0, 3.4);
    history.replaceState(null, "", "#" + id);
  });
  if (fino && !reduz) {
    doc.style.scrollBehavior = "auto";
    window.addEventListener("wheel", function (e) {
      if (e.ctrlKey || e.defaultPrevented || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var el = e.target;
      while (el && el !== document.body && el.nodeType === 1) {
        if (el.matches("iframe,select,textarea,[data-native-scroll]")) return;
        var cs = getComputedStyle(el);
        if (/(auto|scroll)/.test(cs.overflowY) && el.scrollHeight > el.clientHeight + 1) return;
        el = el.parentElement;
      }
      e.preventDefault();
      var dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
      if (!sm.on) { sm.cur = scrollY; sm.alvo = scrollY; sm.last = 0; }
      sm.alvo = Math.max(0, Math.min(maxY(), sm.alvo + dy));
      sm.lambda = 5.2; sm.on = true;
    }, { passive: false });
    ["mousedown", "keydown", "touchstart"].forEach(function (t) { window.addEventListener(t, function () { sm.on = false; }, { passive: true }); });
  }
  function passoRolagem(t) {
    if (!sm.on) return;
    var dt = sm.last ? Math.min(.064, (t - sm.last) / 1000) : 1 / 60;
    sm.last = t;
    var d = sm.alvo - sm.cur;
    if (Math.abs(d) < .4) { sm.cur = sm.alvo; scrollTo(0, sm.cur); sm.on = false; return; }
    sm.cur += d * (1 - Math.exp(-sm.lambda * dt));
    scrollTo(0, sm.cur);
  }

  /* ---------- Laço único: topo, progresso, paralaxe, linha dos passos ---------- */
  var prog = $("[data-prog]"), par = $$("[data-par]"), linha = $("[data-linha]");
  var ultimoY = scrollY, ySalvo = -1;
  function laco(t) {
    passoRolagem(t);
    passo3d();
    passoCarrossel();
    var y = scrollY;
    if (y !== ySalvo) {
      ySalvo = y;
      if (topo) {
        topo.classList.toggle("is-solid", y > 30);
        if (!topo.classList.contains("is-open")) {
          if (y > ultimoY + 6 && y > 420) topo.classList.add("is-hidden");
          else if (y < ultimoY - 6 || y < 420) topo.classList.remove("is-hidden");
        }
        ultimoY = y;
      }
      if (prog) prog.style.setProperty("--p", (y / Math.max(1, maxY())).toFixed(4));
      if (!reduz) par.forEach(function (el) {
        var base = el.parentElement.getBoundingClientRect();
        if (base.bottom < -200 || base.top > innerHeight + 200) return;
        var off = (base.top + base.height / 2 - innerHeight / 2) * -parseFloat(el.getAttribute("data-par"));
        el.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
      });
      passoHistoria();
      if (linha) {
        var r = linha.getBoundingClientRect();
        var k = Math.min(1, Math.max(0, (innerHeight * .65 - r.top) / r.height));
        linha.style.setProperty("--lp", k.toFixed(3));
      }
    }
    requestAnimationFrame(laco);
  }
  requestAnimationFrame(laco);
})();
