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
  var celular = matchMedia("(max-width: 767px)").matches;
  var SEQ = {
    aviao: { pasta: celular ? "aviao-m" : "aviao", total: 59, img: [] },
    chegada: { pasta: celular ? "chegada-m" : "chegada", total: 44, img: [] }
  };
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
      ["aviao", "chegada"].forEach(function (k) {
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
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    tela.width = Math.round(tela.clientWidth * dpr);
    tela.height = Math.round(tela.clientHeight * dpr);
    ultimoDesenho = "";
  }
  function cobrir(im, alpha) {
    if (!im) return;
    var cw = tela.width, ch = tela.height, r = Math.max(cw / im.naturalWidth, ch / im.naturalHeight);
    var w = im.naturalWidth * r, h = im.naturalHeight * r;
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, (cw - w) / 2, (ch - h) / 2, w, h);
  }
  function desenhar(p) {
    var a = clamp(p / 0.58, 0, 1);
    var b = clamp((p - 0.42) / 0.58, 0, 1);
    var mix = clamp((p - 0.42) / 0.16, 0, 1);
    var ia = Math.round(a * (SEQ.aviao.total - 1));
    var ib = Math.round(b * (SEQ.chegada.total - 1));
    var chave = ia + ":" + ib + ":" + mix.toFixed(2);
    if (chave === ultimoDesenho) return;
    ultimoDesenho = chave;
    if (mix < 1) cobrir(quadro(SEQ.aviao, ia), 1);
    if (mix > 0) cobrir(quadro(SEQ.chegada, ib), mix);
  }
  function camadas(p) {
    var saida = clamp((p - 0.1) / 0.2, 0, 1);
    hero.style.opacity = String(1 - saida);
    hero.style.transform = "translate3d(0," + (-70 * saida) + "px,0)";
    hero.style.visibility = saida >= 1 ? "hidden" : "visible";
    voo.classList.toggle("is-chegada", p > 0.46);
    trust.forEach(function (li, i) { li.classList.toggle("is-on", p > 0.52 + i * 0.06); });
    voo.style.setProperty("--p", p.toFixed(3));
  }
  function progressoVoo() {
    var r = voo.getBoundingClientRect();
    var curso = r.height - window.innerHeight;
    return curso > 0 ? clamp(-r.top / curso, 0, 1) : 0;
  }

  if (!reduz) {
    medir();
    carregar(SEQ.aviao, 0, function () { desenhar(atualP); voo.classList.add("is-pronto"); });
    carregar(SEQ.chegada, 0);
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
    flutuante.classList.toggle("is-on", y > window.innerHeight * 0.7);
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
  var rota = document.getElementById("mapa-rota");
  var btnSaida = document.querySelector("[data-saida-btn]");
  function escolher(cod) {
    var op = sel.querySelector('option[value="' + cod + '"]');
    if (!op) return;
    sel.value = cod;
    var x = +op.dataset.x, y = +op.dataset.y, nome = op.textContent;
    mapa.querySelectorAll(".mapa__caps circle").forEach(function (c) { c.classList.toggle("is-on", c.dataset.iata === cod); });
    var ex = 640, ey = -40, cx = (x + ex) / 2 + 40, cy = Math.min(y, ey) - 30 + (y - ey) * 0.15;
    rota.setAttribute("d", "M" + x + " " + y + " Q" + cx + " " + cy + " " + ex + " " + ey);
    if (!reduz && rota.animate) {
      var L = rota.getTotalLength();
      rota.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: 1200, easing: "cubic-bezier(.16,1,.3,1)" });
    }
    document.querySelector("[data-saida-cod]").textContent = cod;
    document.querySelector("[data-saida-nome]").textContent = nome;
    atualizaWhats(btnSaida, "Oi, Sarah! Moro perto de " + nome + " e quero planejar uma viagem saindo daí.");
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
    saidaSonho.textContent = v || "Seu lugar da lista";
    codSonho.textContent = v ? v.normalize("NFD").replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase() || "Destino" : "Destino";
    atualizaWhats(btnSonho, v ? "Oi, Sarah! O lugar que está há anos na minha lista é " + v + ". Quero planejar essa viagem." : "Oi, Sarah! Quero planejar uma viagem.");
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
    function aplicar() { trilho.style.transform = "translate3d(" + x.toFixed(2) + "px,0,0)"; }

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
})();
