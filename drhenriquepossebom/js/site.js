/* Dr. Thiago Araújo: interações. Sem bibliotecas. */
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fino = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var celular = matchMedia("(max-width: 767px)");

  /* ano */
  doc.querySelectorAll("[data-ano]").forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* barra superior: ganha sombra ao rolar, some ao descer e volta ao subir */
  var topo = doc.querySelector("[data-topo]");
  if (topo) {
    var ultimo = scrollY, acum = 0;
    var aoRolar = function () {
      var y = scrollY, d = y - ultimo;
      topo.classList.toggle("is-scrolled", y > 24);
      if (doc.body.classList.contains("menu-open") || y < 240) { topo.classList.remove("is-hidden"); acum = 0; }
      else {
        acum = (d > 0) === (acum > 0) ? acum + d : d;
        if (acum > 60) topo.classList.add("is-hidden");
        if (acum < -40) topo.classList.remove("is-hidden");
      }
      ultimo = y;
      doc.body.classList.toggle("topo-oculto", topo.classList.contains("is-hidden"));
    };
    addEventListener("scroll", aoRolar, { passive: true });
    aoRolar();
    topo.addEventListener("focusin", function () { topo.classList.remove("is-hidden"); doc.body.classList.remove("topo-oculto"); });
  }

  /* indicador deslizante (menu do topo e abas de tratamentos) */
  function indicador(box, luz, ativoSel) {
    if (!box || !luz) return null;
    var mover = function (el) {
      if (!el) { luz.style.opacity = "0"; return; }
      luz.style.opacity = "1";
      luz.style.left = el.offsetLeft + "px";
      luz.style.width = el.offsetWidth + "px";
    };
    var ativo = function () { return box.querySelector(ativoSel); };
    if (fino) {
      box.querySelectorAll("a").forEach(function (a) { a.addEventListener("pointerenter", function () { mover(a); }); });
      box.addEventListener("pointerleave", function () { mover(ativo()); });
    }
    addEventListener("resize", function () { mover(ativo()); });
    (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(function () { mover(ativo()); });
    return { mover: mover, ativo: ativo };
  }
  indicador(doc.querySelector(".nav"), doc.querySelector(".nav__luz"), "a[aria-current]");

  /* menu do celular */
  var burger = doc.querySelector(".burger"), menu = doc.getElementById("menu");
  function fechaMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true; doc.body.classList.remove("menu-open");
    burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menu");
  }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      if (!menu.hidden) return fechaMenu();
      menu.hidden = false; doc.body.classList.add("menu-open");
      menu.style.paddingTop = Math.round(topo.getBoundingClientRect().bottom + 14) + "px";
      burger.setAttribute("aria-expanded", "true"); burger.setAttribute("aria-label", "Fechar menu");
      topo && topo.classList.remove("is-hidden");
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a") || e.target === menu) fechaMenu(); });
    addEventListener("keydown", function (e) { if (e.key === "Escape" && !menu.hidden) { fechaMenu(); burger.focus(); } });
    matchMedia("(min-width: 1081px)").addEventListener("change", fechaMenu);
  }

  /* entradas com a rolagem, uma vez */
  var entra = doc.querySelectorAll("[data-reveal]");
  if (reduced || !("IntersectionObserver" in window)) entra.forEach(function (el) { el.classList.add("is-in"); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    entra.forEach(function (el) { io.observe(el); });
  }

  /* inclinação 3D leve e luz seguindo o mouse */
  if (fino && !reduced) {
    doc.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.setProperty("--rx", (-y * 4).toFixed(2) + "deg");
        el.style.setProperty("--ry", (x * 5).toFixed(2) + "deg");
        el.style.setProperty("--mx", ((x + .5) * 100).toFixed(1) + "%");
        el.style.setProperty("--my", ((y + .5) * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  /* faixas contínuas: infinitas, arrastáveis com mouse e dedo, com inércia */
  function faixa(rootEl) {
    var track = rootEl.querySelector(".marquee__track");
    var originais = [].slice.call(track.children);
    var vel = (reduced ? 0 : Number(rootEl.dataset.speed || 40)) * Number(rootEl.dataset.direction || 1);
    var setW = 0, x = 0, v = 0, arrastando = false, sobre = false, visivel = true;
    var x0 = 0, pos0 = 0, mov = 0, xl = 0, tl = 0, pid = null, antes = performance.now();
    function clone(n, esconde) { var c = n.cloneNode(true); c.setAttribute("data-clone", ""); if (esconde) c.setAttribute("aria-hidden", "true"); return c; }
    function monta() {
      track.querySelectorAll("[data-clone]").forEach(function (n) { n.remove(); });
      var medir = function () { return track.scrollWidth; };
      var reps = 0;
      while (medir() < rootEl.clientWidth * 1.2 && reps++ < 12) originais.forEach(function (n) { track.appendChild(clone(n)); });
      setW = medir();
      [].slice.call(track.children).forEach(function (n) { track.appendChild(clone(n, true)); });
    }
    var dobra = function (val) { return ((val % setW) + setW) % setW; };
    function quadro(t) {
      var dt = Math.min(.05, (t - antes) / 1000); antes = t;
      if (!arrastando && visivel) {
        if (Math.abs(v) > 4) { x += v * dt; v *= Math.pow(.04, dt); }
        else { v = 0; if (!sobre) x += vel * dt; }
      }
      track.style.transform = "translate3d(" + (-dobra(x)) + "px,0,0)";
      requestAnimationFrame(quadro);
    }
    rootEl.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      arrastando = true; mov = 0; v = 0; pid = e.pointerId; x0 = xl = e.clientX; pos0 = x; tl = performance.now();
      rootEl.classList.add("is-dragging");
    });
    rootEl.addEventListener("pointermove", function (e) {
      if (!arrastando || e.pointerId !== pid) return;
      var dx = e.clientX - x0; mov = Math.max(mov, Math.abs(dx));
      if (mov > 4 && !rootEl.hasPointerCapture(pid)) rootEl.setPointerCapture(pid);
      x = pos0 - dx;
      var t = performance.now(), d = (t - tl) / 1000;
      if (d > 0) v = .8 * (-(e.clientX - xl) / d) + .2 * v;
      xl = e.clientX; tl = t;
    });
    var fim = function (e) {
      if (!arrastando || (e && e.pointerId !== pid)) return;
      arrastando = false; rootEl.classList.remove("is-dragging");
      if (performance.now() - tl > 80) v = 0;
      v = Math.max(-2400, Math.min(2400, v));
    };
    rootEl.addEventListener("pointerup", fim);
    rootEl.addEventListener("pointercancel", fim);
    rootEl.addEventListener("lostpointercapture", fim);
    rootEl.addEventListener("dragstart", function (e) { e.preventDefault(); });
        new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; }).observe(rootEl);
    monta();
    var largura = rootEl.clientWidth;
    new ResizeObserver(function () { if (Math.abs(rootEl.clientWidth - largura) > 2) { largura = rootEl.clientWidth; var p = x / setW; monta(); x = p * setW; } }).observe(rootEl);
    requestAnimationFrame(quadro);
  }
  var iniciaFaixas = function () { doc.querySelectorAll("[data-marquee]").forEach(faixa); };
  doc.fonts && doc.fonts.ready ? doc.fonts.ready.then(iniciaFaixas) : addEventListener("load", iniciaFaixas);

  /* perguntas: abrem e fecham devagar, uma de cada vez */
  (function () {
    var todos = [].slice.call(doc.querySelectorAll("details"));
    var mapa = new Map();
    var irmaos = function (d) { return todos.filter(function (o) { return o !== d && o.parentElement === d.parentElement; }); };
    todos.forEach(function (d) {
      var sum = d.querySelector("summary"), corpo = [].slice.call(d.children).filter(function (c) { return c !== sum; })[0];
      if (!sum || !corpo) return;
      var anim = null;
      var aberto = function () { return d.open && !d.classList.contains("is-closing"); };
      var roda = function (abrindo) {
        var de = d.offsetHeight;
        if (anim) anim.cancel();
        d.classList.remove("is-closing");
        if (abrindo) d.open = true;
        var borda = d.offsetHeight - d.clientHeight;
        var para = abrindo ? d.scrollHeight + borda : sum.offsetHeight + borda;
        if (!abrindo) d.classList.add("is-closing");
        d.style.overflow = "hidden";
        anim = d.animate({ height: [de + "px", para + "px"] }, { duration: abrindo ? 950 : 800, easing: "cubic-bezier(.45,.05,.25,1)" });
        corpo.animate({ opacity: abrindo ? [0, 1] : [1, 0], transform: abrindo ? ["translateY(-8px)", "none"] : ["none", "translateY(-8px)"] }, { duration: abrindo ? 950 : 600, easing: "ease-in-out", fill: "forwards" });
        anim.onfinish = function () {
          if (!abrindo) d.open = false;
          d.classList.remove("is-closing"); d.style.overflow = ""; anim = null;
          corpo.getAnimations().forEach(function (a) { a.cancel(); });
        };
      };
      mapa.set(d, { roda: roda, aberto: aberto });
      sum.addEventListener("click", function (e) {
        if (reduced) return;
        e.preventDefault();
        var abrindo = !aberto();
        if (abrindo) irmaos(d).forEach(function (o) { var m = mapa.get(o); if (m && m.aberto()) m.roda(false); });
        roda(abrindo);
      });
    });
  })();

  /* empilhamento: o card coberto recua e escurece de leve */
  (function () {
    var listas = [];
    doc.querySelectorAll("[data-stack]").forEach(function (s) { listas.push({ itens: [].slice.call(s.children), so: false, fundo: s.hasAttribute("data-fundo") }); });
    doc.querySelectorAll("[data-stack-m]").forEach(function (s) { listas.push({ itens: [].slice.call(s.children), so: true }); });
    if (!listas.length || reduced) return;
    var pendente = false;
    var atualiza = function () {
      pendente = false;
      listas.forEach(function (l) {
        l.itens.forEach(function (el, i) {
          var p = 0, prox = l.itens[i + 1];
          if (prox && (!l.so || celular.matches)) {
            var r = el.getBoundingClientRect(), n = prox.getBoundingClientRect();
            p = Math.min(1, Math.max(0, (r.bottom - n.top) / r.height));
          }
          if (l.fundo) {
            var d = 0, ri = el.getBoundingClientRect();
            for (var j = i + 1; j < l.itens.length; j++) { var rj = l.itens[j].getBoundingClientRect(); d += Math.min(1, Math.max(0, (ri.bottom - rj.top) / ri.height)); }
            el.style.setProperty("--d", Math.min(d, 3).toFixed(3));
          }
          el.style.setProperty("--s", (1 - p * .06).toFixed(4));
          el.style.setProperty("--b", (1 - p * .1).toFixed(3));
        });
      });
    };
    addEventListener("scroll", function () { if (!pendente) { pendente = true; requestAnimationFrame(atualiza); } }, { passive: true });
    addEventListener("resize", atualiza);
    atualiza();
  })();

  /* pilha de tratamentos: todos os cards com a mesma altura, para encaixarem certinho */
  (function () {
    var cards = [].slice.call(doc.querySelectorAll("[data-fundo] .ts__card"));
    if (!cards.length) return;
    var iguala = function () {
      cards.forEach(function (c) { c.style.minHeight = ""; });
      var max = cards.reduce(function (m, c) { return Math.max(m, c.offsetHeight); }, 0);
      cards.forEach(function (c) { c.style.minHeight = max + "px"; });
    };
    var t; addEventListener("resize", function () { clearTimeout(t); t = setTimeout(iguala, 120); });
    (doc.fonts && doc.fonts.ready ? doc.fonts.ready : Promise.resolve()).then(iguala);
    addEventListener("load", iguala);
  })();

  /* abas da página de tratamentos */
  var abas = doc.querySelector(".abas__in");
  if (abas) {
    var ind = indicador(abas, abas.querySelector(".abas__luz"), "a.is-on");
    var links = [].slice.call(abas.querySelectorAll("a"));
    var marca = function (id) {
      links.forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("href") === "#" + id); });
      var a = ind.ativo(); ind.mover(a);
      if (a) abas.scrollTo({ left: a.offsetLeft - abas.clientWidth / 2 + a.offsetWidth / 2, behavior: reduced ? "auto" : "smooth" });
    };
    var blocos = [].slice.call(doc.querySelectorAll(".bloco")), atual = null, pend = false;
    var confere = function () {
      pend = false;
      var id = blocos[0].id, linha = innerHeight * .45;
      blocos.forEach(function (b) { if (b.getBoundingClientRect().top <= linha) id = b.id; });
      if (id !== atual) { atual = id; marca(id); }
    };
    addEventListener("scroll", function () { if (!pend) { pend = true; requestAnimationFrame(confere); } }, { passive: true });
    addEventListener("resize", confere);
    confere();
  }

  /* formulário: abre o WhatsApp com a mensagem pronta */
  var form = doc.getElementById("form-contato");
  if (form && form.getAttribute("data-whats")) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["nome", "mensagem"].forEach(function (n) {
        var c = form.elements[n], box = c.closest(".campo"), err = box.querySelector(".erro"), vazio = !c.value.trim();
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

/* rolagem suave da roda do mouse, sem biblioteca: solta o controle se a pessoa pegar a barra, clicar ou usar o teclado */
(function () {
  if (!matchMedia("(hover:hover) and (pointer:fine)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var root = document.documentElement, alvoY = 0, posY = 0, escrito = 0, anima = false, antes = 0;
  function parar() { anima = false; }
  function temRolagemPropria(el) {
    for (; el && el !== document.body && el !== root && el.nodeType === 1; el = el.parentElement) {
      var o = getComputedStyle(el).overflowY;
      if ((o === "auto" || o === "scroll") && el.scrollHeight > el.clientHeight) return true;
    }
    return false;
  }
  function passo(t) {
    if (!anima) return;
    if (Math.abs(scrollY - escrito) > 3) { parar(); return; }
    var dt = Math.min(t - antes, 50); antes = t;
    posY += (alvoY - posY) * (1 - Math.exp(-dt * .0062));
    if (Math.abs(alvoY - posY) < .6) posY = alvoY;
    scrollTo({ top: posY, behavior: "instant" }); escrito = scrollY;
    if (posY === alvoY) { parar(); return; }
    requestAnimationFrame(passo);
  }
  addEventListener("wheel", function (e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || document.body.classList.contains("menu-open") || temRolagemPropria(e.target)) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
    e.preventDefault();
    if (!anima) { posY = alvoY = escrito = scrollY; antes = performance.now(); anima = true; requestAnimationFrame(passo); }
    alvoY = Math.max(0, Math.min(root.scrollHeight - innerHeight, alvoY + dy));
  }, { passive: false });
  ["mousedown", "keydown", "touchstart"].forEach(function (ev) { addEventListener(ev, parar, { passive: true }); });
})();

/* prévia: formulário quando o contato é um link (sem número) */
(function () {
  var form = document.getElementById("form-contato");
  if (!form || !form.getAttribute("data-link")) return;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var n = form.elements.nome.value.trim(), m = form.elements.mensagem.value.trim();
    [["nome", n, "Informe como podemos chamar você."], ["mensagem", m, "Conte em poucas linhas como podemos ajudar."]].forEach(function (c) {
      var box = form.elements[c[0]].closest(".campo"); box.classList.toggle("tem-erro", !c[1]); box.querySelector(".erro").textContent = c[1] ? "" : c[2];
    });
    if (!n) { form.elements.nome.focus(); return; }
    if (!m) { form.elements.mensagem.focus(); return; }
    var txt = "Olá! Meu nome é " + n + ".\nAssunto: " + form.elements.assunto.value + ".\n\n" + m;
    try { navigator.clipboard.writeText(txt); } catch (x) {}
    window.open(form.getAttribute("data-link"), "_blank", "noopener");
  });
})();
