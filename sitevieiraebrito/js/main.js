/* Vieira & Brito Advogados: comportamento do site.
   Revelações por IntersectionObserver; a barra superior usa uma escuta passiva de rolagem que só troca classes. */
(function () {
  "use strict";
  var root = document.documentElement;

  /* Topo:
     - parado no início da página: largo e transparente
     - ao primeiro movimento de rolagem: solta e vira a placa de vidro
     - depois da segunda dobra, descendo: sai em desfoque lento
     - subindo (ou de volta ao topo): volta com o mesmo desfoque
     Só troca classes; o movimento é todo em CSS. */
  var topo = document.querySelector(".topo");
  if (topo) {
    var ultimoY = scrollY, pedido = false, acum = 0;
    function atualizaTopo() {
      pedido = false;
      var y = Math.max(0, scrollY), dy = y - ultimoY; ultimoY = y;
      topo.classList.toggle("is-solid", y > 8 || root.classList.contains("lock"));
      if (root.classList.contains("lock")) { topo.classList.remove("is-hidden"); return; }
      /* acumula a direção para não piscar com tremidas pequenas */
      acum = (dy > 0) === (acum > 0) ? acum + dy : dy;
      var passouSegundaDobra = y > innerHeight * 2;
      if (!passouSegundaDobra || acum < -24) topo.classList.remove("is-hidden");
      else if (acum > 24) topo.classList.add("is-hidden");
      root.classList.toggle("topo-oculto", topo.classList.contains("is-hidden"));
    }
    addEventListener("scroll", function () { if (!pedido) { pedido = true; requestAnimationFrame(atualizaTopo); } }, { passive: true });
    topo.addEventListener("focusin", function () { topo.classList.remove("is-hidden"); });
    atualizaTopo();
  }

  /* Menu do celular */
  var burger = document.querySelector(".burger"), menu = document.getElementById("menu");
  function fecha() { if (!burger) return; burger.setAttribute("aria-expanded", "false"); burger.setAttribute("aria-label", "Abrir menu"); menu.classList.remove("is-open"); root.classList.remove("lock"); menu.setAttribute("aria-hidden", "true"); }
  if (burger && menu) {
    burger.addEventListener("click", function () {
      var abre = burger.getAttribute("aria-expanded") !== "true";
      if (!abre) { fecha(); return; }
      burger.setAttribute("aria-expanded", "true"); burger.setAttribute("aria-label", "Fechar menu");
      menu.classList.add("is-open"); menu.setAttribute("aria-hidden", "false"); root.classList.add("lock");
      topo.classList.add("is-solid");
      var p = menu.querySelector("a"); if (p) p.focus({ preventScroll: true });
    });
    menu.addEventListener("click", function (e) { if (e.target.closest("a")) fecha(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && menu.classList.contains("is-open")) { fecha(); burger.focus(); } });
    matchMedia("(min-width: 1081px)").addEventListener("change", function (m) { if (m.matches) fecha(); });
  }

  /* Revelação ao rolar
     - títulos: cada palavra sobe de dentro de uma máscara, em sequência
     - textos, cards, linhas e fotos: entram em cascata, um depois do outro
     Tudo por IntersectionObserver; desligado em prefers-reduced-motion. */
  var anima = "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches;

  function quebraPalavras(el) {
    var n = 0;
    (function anda(no) {
      Array.prototype.slice.call(no.childNodes).forEach(function (f) {
        if (f.nodeType === 3) {
          var partes = f.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
          partes.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var i = document.createElement("span"); i.textContent = p; i.style.setProperty("--i", n++);
            w.appendChild(i); frag.appendChild(w);
          });
          f.parentNode.replaceChild(frag, f);
        } else if (f.nodeType === 1) { anda(f); }
      });
    })(el);
    el.classList.add("tsplit");
  }

  if (anima) {
    document.querySelectorAll("main h1, main h2").forEach(quebraPalavras);
    /* textos de apoio e itens de grade ganham entrada própria, em cascata */
    document.querySelectorAll("main .eyebrow, main .lead, main .sec__head p, main .ph p, main .hero p, main .hero__ctas, main .final p").forEach(function (el) {
      if (!el.hasAttribute("data-r")) { el.setAttribute("data-r", "t"); el.style.setProperty("--d", ".18s"); }
    });
    [".idx a", ".passos li", ".qa details", ".cam li", ".princ li", ".canais > div", ".linhas li", ".fatos > div", ".area__cols > div", ".gal figure", ".area"].forEach(function (sel) {
      var grupos = new Map();
      document.querySelectorAll(sel).forEach(function (el) {
        var pai = el.parentElement, k = grupos.get(pai) || 0; grupos.set(pai, k + 1);
        el.setAttribute("data-r", "c"); el.style.setProperty("--d", (k * .09) + "s");
      });
    });
  }

  var rev = document.querySelectorAll("[data-r], .tsplit");
  if (anima) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -10% 0px", threshold: .12 });
    rev.forEach(function (el) { io.observe(el); });
    /* capa: entra logo ao abrir */
    var h1 = document.querySelector(".hero h1, .ph h1");
    if (h1) requestAnimationFrame(function () { setTimeout(function () { h1.classList.add("in"); }, 120); });
  } else { rev.forEach(function (el) { el.classList.add("in"); }); }

  /* Página de áreas: marca o grupo visível na barra de troca */
  var trocas = document.querySelectorAll(".troca a");
  if (trocas.length && "IntersectionObserver" in window) {
    var mapa = {};
    trocas.forEach(function (a) { mapa[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { trocas.forEach(function (a) { a.classList.remove("is-on"); }); var a = mapa[e.target.id]; if (a) a.classList.add("is-on"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(mapa).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
  }

  /* Formulário de contato: monta a mensagem e abre o WhatsApp */
  var form = document.getElementById("form-contato");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      ["nome", "mensagem"].forEach(function (n) {
        var c = form.elements[n], box = c.closest(".campo"), err = box.querySelector(".erro");
        var vazio = !c.value.trim();
        box.classList.toggle("tem-erro", vazio);
        c.setAttribute("aria-invalid", vazio ? "true" : "false");
        err.textContent = vazio ? (n === "nome" ? "Informe como podemos chamar você." : "Conte em poucas linhas o que está acontecendo.") : "";
        if (vazio && ok) { c.focus(); ok = false; }
      });
      if (!ok) return;
      var txt = "Olá! Meu nome é " + form.elements.nome.value.trim() + ".\nAssunto: " + form.elements.assunto.value + ".\n\n" + form.elements.mensagem.value.trim();
      var num = form.getAttribute("data-whats");
      var utm = "";
      try { var u = JSON.parse(sessionStorage.getItem("site-utm-v1") || "{}"); if (u.utm_source) utm = "\n[origem: " + u.utm_source + (u.utm_campaign ? "/" + u.utm_campaign : "") + "]"; } catch (er) { /* sem armazenamento */ }
      if (window.gtag) window.gtag("event", "clique_whatsapp", { botao: "form-contato" });
      if (window.fbq) window.fbq("track", "Contact", { botao: "form-contato" });
      window.open("https://wa.me/" + num + "?text=" + encodeURIComponent(txt + utm), "_blank", "noopener");
    });
  }

  /* Ano no rodapé */
  document.querySelectorAll("[data-ano]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

/* Rolagem suave da roda do mouse, sem biblioteca. Solta o controle na hora se a pessoa
   pegar a barra lateral, clicar, usar o teclado ou o navegador mover a página por outro motivo. */
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
    if (e.ctrlKey || e.metaKey || e.shiftKey || root.classList.contains("lock") || temRolagemPropria(e.target)) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
    e.preventDefault();
    if (!anima) { posY = alvoY = escrito = scrollY; antes = performance.now(); anima = true; requestAnimationFrame(passo); }
    alvoY = Math.max(0, Math.min(root.scrollHeight - innerHeight, alvoY + dy));
  }, { passive: false });
  ["mousedown", "keydown", "touchstart"].forEach(function (ev) { addEventListener(ev, parar, { passive: true }); });
})();
