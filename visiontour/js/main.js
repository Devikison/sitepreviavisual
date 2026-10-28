/* Vision Tour | interações do site
   - Voo: sequência de quadros que avança com a rolagem (seções 1 e 2)
   - Galeria da Europa, mapa de saída, trajeto do como funciona
   - Cartão de embarque final que se preenche com o destino digitado */
(function () {
  "use strict";

  var doc = document.documentElement;
  doc.classList.add("js");
  var reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- rolagem suave (só mouse, sem reduced motion) ---------- */
  var lenis = null;
  if (window.Lenis && !reduz && matchMedia("(hover: hover) and (pointer: fine)").matches) {
    lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } });
  }

  /* ---------- menu ---------- */
  var topo = document.querySelector("[data-topo]");
  var abrir = document.querySelector("[data-menu]");
  var menu = document.getElementById("menu");
  function fecharMenu() {
    abrir.setAttribute("aria-expanded", "false");
    menu.classList.remove("is-aberto"); topo.classList.remove("is-aberto");
  }
  abrir.addEventListener("click", function () {
    var aberto = abrir.getAttribute("aria-expanded") === "true";
    if (aberto) return fecharMenu();
    abrir.setAttribute("aria-expanded", "true");
    menu.classList.add("is-aberto"); topo.classList.add("is-aberto");
  });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) fecharMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") fecharMenu(); });

  /* âncoras passam pelo Lenis quando ele está ativo */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || !lenis) return;
    var id = a.getAttribute("href");
    if (id.length < 2) return;
    var alvo = document.querySelector(id);
    if (!alvo) return;
    e.preventDefault();
    lenis.scrollTo(alvo, { offset: id === "#topo" ? 0 : -(topo.offsetHeight + 16) });
  });

  /* ---------- entradas ---------- */
  var revelas = document.querySelectorAll(".revela");
  if ("IntersectionObserver" in window && !reduz) {
    var io = new IntersectionObserver(function (itens) {
      itens.forEach(function (it) {
        if (!it.isIntersecting) return;
        it.target.classList.add("is-on");
        io.unobserve(it.target);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    revelas.forEach(function (el) {
      var irmaos = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains("revela"); });
      el.style.setProperty("--d", (Math.min(irmaos.indexOf(el), 5) * 0.08) + "s");
      io.observe(el);
    });
  } else {
    revelas.forEach(function (el) { el.classList.add("is-on"); });
  }

  /* ---------- voo: sequência de quadros ---------- */
  var voo = document.querySelector("[data-voo]");
  var tela = voo.querySelector(".voo__tela");
  var ctx = tela.getContext("2d");
  var hero = voo.querySelector(".voo__hero");
  var trust = voo.querySelectorAll(".confianca__item");
  /* celular e tablet em pé usam o vídeo vertical */
  var celular = matchMedia("(max-width: 767px), (orientation: portrait) and (max-width: 1100px)").matches;
  var meio = voo.querySelector(".voo__meio");
  var veuDestino = voo.querySelector(".voo__veu--destino");
  var veuMeio = voo.querySelector(".voo__veu--meio");
  var veuJanela = voo.querySelector(".voo__veu--janela");
  var SEQ = {
    janela: { pasta: celular ? "janela-m" : "janela", total: 56, img: [] },
    egito: { pasta: celular ? "egito-m" : "egito", total: celular ? 62 : 83, img: [] }
  };
  /* onde está a janela do avião em cada quadro (x0, y0, x1, y1 em fração do vídeo) */
  var JANELA = celular ? [[0.111, 0.081, 1.0, 0.925], [0.122, 0.088, 1.0, 0.925], [0.133, 0.094, 1.0, 0.925], [0.133, 0.094, 1.0, 0.919], [0.144, 0.1, 1.0, 0.919], [0.156, 0.106, 1.0, 0.919], [0.167, 0.119, 1.0, 0.919], [0.178, 0.125, 1.0, 0.919], [0.178, 0.131, 1.0, 0.919], [0.189, 0.138, 1.0, 0.919], [0.2, 0.138, 1.0, 0.912], [0.2, 0.144, 1.0, 0.906], [0.2, 0.144, 1.0, 0.906], [0.211, 0.144, 1.0, 0.9], [0.211, 0.15, 1.0, 0.9], [0.211, 0.15, 1.0, 0.894], [0.2, 0.15, 1.0, 0.888], [0.2, 0.15, 1.0, 0.888], [0.2, 0.15, 1.0, 0.888], [0.2, 0.15, 1.0, 0.881], [0.211, 0.144, 1.0, 0.875], [0.211, 0.144, 1.0, 0.869], [0.211, 0.15, 1.0, 0.862], [0.211, 0.15, 1.0, 0.862], [0.211, 0.156, 1.0, 0.856], [0.222, 0.156, 1.0, 0.856], [0.222, 0.156, 1.0, 0.85], [0.222, 0.156, 1.0, 0.85], [0.233, 0.156, 1.0, 0.844], [0.244, 0.162, 1.0, 0.844], [0.244, 0.162, 1.0, 0.838], [0.256, 0.162, 1.0, 0.838], [0.267, 0.162, 1.0, 0.838], [0.278, 0.162, 1.0, 0.831], [0.289, 0.162, 1.0, 0.831], [0.289, 0.169, 1.0, 0.825], [0.289, 0.175, 1.0, 0.825], [0.289, 0.175, 1.0, 0.825], [0.278, 0.181, 1.0, 0.825], [0.278, 0.181, 1.0, 0.825], [0.256, 0.188, 1.0, 0.825], [0.256, 0.181, 1.0, 0.819], [0.256, 0.188, 1.0, 0.819], [0.256, 0.188, 1.0, 0.819], [0.256, 0.181, 1.0, 0.812], [0.256, 0.181, 1.0, 0.812], [0.244, 0.181, 1.0, 0.806], [0.233, 0.181, 1.0, 0.806], [0.233, 0.181, 0.989, 0.8], [0.233, 0.181, 0.989, 0.8], [0.222, 0.181, 0.989, 0.8], [0.233, 0.181, 0.989, 0.8], [0.233, 0.181, 0.989, 0.794], [0.233, 0.181, 0.989, 0.8], [0.233, 0.181, 0.989, 0.8], [0.233, 0.175, 0.989, 0.8]] : [[0.231, 0.078, 0.562, 0.933], [0.231, 0.078, 0.562, 0.933], [0.231, 0.089, 0.562, 0.933], [0.238, 0.089, 0.562, 0.922], [0.238, 0.1, 0.562, 0.922], [0.244, 0.1, 0.562, 0.922], [0.25, 0.111, 0.562, 0.922], [0.25, 0.122, 0.562, 0.922], [0.25, 0.122, 0.562, 0.922], [0.256, 0.133, 0.556, 0.922], [0.256, 0.133, 0.556, 0.922], [0.256, 0.133, 0.556, 0.911], [0.256, 0.133, 0.556, 0.911], [0.256, 0.144, 0.556, 0.911], [0.262, 0.144, 0.55, 0.9], [0.262, 0.144, 0.55, 0.9], [0.256, 0.144, 0.55, 0.9], [0.256, 0.144, 0.544, 0.889], [0.256, 0.144, 0.544, 0.889], [0.256, 0.144, 0.544, 0.889], [0.262, 0.144, 0.544, 0.878], [0.262, 0.144, 0.544, 0.878], [0.262, 0.144, 0.538, 0.867], [0.262, 0.144, 0.538, 0.867], [0.262, 0.144, 0.538, 0.867], [0.262, 0.156, 0.538, 0.856], [0.262, 0.156, 0.538, 0.856], [0.269, 0.156, 0.531, 0.856], [0.269, 0.156, 0.531, 0.856], [0.275, 0.156, 0.531, 0.844], [0.275, 0.156, 0.531, 0.844], [0.281, 0.156, 0.531, 0.844], [0.281, 0.156, 0.531, 0.844], [0.288, 0.156, 0.531, 0.833], [0.294, 0.167, 0.531, 0.833], [0.294, 0.167, 0.531, 0.833], [0.294, 0.167, 0.525, 0.833], [0.294, 0.167, 0.525, 0.833], [0.288, 0.178, 0.525, 0.833], [0.288, 0.178, 0.525, 0.833], [0.288, 0.178, 0.525, 0.833], [0.281, 0.178, 0.519, 0.822], [0.281, 0.178, 0.519, 0.822], [0.281, 0.178, 0.519, 0.822], [0.281, 0.178, 0.519, 0.822], [0.275, 0.178, 0.519, 0.811], [0.275, 0.178, 0.512, 0.811], [0.269, 0.178, 0.512, 0.811], [0.269, 0.178, 0.512, 0.811], [0.269, 0.178, 0.512, 0.8], [0.269, 0.178, 0.512, 0.8], [0.269, 0.178, 0.512, 0.8], [0.269, 0.178, 0.512, 0.8], [0.269, 0.178, 0.512, 0.8], [0.269, 0.178, 0.512, 0.8], [0.269, 0.178, 0.512, 0.8]];
  var alvoP = 0, atualP = 0, vooVisivel = true, ultimoDesenho = "";

  function src(seq, i) { return "assets/seq/" + seq.pasta + "/" + String(i).padStart(3, "0") + ".webp"; }
  function carregar(seq, i, cb) {
    if (seq.img[i]) return cb && cb();
    var im = new Image();
    im.decoding = "async";
    im.onload = function () { seq.img[i] = im; ultimoDesenho = ""; if (cb) cb(); };
    im.src = src(seq, i);
  }
  /* quadro mais perto já carregado */
  function quadro(seq, i) {
    for (var d = 0; d < seq.total; d++) {
      if (seq.img[i - d]) return seq.img[i - d];
      if (seq.img[i + d]) return seq.img[i + d];
    }
    return null;
  }
  function filaDeCarga() {
    /* carrega de forma espaçada primeiro (1 a cada 4), depois preenche */
    var ordem = [];
    [4, 2, 1].forEach(function (passo) {
      ["janela", "egito"].forEach(function (k) {
        for (var i = 0; i < SEQ[k].total; i += passo) ordem.push([k, i]);
      });
    });
    var n = 0, ativos = 0;
    (function proximo() {
      while (ativos < 4 && n < ordem.length) {
        var it = ordem[n++];
        if (SEQ[it[0]].img[it[1]]) continue;
        ativos++;
        carregar(SEQ[it[0]], it[1], function () { ativos--; proximo(); });
      }
    })();
  }

  function medir() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    tela.width = Math.round(tela.clientWidth * dpr);
    tela.height = Math.round(tela.clientHeight * dpr);
    ultimoDesenho = "";
  }
  /* retângulo de "cover" do vídeo na tela */
  function caixa(im) {
    var cw = tela.width, ch = tela.height, r = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    var w = im.naturalWidth * r, h = im.naturalHeight * r;
    return { x: (cw - w) / 2, y: (ch - h) / 2, w: w, h: h };
  }
  function suave(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* linha do tempo do topo:
     0 a .32  a moça olha pela janela (vídeo avança)
     .30 a .58 a janela vira portal e abre até a tela toda, já mostrando o Egito
     .30 a 1   a câmera passa pelas paredes até as pirâmides */
  function desenhar(p) {
    var ia = Math.round(clamp(p / 0.32, 0, 1) * (SEQ.janela.total - 1));
    var ib = Math.round(clamp((p - 0.30) / 0.70, 0, 1) * (SEQ.egito.total - 1));
    var t = suave(clamp((p - 0.30) / 0.28, 0, 1));
    ctx.imageSmoothingQuality = "high";
    var chave = ia + ":" + ib + ":" + t.toFixed(3);
    if (chave === ultimoDesenho) return;
    ultimoDesenho = chave;
    var cw = tela.width, ch = tela.height;
    var imA = quadro(SEQ.janela, ia), imB = quadro(SEQ.egito, ib);
    ctx.globalAlpha = 1;
    if (t < 1 && imA) {
      var c = caixa(imA), j = JANELA[ia] || JANELA[JANELA.length - 1];
      /* no computador a cena vai um pouco para a esquerda: a direita do vídeo é escura e recebe o texto */
      if (!celular) c.x -= Math.min(cw * 0.12, Math.max(0, c.w - cw) / 2 + cw * 0.12);
      /* centro da janela na tela */
      var jx0 = c.x + j[0] * c.w, jy0 = c.y + j[1] * c.h, jx1 = c.x + j[2] * c.w, jy1 = c.y + j[3] * c.h;
      var cx = (jx0 + jx1) / 2, cy = (jy0 + jy1) / 2;
      /* a câmera aproxima da janela enquanto ela abre */
      var z = 1 + t * (celular ? 0.3 : 0.9);
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy);
      ctx.drawImage(imA, c.x, c.y, c.w, c.h);
      ctx.restore();
      if (t > 0 && imB) {
        /* o portal: a janela aumentada cresce até ocupar a tela */
        /* a janela de partida fica sempre inteira dentro da tela (no celular ela encosta na borda) */
        var mg = cw * 0.06;
        var s0 = clamp(cx - (cx - jx0) * z, mg, cw - mg), s1 = clamp(cy - (cy - jy0) * z, mg, ch - mg);
        var s2 = clamp(cx + (jx1 - cx) * z, mg, cw - mg), s3 = clamp(cy + (jy1 - cy) * z, mg, ch - mg);
        var px0 = lerp(s0, 0, t), py0 = lerp(s1, 0, t), px1 = lerp(s2, cw, t), py1 = lerp(s3, ch, t);
        var raio = lerp(Math.min(px1 - px0, py1 - py0) * 0.32, 0, t);
        ctx.save();
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(px0, py0, px1 - px0, py1 - py0, raio); else ctx.rect(px0, py0, px1 - px0, py1 - py0);
        ctx.clip();
        var cb = caixa(imB), zb = lerp(1.12, 1, t);
        ctx.translate(cw / 2, ch / 2); ctx.scale(zb, zb); ctx.translate(-cw / 2, -ch / 2);
        ctx.drawImage(imB, cb.x, cb.y, cb.w, cb.h);
        ctx.restore();
        /* moldura de luz na borda da janela */
        ctx.save();
        ctx.globalAlpha = 0.85 * (1 - t);
        ctx.strokeStyle = "#F2C48D"; ctx.lineWidth = 2 * (tela.width / tela.clientWidth);
        ctx.shadowColor = "#F2C48D"; ctx.shadowBlur = 24;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(px0, py0, px1 - px0, py1 - py0, raio); else ctx.rect(px0, py0, px1 - px0, py1 - py0);
        ctx.stroke();
        ctx.restore();
      }
    } else if (imB) {
      var cb2 = caixa(imB);
      ctx.drawImage(imB, cb2.x, cb2.y, cb2.w, cb2.h);
    }
  }
  function faixa(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function camadas(p) {
    var saida = faixa(p, 0.12, 0.26);
    hero.style.opacity = String(1 - saida);
    hero.style.transform = "translate3d(0," + (-60 * saida) + "px,0)";
    hero.style.visibility = saida >= 1 ? "hidden" : "visible";
    /* frase do meio: entra com o portal e sai antes da chegada */
    var mEnt = faixa(p, 0.36, 0.46), mSai = faixa(p, 0.56, 0.64), mo = mEnt * (1 - mSai);
    meio.style.opacity = String(mo);
    meio.style.transform = "translate3d(0," + (30 * (1 - mEnt) - 30 * mSai) + "px,0) scale(" + (0.96 + 0.04 * mEnt) + ")";
    meio.style.visibility = mo <= 0 ? "hidden" : "visible";
    veuMeio.style.opacity = String(mo);
    veuJanela.style.opacity = String(1 - faixa(p, 0.28, 0.45));
    veuDestino.style.opacity = String(faixa(p, 0.5, 0.66));
    voo.classList.toggle("is-chegada", p > 0.64);
    trust.forEach(function (li, i) { li.classList.toggle("is-on", p > 0.7 + i * 0.05); });
    voo.style.setProperty("--p", p.toFixed(3));
  }
  function progressoVoo() {
    var r = voo.getBoundingClientRect();
    var curso = r.height - window.innerHeight;
    return curso > 0 ? clamp(-r.top / curso, 0, 1) : 0;
  }

  if (!reduz) {
    medir();
    carregar(SEQ.janela, 0, function () { desenhar(atualP); voo.classList.add("is-pronto"); });
    carregar(SEQ.egito, 0);
    if (document.readyState === "complete") filaDeCarga();
    else window.addEventListener("load", filaDeCarga);
    window.addEventListener("resize", function () { medir(); desenhar(atualP); });
    new IntersectionObserver(function (e) { vooVisivel = e[0].isIntersecting; }).observe(voo);
  } else {
    trust.forEach(function (li) { li.classList.add("is-on"); });
    voo.classList.add("is-chegada");
  }

  /* ---------- trajeto do como funciona ---------- */
  var trajeto = document.querySelector("[data-trajeto]");
  var paradas = trajeto.querySelectorAll(".parada");
  var trajetoVisivel = false;
  new IntersectionObserver(function (e) { trajetoVisivel = e[0].isIntersecting; }).observe(trajeto);
  function progressoTrajeto() {
    var r = trajeto.getBoundingClientRect(), vh = window.innerHeight;
    var t = clamp((vh * 0.85 - r.top) / (vh * 0.6), 0, 1);
    trajeto.style.setProperty("--t", t.toFixed(3));
    paradas.forEach(function (li, i) { li.classList.toggle("is-passou", t >= i / (paradas.length - 1) - 0.02); });
  }

  /* ---------- topo e botão flutuante ---------- */
  var flutuante = document.querySelector(".flutuante");
  function barra() {
    var y = window.scrollY;
    topo.classList.toggle("is-solido", y > voo.offsetHeight - window.innerHeight * 0.6);
    flutuante.classList.toggle("is-on", y > voo.offsetHeight - window.innerHeight * 0.5);
  }

  /* ---------- laço único de quadro ---------- */
  function laco(t) {
    if (lenis) lenis.raf(t);
    if (!reduz && vooVisivel) {
      alvoP = progressoVoo();
      atualP += (alvoP - atualP) * (celular ? 0.3 : 0.16);
      if (Math.abs(alvoP - atualP) < 0.0004) atualP = alvoP;
      camadas(atualP);
      desenhar(atualP);
    }
    if (trajetoVisivel) progressoTrajeto();
    barra();
    requestAnimationFrame(laco);
  }
  requestAnimationFrame(laco);

  /* ---------- galeria da Europa ---------- */
  document.querySelectorAll("[data-galeria]").forEach(function (g) {
    var fotos = g.querySelectorAll("img"), pontos = g.querySelectorAll("button"), atual = 0, timer = null;
    function ir(n) {
      atual = (n + fotos.length) % fotos.length;
      fotos.forEach(function (f, i) { f.classList.toggle("is-on", i === atual); });
      pontos.forEach(function (b, i) { b.setAttribute("aria-pressed", String(i === atual)); });
    }
    pontos.forEach(function (b, i) { b.addEventListener("click", function () { ir(i); reiniciar(); }); });
    function reiniciar() { clearInterval(timer); if (!reduz) timer = setInterval(function () { ir(atual + 1); }, 4800); }
    new IntersectionObserver(function (e) { if (e[0].isIntersecting) reiniciar(); else clearInterval(timer); }).observe(g);
  });

  /* ---------- WhatsApp com mensagem dinâmica ---------- */
  function atualizaWhats(el, msg) {
    el.setAttribute("data-wa-msg", msg);
    if (window.vtWhats) el.href = window.vtWhats(msg);
  }

  /* ---------- mapa: de qual capital você sai ---------- */
  var sel = document.querySelector("[data-saida]");
  var mapa = document.querySelector("[data-mapa]");
  var btnSaida = document.querySelector("[data-saida-btn]");
  var selG = mapa.querySelector(".mapa__sel"), selNome = mapa.querySelector(".sel__nome");
  var DEST = [[735, 92], [760, 206], [735, 320]];
  /* no celular os nomes ficam maiores, então os destinos chegam mais para dentro */
  if (matchMedia("(max-width: 767px)").matches) {
    DEST = [[600, 80], [625, 200], [600, 320]];
    mapa.querySelectorAll(".destino-no").forEach(function (g, i) { g.setAttribute("transform", "translate(" + DEST[i][0] + " " + DEST[i][1] + ")"); });
  }
  var bases = [0, 1, 2].map(function (i) { return document.getElementById("rota-" + i); });
  var fluxos = [0, 1, 2].map(function (i) { return mapa.querySelector('[data-fluxo="' + i + '"]'); });
  function escolher(cod) {
    var op = sel.querySelector('option[value="' + cod + '"]');
    if (!op) return;
    sel.value = cod;
    var x = +op.dataset.x, y = +op.dataset.y, nome = op.textContent;
    mapa.querySelectorAll(".mapa__caps circle").forEach(function (c) { c.classList.toggle("is-on", c.dataset.iata === cod); });
    selG.setAttribute("transform", "translate(" + x + " " + y + ")");
    selNome.textContent = nome;
    selNome.setAttribute("text-anchor", x > 470 ? "end" : x < 120 ? "start" : "middle");
    DEST.forEach(function (d, i) {
      var cx = (x + d[0]) / 2, cy = Math.min(y, d[1]) - 70 - i * 10;
      var path = "M" + x + " " + y + " Q" + cx + " " + cy + " " + d[0] + " " + d[1];
      bases[i].setAttribute("d", path); fluxos[i].setAttribute("d", path);
      if (!reduz && bases[i].animate) {
        var L = bases[i].getTotalLength();
        fluxos[i].animate([{ opacity: 0 }, { opacity: 0, offset: .6 }, { opacity: 1 }], { duration: 1300 + i * 150, easing: "ease-out" });
        bases[i].animate([{ strokeDasharray: L + " " + L, strokeDashoffset: L }, { strokeDasharray: L + " " + L, strokeDashoffset: 0 }], { duration: 1100 + i * 150, easing: "cubic-bezier(.16,1,.3,1)" });
      }
    });
    document.querySelector("[data-saida-cod]").textContent = cod;
    document.querySelector("[data-saida-nome]").textContent = nome;
    atualizaWhats(btnSaida, "Olá, Vision Tour! Moro perto de " + nome + " e quero planejar uma viagem saindo daí.");
  }
  sel.addEventListener("change", function () { escolher(sel.value); });
  mapa.querySelectorAll(".mapa__caps circle").forEach(function (c) {
    c.addEventListener("click", function () { escolher(c.dataset.iata); });
  });
  window.addEventListener("load", function () { escolher("FOR"); });

  /* ---------- cartão final ---------- */
  var sonho = document.querySelector("[data-sonho]");
  var btnSonho = document.querySelector("[data-sonho-btn]");
  var saidaSonho = document.querySelector("[data-sonho-saida]");
  var codSonho = document.querySelector("[data-sonho-cod]");
  sonho.addEventListener("input", function () {
    var v = sonho.value.trim();
    if (v) saidaSonho.textContent = v; else saidaSonho.innerHTML = "Seu lugar<br>da lista";
    codSonho.textContent = v ? v.normalize("NFD").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "Destino" : "Destino";
    atualizaWhats(btnSonho, v ? "Olá, Vision Tour! O lugar que está há anos na minha lista é " + v + ". Quero planejar essa viagem." : "Olá, Vision Tour! Quero planejar uma viagem.");
  });
  sonho.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); btnSonho.click(); } });

  /* ---------- carrossel contínuo com arrasto ---------- */
  document.querySelectorAll("[data-carrossel]").forEach(function (car) {
    var trilho = car.querySelector(".carrossel__trilho");
    var originais = Array.prototype.slice.call(trilho.children);
    var VEL = reduz ? 0 : 0.026;            /* px por ms: bem devagar */
    var setW = 0, x = 0, impulso = 0, fator = 1, alvoFator = 1;
    var arrastando = false, inicioX = 0, baseX = 0, ultX = 0, ultT = 0, velArrasto = 0;
    var visivel = false, tAnt = 0;

    function montar() {
      trilho.querySelectorAll("[data-clone]").forEach(function (c) { c.remove(); });
      var gap = parseFloat(getComputedStyle(trilho).columnGap) || 0;
      setW = originais.reduce(function (s, el) { return s + el.offsetWidth + gap; }, 0);
      var copias = Math.max(1, Math.ceil((car.offsetWidth + setW) / setW));
      for (var c = 0; c < copias; c++) {
        originais.forEach(function (el) {
          var k = el.cloneNode(true);
          k.setAttribute("data-clone", ""); k.setAttribute("aria-hidden", "true");
          trilho.appendChild(k);
        });
      }
    }
    function prender() { x = ((x % setW) - setW) % setW; }
    var xAnt = 0, andou = 0;
    function aplicar() {
      trilho.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)";
      /* distância total percorrida, para a lona da esteira andar junto sem pular no loop */
      var d = x - xAnt; if (d > setW / 2) d -= setW; else if (d < -setW / 2) d += setW;
      andou += d; xAnt = x; car.style.setProperty("--andou", andou.toFixed(1));
    }

    function passo(t) {
      var dt = Math.min(t - (tAnt || t), 50); tAnt = t;
      if (visivel && !arrastando && setW) {
        fator += (alvoFator - fator) * 0.05;
        x -= (VEL * fator + impulso) * dt;
        impulso *= Math.pow(0.94, dt / 16.7);
        if (Math.abs(impulso) < 0.001) impulso = 0;
        prender(); aplicar();
      }
      requestAnimationFrame(passo);
    }

    car.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      arrastando = true; car.classList.add("is-arrastando");
      inicioX = e.clientX; baseX = x; ultX = e.clientX; ultT = e.timeStamp; velArrasto = 0; impulso = 0;
      car.setPointerCapture(e.pointerId);
    });
    car.addEventListener("pointermove", function (e) {
      if (!arrastando) return;
      x = baseX + (e.clientX - inicioX);
      var dt = e.timeStamp - ultT;
      if (dt > 0) velArrasto = velArrasto * 0.6 + ((e.clientX - ultX) / dt) * 0.4;
      ultX = e.clientX; ultT = e.timeStamp;
      prender(); aplicar();
    });
    function soltar() {
      if (!arrastando) return;
      arrastando = false; car.classList.remove("is-arrastando");
      impulso = clamp(-velArrasto, -3, 3);   /* o arrasto continua com inércia e volta ao ritmo lento */
    }
    car.addEventListener("pointerup", soltar);
    car.addEventListener("pointercancel", soltar);
    car.addEventListener("lostpointercapture", soltar);
    car.addEventListener("dragstart", function (e) { e.preventDefault(); });
    car.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") alvoFator = 0.35; });
    car.addEventListener("pointerleave", function () { alvoFator = 1; });

    new IntersectionObserver(function (en) { visivel = en[0].isIntersecting; }).observe(car);
    var larg = window.innerWidth;
    window.addEventListener("resize", function () { if (window.innerWidth !== larg) { larg = window.innerWidth; montar(); prender(); aplicar(); } });
    montar(); car.classList.add("is-pronto");
    requestAnimationFrame(passo);
  });

  /* ---------- botão "embarque": letras, aviãozinho e decolagem ---------- */
  var CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5"/><path d="M8 12.3l2.7 2.7L16.2 9.5"/></svg>';
  function letras(txt) {
    return Array.prototype.map.call(txt, function (ch, i) {
      return '<span style="--i:' + i + '">' + (ch === " " ? "&nbsp;" : ch.replace(/[<>&]/g, "")) + "</span>";
    }).join("");
  }
  var ioBtn = "IntersectionObserver" in window ? new IntersectionObserver(function (en) {
    en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visto"); ioBtn.unobserve(e.target); } });
  }, { threshold: 0.6 }) : null;
  document.querySelectorAll("a.btn--claro, a.btn--escuro").forEach(function (b) {
    if (b.closest(".consent")) return;
    var txt = b.textContent.replace(/\s+/g, " ").trim();
    var aviao = b.classList.contains("btn--escuro") ? "plane-cream" : "plane-navy";
    b.setAttribute("aria-label", txt);
    b.innerHTML =
      '<span class="btn__estado btn__estado--ir" aria-hidden="true"><span class="btn__ico"><img src="assets/' + aviao + '.svg" alt="" width="24" height="14"></span><span class="btn__letras">' + letras(txt) + "</span></span>" +
      '<span class="btn__estado btn__estado--ok" aria-hidden="true"><span class="btn__ico">' + CHECK + '</span><span class="btn__letras">' + letras("Boa viagem!") + "</span></span>";
    b.classList.add("btn--vt");
    if (ioBtn && !reduz) ioBtn.observe(b); else b.classList.add("is-visto");
    var timer = null;
    b.addEventListener("click", function () {
      clearTimeout(timer);
      b.classList.remove("is-decolando"); void b.offsetWidth;
      b.classList.add("is-decolando");
      timer = setTimeout(function () { b.classList.remove("is-decolando"); }, 2600);
    });
  });

  /* ---------- perguntas frequentes: abrir e fechar suave ---------- */
  document.querySelectorAll(".duvida").forEach(function (d) {
    var sum = d.querySelector("summary"), p = d.querySelector("p");
    var corpo = document.createElement("div"); corpo.className = "duvida__corpo";
    d.insertBefore(corpo, p); corpo.appendChild(p);
    var anim = null, EASE = "cubic-bezier(.4, 0, .2, 1)";
    sum.addEventListener("click", function (e) {
      if (reduz || !corpo.animate) return;
      e.preventDefault();
      if (anim) anim.cancel();
      if (!d.open) {
        d.open = true;
        var h = corpo.scrollHeight;
        anim = corpo.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 480, easing: EASE });
      } else {
        d.classList.add("is-fechando");
        anim = corpo.animate([{ height: corpo.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 400, easing: EASE });
        anim.onfinish = function () { d.open = false; d.classList.remove("is-fechando"); };
      }
      anim.addEventListener("finish", function () { anim = null; });
    });
  });
})();
