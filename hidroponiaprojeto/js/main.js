/* Plantar em Casa: simulador de sistemas, entradas, dúvidas e pop-up de saída */
(function () {
  "use strict";
  var reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Desenhos dos sistemas (viewBox 0 0 400 360) ---------- */
  var INK = "#19392C", AGUA = "#15A3A5", PAPEL = "#FFFFFF", CANO = "#F4F1E6";
  function u(id, x, y, w, h) { return '<use href="#' + id + '" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/>'; }
  function r(x, y, w, h, f, rx) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (rx || 0) + '" fill="' + f + '"/>'; }
  function fileira(n, x0, passo, y, w) { var s = ""; for (var i = 0; i < n; i++) s += u("alface", x0 + i * passo, y, w, w * 0.8); return s; }

  var D = {
    kratky: function () {
      return r(130, 150, 140, 196, PAPEL, 22) + r(130, 236, 140, 110, AGUA, 0) + r(130, 320, 140, 26, AGUA, 22) +
        r(118, 138, 164, 22, INK, 6) + u("raiz", 180, 196, 40, 110) + u("copo", 176, 126, 48, 42) + u("alface", 136, 40, 128, 102);
    },
    caixa: function () {
      var s = r(40, 196, 320, 150, INK, 10) + r(54, 222, 292, 110, AGUA, 4) + r(30, 182, 340, 22, CANO, 6);
      [70, 170, 270].forEach(function (x) { s += u("raiz", x + 10, 204, 40, 100) + u("copo", x + 6, 170, 48, 40) + u("alface", x - 18, 88, 96, 77); });
      for (var i = 0; i < 9; i++) s += '<circle cx="' + (80 + i * 30) + '" cy="' + (318 - (i % 3) * 22) + '" r="5" fill="' + CANO + '" opacity=".8"/>';
      return s;
    },
    nft6: function () {
      var s = r(72, 204, 12, 120, INK, 4) + r(316, 204, 12, 120, INK, 4) + r(150, 270, 100, 76, INK, 8) + r(160, 290, 80, 48, AGUA, 4) +
        '<path d="M160 300 C110 300 100 260 52 214" stroke="' + AGUA + '" stroke-width="7" fill="none" stroke-linecap="round"/>';
      s += r(36, 186, 328, 34, CANO, 17);
      for (var i = 0; i < 6; i++) s += u("copo", 52 + i * 52, 176, 30, 26);
      return s + fileira(6, 40, 52, 120, 54);
    },
    nft18: function () {
      var s = r(54, 70, 12, 276, INK, 4) + r(334, 70, 12, 276, INK, 4) + r(150, 300, 100, 46, INK, 8) + r(160, 312, 80, 28, AGUA, 4);
      [120, 196, 272].forEach(function (y) {
        s += r(36, y, 328, 26, CANO, 13);
        for (var i = 0; i < 6; i++) s += u("copo", 50 + i * 52, y - 8, 26, 22);
        s += fileira(6, 42, 52, y - 50, 44);
      });
      return s;
    },
    torre: function () {
      var s = r(130, 300, 140, 50, INK, 10) + r(142, 312, 116, 30, AGUA, 4) + r(182, 22, 36, 292, CANO, 14);
      for (var i = 0; i < 6; i++) {
        var y = 30 + i * 46, esq = i % 2 === 0;
        s += u("alface", esq ? 104 : 212, y, 84, 67);
      }
      return s;
    },
    balde: function () {
      var s = '<path d="M40 340 H360" stroke="' + AGUA + '" stroke-width="10" stroke-linecap="round"/>';
      [70, 230].forEach(function (x) {
        s += '<path d="M' + x + ' 236 H' + (x + 100) + ' L' + (x + 90) + ' 332 H' + (x + 10) + ' Z" fill="' + INK + '"/>' + r(x + 14, 250, 72, 12, CANO, 4) + u("tomateiro", x + 14, 60, 72, 184);
      });
      return s;
    }
  };

  var DADOS = {
    kratky: { nome: "Kratky no pote", onde: "Peitoril da janela ou bancada da cozinha", pes: "1 a 4 pés de alface ou tempero", energia: "Nenhuma. Sem bomba e sem tomada", cor: "#E7E1CF" },
    caixa: { nome: "Caixa flutuante", onde: "Bancada, lavanderia ou varanda", pes: "6 a 12 pés de alface", energia: "Bomba de ar de aquário, ligada direto", cor: "#D4ECEC" },
    nft6: { nome: "NFT de 6 pés", onde: "Varanda ou parede com luz da manhã", pes: "6 pés por ciclo", energia: "Bomba pequena com timer", cor: "#E2EFCB" },
    nft18: { nome: "Bancada NFT 18", onde: "Quintal, laje ou varanda grande", pes: "18 pés por ciclo", energia: "Bomba média com timer", cor: "#E7E1CF" },
    torre: { nome: "Torre vertical", onde: "Canto da varanda, ocupa menos de 1 m²", pes: "12 a 24 pés empilhados", energia: "Bomba pequena com timer", cor: "#D4ECEC" },
    balde: { nome: "Balde holandês", onde: "Quintal ou varanda com sol forte", pes: "2 a 6 pés de tomate, pimentão ou pepino", energia: "Bomba pequena com timer", cor: "#E2EFCB" }
  };

  var g = document.getElementById("palcoG"), svg = document.getElementById("palcoDesenho"), casa = document.getElementById("palcoCasa");
  var abas = [].slice.call(document.querySelectorAll('[role="tab"][data-s]'));
  function mostra(id, foco) {
    var d = DADOS[id]; if (!d || !g) return;
    abas.forEach(function (b) { var on = b.dataset.s === id; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; if (on && foco) b.focus(); });
    var troca = function () {
      g.innerHTML = D[id]();
      document.getElementById("palcoTitulo").textContent = "Desenho do sistema " + d.nome;
      document.getElementById("fatoNome").textContent = d.nome;
      document.getElementById("fatoOnde").textContent = d.onde;
      document.getElementById("fatoPes").textContent = d.pes;
      document.getElementById("fatoEnergia").textContent = d.energia;
      casa.style.backgroundColor = d.cor;
      svg.classList.remove("saindo");
    };
    if (reduz || !g.innerHTML) troca(); else { svg.classList.add("saindo"); setTimeout(troca, 260); }
  }
  abas.forEach(function (b, i) {
    b.addEventListener("click", function () { mostra(b.dataset.s); });
    b.addEventListener("keydown", function (e) {
      var k = e.key, n = null;
      if (k === "ArrowDown" || k === "ArrowRight") n = abas[(i + 1) % abas.length];
      if (k === "ArrowUp" || k === "ArrowLeft") n = abas[(i - 1 + abas.length) % abas.length];
      if (n) { e.preventDefault(); mostra(n.dataset.s, true); }
    });
  });
  mostra("kratky");

  /* ---------- Entradas por seção ---------- */
  var itens = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window && !reduz) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    itens.forEach(function (el) { io.observe(el); });
  } else { itens.forEach(function (el) { el.classList.add("in"); }); }

  /* ---------- Dúvidas: uma ficha aberta por vez ---------- */
  var fichas = [].slice.call(document.querySelectorAll(".ficha__q"));
  fichas.forEach(function (b) {
    b.addEventListener("click", function () {
      var abrir = b.getAttribute("aria-expanded") !== "true";
      fichas.forEach(function (o) { o.setAttribute("aria-expanded", "false"); document.getElementById(o.getAttribute("aria-controls")).hidden = true; });
      if (abrir) { b.setAttribute("aria-expanded", "true"); document.getElementById(b.getAttribute("aria-controls")).hidden = false; }
    });
  });

  /* ---------- Pop-up de saída (computador, uma vez por sessão) ---------- */
  var dlg = document.getElementById("saida");
  if (dlg && dlg.showModal && window.matchMedia("(pointer: fine)").matches) {
    var visto = false;
    try { visto = sessionStorage.getItem("pec-saida") === "1"; } catch (e) {}
    var podeMostrar = false;
    setTimeout(function () { podeMostrar = true; }, 12000);
    document.addEventListener("mouseout", function (e) {
      if (visto || !podeMostrar || e.relatedTarget || e.clientY > 8) return;
      visto = true;
      try { sessionStorage.setItem("pec-saida", "1"); } catch (er) {}
      dlg.showModal();
    });
    dlg.addEventListener("click", function (e) { if (e.target === dlg || e.target.hasAttribute("data-fechar")) dlg.close(); });
  }
})();
