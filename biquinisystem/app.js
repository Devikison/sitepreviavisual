/* Biquini System | interface */
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const COR = { A: "var(--eqA)", B: "var(--eqB)" };
  const LADO = { T: "TR", CT: "CT" };
  const telas = ["entrada", "processando", "erro", "relatorio"];
  let REL = null;

  function mostrar(t) {
    telas.forEach((x) => ($("#" + x).hidden = x !== t));
    $("#btnNova").hidden = t === "entrada";
    window.scrollTo(0, 0);
  }

  // ---------------- entrada de arquivo ----------------
  const soltar = $("#soltar"), input = $("#arquivo");
  ["dragenter", "dragover"].forEach((e) => soltar.addEventListener(e, (ev) => { ev.preventDefault(); soltar.classList.add("ativo"); }));
  ["dragleave", "drop"].forEach((e) => soltar.addEventListener(e, (ev) => { ev.preventDefault(); soltar.classList.remove("ativo"); }));
  soltar.addEventListener("drop", (ev) => { const f = ev.dataTransfer.files[0]; if (f) abrir(f); });
  document.addEventListener("dragover", (ev) => ev.preventDefault());
  document.addEventListener("drop", (ev) => { ev.preventDefault(); if (!$("#entrada").hidden) return; const f = ev.dataTransfer.files[0]; if (f) abrir(f); });
  input.addEventListener("change", () => { if (input.files[0]) abrir(input.files[0]); input.value = ""; });
  $("#btnNova").addEventListener("click", () => mostrar("entrada"));
  $("#btnTentar").addEventListener("click", () => mostrar("entrada"));
  $("#btnExemplo").addEventListener("click", async () => {
    try { const r = await fetch("exemplo.json"); desenhar(await r.json()); } catch (e) { falhar("Não consegui abrir o exemplo agora."); }
  });
  $("#btnCopiar").addEventListener("click", async (ev) => {
    try { await navigator.clipboard.writeText($("#caminho").textContent.trim()); ev.currentTarget.lastChild.textContent = "Copiado"; } catch (e) { /* sem permissao */ }
  });
  $("#btnSalvar").addEventListener("click", () => {
    if (!REL) return;
    const nome = `biquini-${(REL.mapa || "partida").toLowerCase().replace(/\s+/g, "")}-${REL.placar.A}x${REL.placar.B}.json`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(REL)], { type: "application/json" }));
    a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  function falhar(msg) { $("#erroMsg").textContent = msg; mostrar("erro"); }

  const ETAPAS = ["Abrindo o arquivo", "Lendo o cabeçalho", "Lendo abates, dano e granadas", "Montando os times de cada rodada", "Calculando dano e utilitária", "Achando aberturas, trades e clutches"];
  async function abrir(f) {
    const nome = f.name.toLowerCase();
    if (nome.endsWith(".json")) {
      try { const d = JSON.parse(await f.text()); if (!d.jogadores || !d.rodadas) throw 0; desenhar(d); } catch (e) { falhar("Esse .json não é um relatório do Biquini System."); }
      return;
    }
    if (/\.(zip|gz|zst|bz2|rar|7z)$/.test(nome)) return falhar("Essa demo está compactada. Descompacte e mande o arquivo .dem.");
    if (!nome.endsWith(".dem")) return falhar("Mande um arquivo .dem (demo do CS2) ou um relatório .json salvo.");

    mostrar("processando");
    const passos = $("#passos"); passos.innerHTML = "";
    const t0 = performance.now();
    const marcar = (txt) => {
      const i = ETAPAS.indexOf(txt);
      $("#barra").style.width = Math.max(6, Math.round(((i + 1) / (ETAPAS.length + 1)) * 100)) + "%";
      $("#procTitulo").textContent = txt;
      passos.querySelectorAll("li i").forEach((x) => (x.className = "ph-bold ph-check"));
      const li = document.createElement("li"); li.innerHTML = `<i class="ph-bold ph-circle-notch" aria-hidden="true"></i>${esc(txt)}`; passos.appendChild(li);
    };
    marcar("Abrindo o arquivo");
    let buf;
    try { buf = await f.arrayBuffer(); } catch (e) { return falhar("O navegador não conseguiu abrir o arquivo. Ele pode ser grande demais para este aparelho."); }
    const w = new Worker("leitor.js");
    w.onmessage = (e) => {
      if (e.data.etapa) return marcar(e.data.etapa);
      w.terminate();
      if (e.data.erro) return falhar("O leitor não entendeu essa demo (" + e.data.erro + "). Confira se é uma demo de CS2 e se o arquivo baixou inteiro.");
      $("#barra").style.width = "100%";
      e.data.ok.lido_em = Math.round((performance.now() - t0) / 1000);
      desenhar(e.data.ok);
    };
    w.onerror = () => { w.terminate(); falhar("Faltou memória ou o leitor travou. Feche outras abas e tente de novo, de preferência no PC."); };
    w.postMessage({ buffer: buf }, [buf]);
  }

  // ---------------- analise (fichas) ----------------
  const METRICAS = [
    { id: "rating", v: (j) => j.rating, dado: (j) => `Rating ${j.rating.toFixed(2)}`, ap: "O Mandante",
      bom: ["Jogou acima da lobby", "Rating de quem estava num nível diferente do resto."], mau: ["Rating no vermelho", "Os números dizem que a partida foi pesada."] },
    { id: "adr", v: (j) => j.adr, dado: (j) => `ADR ${j.adr} (dano médio por round)`, ap: "O Moedor",
      bom: ["Dano em todo round", "Ninguém saía de perto dele com a vida cheia."], mau: ["Tiro de festim", "Atirava mais para assustar do que para machucar."] },
    { id: "kast", v: (j) => j.kast, dado: (j) => `KAST ${j.kast}% (rounds com kill, assistência, sobrevivência ou trade)`, ap: "O Constante",
      bom: ["Presente em quase todo round", "Sempre fazia alguma coisa que contava para o time."], mau: ["Sumia em vários rounds", "Muita rodada sem kill, sem assistência e sem sair vivo."] },
    { id: "hs", v: (j) => j.hs, ok: (j) => j.k >= 8, dado: (j) => `${j.hs}% das kills com headshot`, ap: "O Cirurgião",
      bom: ["Mira na altura da cabeça", "Quando acertava, era no capacete."], mau: ["Mira no peito", "O boneco tem cabeça, mas a mira não sabia."] },
    { id: "abertura", v: (j) => j.ab_v - j.ab_d, ok: (j) => j.ab_v + j.ab_d >= 2, dado: (j) => `${j.ab_v} duelos de abertura ganhos, ${j.ab_d} perdidos`, ap: "A Porta de Entrada",
      bom: ["Ganha o primeiro duelo", "Abria o round já com vantagem para o time."], mau: ["Primeiro a cair", "Morria no começo e deixava o time num 4v5."] },
    { id: "clutch", v: (j) => j.cl_v * 10 - (j.cl_t - j.cl_v), okBom: (j) => j.cl_v >= 1, okMau: (j) => j.cl_t >= 2 && j.cl_v === 0, dado: (j) => `${j.cl_v} de ${j.cl_t} situações de 1vX convertidas`, ap: "O Sobrevivente",
      bom: ["Resolve sozinho", "Quando sobrava sozinho, o problema era do inimigo."], mau: ["Clutch só no nome", "Ficou sozinho várias vezes e não converteu nenhuma."] },
    { id: "trades", v: (j) => j.trades, dado: (j) => `${j.trades} trades (vingou um aliado em até 5 s)`, ap: "O Vingador",
      bom: ["Vinga o parceiro na hora", "Amigo caiu, ele ia lá buscar em seguida."], mau: ["Viu e deixou", "O companheiro morria e a vingança não vinha."] },
    { id: "util", v: (j) => j.dano_util, dado: (j) => `${j.dano_util} de dano com HE e molotov`, ap: "O Granadeiro",
      bom: ["Granada com endereço", "HE e molotov caíam onde tinha gente."], mau: ["HE de festa junina", "Granada jogada só para fazer barulho."] },
    { id: "cegou", v: (j) => j.cegou, dado: (j) => `${j.cegou} inimigos cegos, ${j.seg_cegueira} s de cegueira no total`, ap: "O Farol",
      bom: ["Flash que mostra a luz", "Cegava exatamente quem precisava cegar."], mau: ["Flash de enfeite", "As flashes quase nunca pegavam o outro time."] },
    { id: "teamflash", v: (j) => -j.cegou_aliado, okBom: (j) => j.cegou >= 8, okMau: (j) => j.cegou_aliado >= 5, dado: (j) => `${j.cegou_aliado} aliados cegos pela própria flash`, ap: "O Educado",
      bom: ["Flash limpa", "Cegava o inimigo sem levar o time junto."], mau: ["Flash com brinde", "Cegava o inimigo e o time ganhava um pouco de luz também."] },
    { id: "multi", v: (j) => j.multi["3k"] + 2 * j.multi["4k"] + 3 * j.multi["5k"], okBom: (j) => j.multi["3k"] + j.multi["4k"] + j.multi["5k"] >= 1, okMau: (j) => j.multi["3k"] + j.multi["4k"] + j.multi["5k"] === 0,
      dado: (j) => { const n = j.multi["3k"] + j.multi["4k"] + j.multi["5k"]; return n ? `${n} round${n > 1 ? "s" : ""} com 3 kills ou mais` + (j.multi["5k"] ? `, ${j.multi["5k"]} ace` : j.multi["4k"] ? `, ${j.multi["4k"]} de 4 kills` : "") : "Nenhum round com 3 kills ou mais"; }, ap: "O Faxineiro",
      bom: ["Faxina em série", "Limpou meio time sozinho mais de uma vez."], mau: ["Uma kill por vez", "Não teve aquele round de limpar o bomb sozinho."] },
    { id: "vivo", v: (j) => -j.d / j.rodadas, dado: (j) => `${j.d} mortes em ${j.rodadas} rounds`, ap: "O Imortal",
      bom: ["Difícil de matar", "Saía vivo de round que ninguém saía."], mau: ["Alvo fácil", "Morria em quase todo round."] },
  ];

  function analisar(rel) {
    const J = rel.jogadores, n = J.length;
    const ranks = {};
    METRICAS.forEach((m) => {
      const ord = [...J].sort((a, b) => m.v(b) - m.v(a));
      ord.forEach((j, i) => { (ranks[j.steamid] ||= {})[m.id] = ord.findIndex((x) => m.v(x) === m.v(j)) + 1; });
    });
    const porRating = [...J].sort((a, b) => b.rating - a.rating);
    const out = {};
    J.forEach((j) => {
      const r = ranks[j.steamid];
      const okB = (m) => (m.ok ? m.ok(j) : true) && (m.okBom ? m.okBom(j) : true);
      const okM = (m) => (m.ok ? m.ok(j) : true) && (m.okMau ? m.okMau(j) : true);
      let fortes = METRICAS.filter((m) => okB(m) && r[m.id] <= 3).sort((a, b) => r[a.id] - r[b.id]);
      if (fortes.length < 2) fortes = METRICAS.filter(okB).sort((a, b) => r[a.id] - r[b.id]).slice(0, 2);
      fortes = fortes.slice(0, 3);
      let fracos = METRICAS.filter((m) => okM(m) && r[m.id] >= n - 2 && !fortes.includes(m)).sort((a, b) => r[b.id] - r[a.id]);
      if (fracos.length < 1) fracos = METRICAS.filter((m) => okM(m) && !fortes.includes(m)).sort((a, b) => r[b.id] - r[a.id]).slice(0, 1);
      fracos = fracos.slice(0, 3);
      const pos = porRating.findIndex((x) => x.steamid === j.steamid) + 1;
      const ver = pos === 1 ? ["MVP", "Melhor rating da partida", "var(--acento)"]
        : pos <= 3 ? ["Carregou", `${pos}º melhor rating da partida`, "var(--acento)"]
        : pos <= n - 3 ? ["Na média", `${pos}º de ${n} no rating`, "var(--texto2)"]
        : pos < n ? ["Ficou devendo", `${pos}º de ${n} no rating`, "var(--ruim)"]
        : ["Paga o lanche", "Pior rating da partida", "var(--ruim)"];
      out[j.steamid] = { fortes, fracos, apelido: fortes[0] ? fortes[0].ap : "O Discreto", veredito: ver, pos };
    });
    return out;
  }

  // ---------------- desenho ----------------
  let ANALISE = {}, abaAtual = "tabela", fichaAtual = null, rodAtual = 1, filtro = "todos";

  function desenhar(rel) {
    REL = rel; ANALISE = analisar(rel); fichaAtual = rel.mvp || rel.jogadores[0].steamid; rodAtual = 1; filtro = "todos";
    desenharPlacar(); desenharTabela(); desenharClutches(); desenharFichas(); desenharRodadas();
    trocarAba("tabela");
    mostrar("relatorio");
  }

  const eqJog = (eq) => REL.jogadores.filter((j) => j.equipe === eq);
  const ladoInicial = (eq) => { const r = REL.rodadas[0]; const a = r.lado_A || "T"; return eq === "A" ? a : a === "T" ? "CT" : "T"; };

  function desenharPlacar() {
    const { A, B } = REL.placar; const m = REL.meio || { A: [], B: [] };
    const mvp = REL.jogadores.find((j) => j.steamid === REL.mvp);
    const res = A === B ? "Empate" : `Vitória da Equipe ${A > B ? "A" : "B"}`;
    const tempos = [["1º tempo", 0], ["2º tempo", 1], ["Prorrogação", 2]].filter(([, i]) => (m.A[i] || 0) + (m.B[i] || 0) > 0)
      .map(([t, i]) => `<span class="selo">${t} <b class="num">${m.A[i] || 0} x ${m.B[i] || 0}</b></span>`).join("");
    const eq = (e) => `<div class="equipe equipe--${e}">
        <div class="equipe__nome"><span class="equipe__cor chanfro" style="background:${COR[e]}"></span>Equipe ${e}</div>
        <div class="equipe__lado">começou de ${LADO[ladoInicial(e)]}</div>
        <div class="equipe__jog">${eqJog(e).map((j) => esc(j.nome)).join(", ")}</div></div>`;
    $("#placar").innerHTML = `
      <div class="placar__mapa"><h2>${esc(REL.mapa)}</h2><span>${REL.rodadas.length} rounds</span><span>${REL.clutches.length} situações de clutch</span></div>
      ${eq("A")}
      <div class="placar__num" aria-label="Placar ${A} a ${B}"><span class="${A >= B ? "ganhou" : "perdeu"}">${A}</span><span class="x">x</span><span class="${B >= A ? "ganhou" : "perdeu"}">${B}</span></div>
      ${eq("B")}
      <div class="placar__res"><span class="selo selo--acento"><b>${res}</b></span>${tempos}${mvp ? `<span class="selo">MVP <b>${esc(mvp.nome)}</b></span>` : ""}</div>`;
  }

  const nota = (v, bom, mau) => (v >= bom ? "bom" : v <= mau ? "mau" : "");
  function desenharTabela() {
    const linha = (j) => { const s = j.k - j.d; return `<tr>
      <td>${esc(j.nome)}${j.steamid === REL.mvp ? '<span class="mvp-tag">MVP</span>' : ""}</td>
      <td class="${nota(j.rating, 1.15, 0.85)}">${j.rating.toFixed(2)}</td>
      <td>${j.k}</td><td>${j.d}</td><td>${j.a}</td>
      <td class="${s > 0 ? "bom pos" : s < 0 ? "mau" : ""}">${s}</td>
      <td class="${nota(j.adr, 90, 60)}">${Math.round(j.adr)}</td>
      <td class="${nota(j.kast, 78, 62)}">${j.kast}%</td>
      <td>${j.hs}%</td>
      <td>${j.ab_v} / ${j.ab_d}</td>
      <td>${j.cl_v} / ${j.cl_t}</td>
      <td>${j.multi["3k"] + j.multi["4k"] + j.multi["5k"]}</td></tr>`; };
    const tab = (e) => `<div class="tabela-wrap"><div class="tabela__eq" style="color:${COR[e]}">Equipe ${e} <span style="color:var(--texto3)">${REL.placar[e]} rounds</span></div>
      <table><thead><tr><th>Jogador</th><th title="Rating HLTV 1.0">Rating</th><th>K</th><th>D</th><th>A</th><th>+/-</th><th title="Dano médio por round">ADR</th><th title="Rounds com kill, assistência, sobrevivência ou trade">KAST</th><th>HS</th><th title="Duelos de abertura ganhos / perdidos">Aberturas</th><th title="Clutches convertidos / tentados">Clutch</th><th title="Rounds com 3 kills ou mais">3K+</th></tr></thead>
      <tbody>${eqJog(e).sort((a, b) => b.rating - a.rating).map(linha).join("")}</tbody></table></div>`;

    const J = REL.jogadores; const top = (f, ok = () => true) => [...J].filter(ok).sort((a, b) => f(b) - f(a))[0];
    const premios = [
      ["ph-sword", "Mais dano", top((j) => j.adr), (j) => `ADR ${Math.round(j.adr)}`],
      ["ph-door-open", "Rei da abertura", top((j) => j.ab_v), (j) => `${j.ab_v} duelos de abertura ganhos`],
      ["ph-user-focus", "Clutch master", top((j) => j.cl_v * 100 - j.cl_t), (j) => `${j.cl_v} de ${j.cl_t} clutches convertidos`],
      ["ph-crosshair", "Mira de laboratório", top((j) => j.hs, (j) => j.k >= 10), (j) => `${j.hs}% de headshot em ${j.k} kills`],
      ["ph-fire", "Granadeiro", top((j) => j.dano_util), (j) => `${j.dano_util} de dano com granada`],
      ["ph-lightbulb", "O farol", top((j) => j.cegou), (j) => `${j.cegou} inimigos cegos`],
      ["ph-handshake", "Vingador", top((j) => j.trades), (j) => `${j.trades} trades`],
      ["ph-eye-slash", "Flash com brinde", top((j) => j.cegou_aliado), (j) => `${j.cegou_aliado} aliados cegos`],
    ].filter((p) => p[2]);
    $("#aba-tabela").innerHTML = `<div class="bloco">${tab("A")}${tab("B")}
      <p class="painel__sub">Verde é número bom, vermelho é número fraco. Passe o mouse no título da coluna para ver o que ela mede.</p></div>
      <div class="bloco"><h3>Destaques da partida</h3><p class="painel__sub">Quem liderou cada quesito, contando os dois times.</p>
      <div class="premios">${premios.map(([ic, t, j, f]) => `<div class="premio"><i class="ph-bold ${ic}" aria-hidden="true"></i>
        <span class="premio__titulo">${t}</span><span class="premio__nome" style="color:${COR[j.equipe]}">${esc(j.nome)}</span><span class="premio__val">${f(j)}</span></div>`).join("")}</div></div>`;
  }

  function pips(total, vivos, cor) { let h = ""; for (let i = 0; i < total; i++) h += `<i class="${i < vivos ? "" : "morto"}"></i>`; return `<span class="vivos__lado" style="--cor:${cor}">${h}</span>`; }

  function desenharClutches() {
    const C = REL.clutches;
    const ganhos = C.filter((c) => c.ganhou).length, grandes = C.filter((c) => c.contra >= 2).length, grandesG = C.filter((c) => c.contra >= 2 && c.ganhou).length;
    const lista = C.filter((c) => filtro === "todos" || (filtro === "vitorias" && c.ganhou) || (filtro === "grandes" && c.contra >= 2) || filtro === c.steamid);
    const nomes = [...new Map(C.map((c) => [c.steamid, c])).values()].sort((a, b) => a.jogador.localeCompare(b.jogador));
    const chip = (id, txt, cor) => `<button class="chip" data-filtro="${esc(id)}" aria-pressed="${filtro === id}">${cor ? `<span class="ponto" style="background:${cor}"></span>` : ""}${esc(txt)}</button>`;
    $("#aba-clutches").innerHTML = `
      <div class="resumo-num">
        <div><span class="num">${C.length}</span><span>vezes que alguém ficou sozinho</span></div>
        <div><span class="num bom">${ganhos}</span><span>clutches convertidos</span></div>
        <div><span class="num">${grandesG}<span style="color:var(--texto3)"> / ${grandes}</span></span><span>1v2 ou maior ganhos</span></div>
      </div>
      <div class="filtros" role="group" aria-label="Filtrar clutches">${chip("todos", "Todos")}${chip("vitorias", "Só os ganhos")}${chip("grandes", "1v2 ou maior")}${nomes.map((c) => chip(c.steamid, c.jogador, COR[c.equipe])).join("")}</div>
      <div class="clutches">${lista.length ? lista.map((c) => `
        <article class="clutch entra" style="--cor:${COR[c.equipe]}">
          <div class="clutch__x">1v${c.contra}</div>
          <div>
            <div class="clutch__quem" style="color:${COR[c.equipe]}">${esc(c.jogador)}</div>
            <div class="clutch__info">Rodada ${c.rodada}, lado ${LADO[c.lado] || c.lado}. ${c.abates === 0 ? "Nenhuma kill" : c.abates === 1 ? "1 kill" : c.abates + " kills"} no clutch${c.sobreviveu ? ", saiu vivo" : ""}. Final do round: ${esc(c.motivo)}.</div>
            <div class="vivos" aria-label="1 vivo contra ${c.contra}">${pips(c.aliados || 5, 1, COR[c.equipe])}<span class="vivos__vs">VS</span>${pips(c.inimigos || 5, c.contra, COR[c.equipe === "A" ? "B" : "A"])}</div>
          </div>
          <div class="clutch__res ${c.ganhou ? "clutch__res--v" : "clutch__res--d"}">${c.ganhou ? "Ganhou" : "Perdeu"}</div>
        </article>`).join("") : `<p class="vazio">Nenhum clutch com esse filtro.</p>`}</div>`;
    $("#aba-clutches").querySelectorAll("[data-filtro]").forEach((b) => b.addEventListener("click", () => { filtro = b.dataset.filtro; desenharClutches(); }));
  }

  function desenharFichas() {
    const j = REL.jogadores.find((x) => x.steamid === fichaAtual) || REL.jogadores[0];
    const a = ANALISE[j.steamid];
    const ord = [...eqJog("A"), ...eqJog("B")];
    const item = (m) => `<li><div class="itens__titulo">${m[a.fortes.includes(m) ? "bom" : "mau"][0]}</div><span class="itens__dado">${m.dado(j)}</span><p class="itens__frase">${m[a.fortes.includes(m) ? "bom" : "mau"][1]}</p></li>`;
    $("#aba-fichas").innerHTML = `
      <div class="seletor" role="group" aria-label="Escolher jogador">${ord.map((x) => `<button class="chip" data-jog="${esc(x.steamid)}" aria-pressed="${x.steamid === j.steamid}"><span class="ponto" style="background:${COR[x.equipe]}"></span>${esc(x.nome)}</button>`).join("")}</div>
      <article class="ficha entra">
        <div class="ficha__lado">
          <div><h2 class="ficha__nome" style="color:${COR[j.equipe]}">${esc(j.nome)}</h2>
          <div class="ficha__apelido">Equipe ${j.equipe}, vulgo <b>${a.apelido}</b></div></div>
          <div class="veredito" style="--cor:${a.veredito[2]}"><b>${a.veredito[0]}</b><span>${a.veredito[1]}</span></div>
          <dl class="stats">
            <div><dt>K / D / A</dt><dd>${j.k} / ${j.d} / ${j.a}</dd></div>
            <div><dt>Rating</dt><dd class="${nota(j.rating, 1.15, 0.85)}">${j.rating.toFixed(2)}</dd></div>
            <div><dt>ADR</dt><dd>${Math.round(j.adr)}</dd></div>
            <div><dt>KAST</dt><dd>${j.kast}%</dd></div>
            <div><dt>Headshot</dt><dd>${j.hs}%</dd></div>
            <div><dt>Clutches</dt><dd>${j.cl_v} <small>de ${j.cl_t}</small></dd></div>
            <div><dt>Granadas</dt><dd>${j.flashes + j.smokes + j.hes + j.molotovs} <small>jogadas</small></dd></div>
            <div><dt>Arma favorita</dt><dd style="font-size:18px">${esc(j.arma_fav)} <small>${j.arma_fav_k} kills</small></dd></div>
          </dl>
        </div>
        <div class="ficha__colunas">
          <div><div class="lista-h lista-h--bom"><i class="ph-bold ph-thumbs-up" aria-hidden="true"></i>A favor</div><ul class="itens">${a.fortes.map(item).join("")}</ul></div>
          <div><div class="lista-h lista-h--mau"><i class="ph-bold ph-thumbs-down" aria-hidden="true"></i>Contra</div><ul class="itens">${a.fracos.map(item).join("")}</ul></div>
          <p class="ficha__frase"><span>Resumo</span>${esc(j.nome)} fez ${j.k} kills e morreu ${j.d} vezes em ${j.rodadas} rounds, com ${Math.round(j.adr)} de dano médio. ${j.multi["5k"] ? `Teve ${j.multi["5k"]} ace. ` : j.multi["4k"] ? `Teve ${j.multi["4k"]} round de 4 kills. ` : ""}${j.ab_v > j.ab_d ? "Ganhou mais aberturas do que perdeu." : j.ab_v < j.ab_d ? "Perdeu mais aberturas do que ganhou." : ""}</p>
        </div>
      </article>`;
    $("#aba-fichas").querySelectorAll("[data-jog]").forEach((b) => b.addEventListener("click", () => { fichaAtual = b.dataset.jog; desenharFichas(); }));
  }

  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  function desenharRodadas() {
    const R = REL.rodadas; const r = R[rodAtual - 1];
    const celula = (x) => `<button class="rod rod--${x.vencedor}${x.n === 13 || x.n === 25 ? " meio" : ""}" style="--cor:${COR[x.vencedor]}" data-rod="${x.n}" aria-pressed="${x.n === rodAtual}" aria-label="Rodada ${x.n}, Equipe ${x.vencedor}">
        <span>${x.n}</span>${x.clutch && x.clutch.ganhou ? '<i class="ph-bold ph-user-focus" aria-hidden="true"></i>' : x.destaque ? '<i class="ph-bold ph-fire" aria-hidden="true"></i>' : "<span></span>"}</button>`;
    const ladoV = r.vencedor === "A" ? r.lado_A : r.lado_A === "T" ? "CT" : "T";
    $("#aba-rodadas").innerHTML = `
      <div class="linha-rod" style="--n:${R.length}">${R.map(celula).join("")}</div>
      <div class="legenda"><span><i class="ponto" style="background:var(--eqA)"></i>Equipe A venceu (faixa em cima)</span><span><i class="ponto" style="background:var(--eqB)"></i>Equipe B venceu (faixa embaixo)</span><span><i class="ph-bold ph-user-focus" style="color:var(--acento)"></i>clutch ganho</span><span><i class="ph-bold ph-fire" style="color:var(--acento)"></i>alguém fez 3 kills ou mais</span></div>
      <div class="rodada-det entra">
        <div class="rodada-det__topo"><h3>Rodada ${r.n}</h3>
          <p><b style="color:${COR[r.vencedor]}">Equipe ${r.vencedor}</b> venceu de ${LADO[ladoV]}, ${esc(r.motivo)}. Placar: <b class="num">${r.placar.A} x ${r.placar.B}</b></p></div>
        ${r.clutch ? `<p class="painel__sub">Clutch: ${esc(r.clutch.jogador)} ficou num 1v${r.clutch.contra} e ${r.clutch.ganhou ? "ganhou" : "perdeu"}.</p>` : ""}
        <ul class="feed">${r.abates.length ? r.abates.map((k) => `<li><span class="feed__t">${mmss(Math.max(0, k.t))}</span>
          <span><span class="feed__k" style="color:${COR[k.eq]}">${esc(k.k)}</span><span class="feed__arma">${esc(k.arma)}</span>${esc(k.v)}${k.hs ? '<span class="feed__tag">HS</span>' : ""}${k.wb ? '<span class="feed__tag">PAREDE</span>' : ""}</span></li>`).join("") : '<li><span></span><span class="feed__arma">Ninguém morreu nesse round.</span></li>'}</ul>
      </div>`;
    $("#aba-rodadas").querySelectorAll("[data-rod]").forEach((b) => b.addEventListener("click", () => { rodAtual = +b.dataset.rod; desenharRodadas(); }));
  }

  function trocarAba(id) {
    abaAtual = id;
    document.querySelectorAll(".aba").forEach((b) => b.setAttribute("aria-selected", b.dataset.aba === id));
    ["tabela", "clutches", "fichas", "rodadas"].forEach((x) => ($("#aba-" + x).hidden = x !== id));
  }
  document.querySelectorAll(".aba").forEach((b) => b.addEventListener("click", () => {
    trocarAba(b.dataset.aba);
    const top = $(".abas").getBoundingClientRect().top + window.scrollY - 70;
    if (window.scrollY > top) window.scrollTo({ top });
  }));
})();
