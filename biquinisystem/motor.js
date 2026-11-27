/* Biquini System · motor de estatisticas
   Recebe os bytes da demo e o leitor (wasm_bindgen) e devolve o relatorio.
   Todos os numeros saem da demo. */
(function (raiz) {
  const TICK = 64, TRADE_SEG = 5;
  const MAPAS = { de_inferno: "Inferno", de_mirage: "Mirage", de_dust2: "Dust II", de_nuke: "Nuke", de_ancient: "Ancient", de_anubis: "Anubis", de_vertigo: "Vertigo", de_overpass: "Overpass", de_train: "Train", cs_office: "Office", cs_italy: "Italy" };
  const ARMAS = { ak47: "AK-47", m4a1: "M4A4", m4a1_silencer: "M4A1-S", awp: "AWP", deagle: "Desert Eagle", usp_silencer: "USP-S", glock: "Glock-18", hkp2000: "P2000", p250: "P250", galilar: "Galil AR", famas: "FAMAS", mp9: "MP9", mac10: "MAC-10", ssg08: "Scout", tec9: "Tec-9", fiveseven: "Five-SeveN", cz75a: "CZ75", ump45: "UMP-45", sg556: "SG 553", aug: "AUG", hegrenade: "HE", inferno: "Molotov", molotov: "Molotov", incgrenade: "Incendiária", taser: "Zeus", elite: "Dual Berettas", revolver: "R8", mp7: "MP7", p90: "P90", xm1014: "XM1014", nova: "Nova", mag7: "MAG-7", negev: "Negev", m249: "M249", bizon: "PP-Bizon", mp5sd: "MP5-SD", sawedoff: "Sawed-Off", g3sg1: "G3SG1", scar20: "SCAR-20", world: "Queda" };
  const MOTIVO = { ct_killed: "eliminação", t_killed: "eliminação", bomb_exploded: "bomba explodiu", bomb_defused: "bomba desarmada", target_saved: "tempo esgotado" };
  const UTIL = new Set(["hegrenade", "inferno", "molotov", "incgrenade"]);

  const obj = (x) => (x instanceof Map ? Object.fromEntries(x) : x);
  const sid = (x) => (x === null || x === undefined ? "" : String(x));
  const arma = (w) => { w = String(w || ""); if (w.includes("knife") || w.includes("bayonet")) return "Faca"; return ARMAS[w] || w.toUpperCase(); };
  const ladoTxt = (n) => (n === 2 ? "T" : n === 3 ? "CT" : "?");

  function lista(r) {
    if (Array.isArray(r)) return r.map(obj);
    if (r instanceof Map || (r && typeof r === "object")) {
      // formato "colunas" -> linhas
      const o = obj(r); const ks = Object.keys(o); const n = ks.length ? o[ks[0]].length : 0; const out = [];
      for (let i = 0; i < n; i++) { const l = {}; ks.forEach((k) => (l[k] = o[k][i])); out.push(l); }
      return out;
    }
    return [];
  }

  function gerar(bytes, P, avisar) {
    const ok = (m) => avisar && avisar(m);
    ok("Lendo o cabeçalho");
    const header = obj(P.parseHeader(bytes));
    ok("Lendo abates, dano e granadas");
    const nomesEv = ["player_death", "round_end", "round_freeze_end", "player_hurt", "player_blind", "bomb_planted", "flashbang_detonate", "smokegrenade_detonate", "hegrenade_detonate", "inferno_startburn"];
    const evs = lista(P.parseEvents(bytes, nomesEv, ["team_num"], ["total_rounds_played", "is_warmup_period"]));
    const por = {}; nomesEv.forEach((n) => (por[n] = []));
    evs.forEach((e) => { if (por[e.event_name]) por[e.event_name].push(e); });
    const byTick = (a, b) => a.tick - b.tick;
    const mortes = por.player_death.filter((m) => m.is_warmup_period !== true).sort(byTick);
    const fins = por.round_end.sort(byTick).filter((r) => r.winner !== null && r.winner !== undefined && String(r.winner) !== "");
    const congel = por.round_freeze_end.sort(byTick);
    if (!fins.length) throw new Error("Não achei rodadas nessa demo.");

    const nR = fins.length;
    const fimT = fins.map((r) => r.tick);
    const iniT = fimT.map((ft) => { let t = 0; for (const c of congel) if (c.tick < ft) t = c.tick; return t; });
    const rodDoTick = (t) => { let lo = 0, hi = nR; while (lo < hi) { const m = (lo + hi) >> 1; if (fimT[m] < t) lo = m + 1; else hi = m; } return lo < nR && t >= iniT[lo] - TICK * 20 ? lo : null; };

    ok("Montando os times de cada rodada");
    const ticksIni = lista(P.parseTicks(bytes, ["team_num", "is_alive", "name"], new Int32Array(iniT)));
    const ticksFim = lista(P.parseTicks(bytes, ["team_num", "is_alive"], new Int32Array(fimT)));
    const timeRod = iniT.map(() => ({})), nomes = {}, vivoFim = fimT.map(() => new Set());
    ticksIni.forEach((r) => { const i = iniT.indexOf(r.tick); const tn = Number(r.team_num); if (i < 0 || (tn !== 2 && tn !== 3)) return; const s = sid(r.steamid); timeRod[i][s] = tn; nomes[s] = r.name; });
    // varias rodadas podem ter o mesmo tick de inicio em demos quebradas: preenche pelo indice
    iniT.forEach((t, i) => { if (!Object.keys(timeRod[i]).length) ticksIni.filter((r) => r.tick === t).forEach((r) => { const tn = Number(r.team_num); if (tn === 2 || tn === 3) timeRod[i][sid(r.steamid)] = tn; }); });
    ticksFim.forEach((r) => { if (r.is_alive === true) fimT.forEach((t, i) => { if (t === r.tick) vivoFim[i].add(sid(r.steamid)); }); });

    const jog = Object.keys(timeRod[0]);
    Object.keys(nomes).forEach((s) => { if (!jog.includes(s)) jog.push(s); });
    // Equipe A = quem comecou de T. O lado de cada rodada vem da propria demo (vale para prorrogacao).
    const equipe = {}; jog.forEach((s) => (equipe[s] = timeRod[0][s] === 2 ? "A" : timeRod[0][s] === 3 ? "B" : null));
    const ladoA = timeRod.map((tr, i) => {
      const votos = { 2: 0, 3: 0 };
      Object.entries(tr).forEach(([s, t]) => { if (equipe[s] === "A") votos[t]++; else if (equipe[s] === "B") votos[5 - t]++; });
      return votos[2] || votos[3] ? (votos[2] >= votos[3] ? 2 : 3) : (i < 12 ? 2 : 3);
    });
    jog.forEach((s) => { if (!equipe[s]) { const i = timeRod.findIndex((t) => t[s] !== undefined); equipe[s] = i >= 0 && timeRod[i][s] === ladoA[i] ? "A" : "B"; } });
    const ladoEquipe = (eq, rod) => (eq === "A" ? ladoA[rod] : 5 - ladoA[rod]);

    const placar = { A: 0, B: 0 }, meio = { A: [0, 0, 0], B: [0, 0, 0] };
    const rodadas = fins.map((r, i) => {
      const w = String(r.winner).toUpperCase() === "T" || String(r.winner) === "2" ? 2 : 3;
      const eq = ladoEquipe("A", i) === w ? "A" : "B";
      placar[eq]++; meio[eq][i < 12 ? 0 : i < 24 ? 1 : 2]++;
      return { n: i + 1, vencedor: eq, lado_venc: ladoTxt(w), lado_A: ladoTxt(ladoEquipe("A", i)), motivo: MOTIVO[r.reason] || String(r.reason), placar: { ...placar }, clutch: null, abates: [], destaque: null };
    });

    const st = {}; const armasK = {}; const kast = {};
    jog.forEach((s) => { st[s] = {}; armasK[s] = {}; kast[s] = new Set(); });
    const inc = (s, k, v = 1) => { if (st[s]) st[s][k] = (st[s][k] || 0) + v; };
    const g = (s, k) => (st[s] && st[s][k]) || 0;

    ok("Calculando dano e utilitária");
    const danoRec = {};
    por.player_hurt.forEach((h) => {
      const a = sid(h.attacker_steamid), v = sid(h.user_steamid); const rod = rodDoTick(h.tick);
      if (rod === null || !st[a] || a === v) return; const tr = timeRod[rod];
      if (tr[a] !== undefined && tr[a] === tr[v]) return;
      const ch = rod + ":" + v; const d = Math.min(Number(h.dmg_health) || 0, 100 - (danoRec[ch] || 0)); if (d <= 0) return;
      danoRec[ch] = (danoRec[ch] || 0) + d; inc(a, "dano", d); if (UTIL.has(String(h.weapon))) inc(a, "dano_util", d);
    });
    por.player_blind.forEach((b) => {
      const a = sid(b.attacker_steamid), v = sid(b.user_steamid); if (!st[a] || a === v) return;
      if (Number(b.attacker_team_num) === Number(b.user_team_num)) inc(a, "cegou_aliado"); else { inc(a, "cegou"); inc(a, "seg_cegueira", Number(b.blind_duration) || 0); }
    });
    [["flashbang_detonate", "flashes"], ["smokegrenade_detonate", "smokes"], ["hegrenade_detonate", "hes"], ["inferno_startburn", "molotovs"], ["bomb_planted", "plantas"]].forEach(([e, c]) => por[e].forEach((x) => inc(sid(x.user_steamid), c)));

    ok("Achando aberturas, trades e clutches");
    const clutches = [];
    for (let rod = 0; rod < nR; rod++) {
      const mr = mortes.filter((m) => Number(m.total_rounds_played) === rod);
      const times = timeRod[rod];
      const vivos = { 2: new Set(), 3: new Set() }; Object.entries(times).forEach(([s, t]) => vivos[t].add(s));
      let primeira = true; const mortos = []; const kR = {}; const clR = {};
      for (const m of mr) {
        const a = sid(m.attacker_steamid), v = sid(m.user_steamid), ass = sid(m.assister_steamid);
        const tv = times[v], ta = times[a];
        if (st[v]) inc(v, "mortes");
        // morte antes do round comecar = sobra da rodada anterior (ex.: explosao da bomba). Nao entra no clutch.
        if (m.tick < iniT[rod]) continue;
        if (vivos[tv]) vivos[tv].delete(v);
        const valido = st[a] && a !== v && ta !== undefined && ta !== tv;
        if (valido) {
          inc(a, "abates"); kR[a] = (kR[a] || 0) + 1; kast[a].add(rod);
          const an = arma(m.weapon); armasK[a][an] = (armasK[a][an] || 0) + 1;
          if (m.headshot) inc(a, "hs"); if (Number(m.penetrated) > 0) inc(a, "wallbangs"); if (m.thrusmoke) inc(a, "pela_smoke"); if (m.noscope) inc(a, "noscope");
          rodadas[rod].abates.push({ t: Math.round(((m.tick - iniT[rod]) / TICK) * 10) / 10, k: nomes[a] || m.attacker_name, v: nomes[v] || m.user_name, eq: equipe[a], arma: an, hs: !!m.headshot, wb: Number(m.penetrated) > 0 });
          if (primeira) { inc(a, "ab_v"); if (st[v]) inc(v, "ab_d"); primeira = false; }
          for (let i = mortos.length - 1; i >= 0; i--) { const [tk, vit, mat] = mortos[i]; if (m.tick - tk > TRADE_SEG * TICK) break; if (mat === v && times[vit] === ta) { inc(a, "trades"); kast[vit] && kast[vit].add(rod); break; } }
        } else if (st[a] && a !== v && ta !== undefined && ta === tv) {
          inc(a, "tk");
        }
        if (st[ass] && times[ass] !== tv) { inc(ass, "assist"); kast[ass].add(rod); if (m.assistedflash) inc(ass, "assist_flash"); }
        mortos.push([m.tick, v, a]);
        for (const t of [2, 3]) { const o = 5 - t; if (vivos[t].size === 1 && vivos[o].size >= 1 && !clR[t]) { const s = [...vivos[t]][0]; clR[t] = { s, contra: vivos[o].size, tick: m.tick, k0: kR[s] || 0, aliados: Object.values(times).filter((x) => x === t).length, inimigos: Object.values(times).filter((x) => x === o).length }; } }
      }
      Object.keys(times).forEach((s) => { if (vivoFim[rod].has(s)) kast[s].add(rod); inc(s, "rodadas"); if ((kR[s] || 0) === 1) inc(s, "k1"); });
      Object.entries(kR).forEach(([s, k]) => { if (k >= 2) inc(s, "k" + Math.min(k, 5)); });
      const vl = rodadas[rod].lado_venc === "T" ? 2 : 3;
      for (const t of [2, 3]) {
        const c = clR[t]; if (!c) continue; const s = c.s; const ganhou = vl === t;
        const it = { rodada: rod + 1, jogador: nomes[s] || "?", steamid: s, equipe: equipe[s], lado: ladoTxt(t), contra: c.contra, ganhou, abates: (kR[s] || 0) - c.k0, sobreviveu: vivoFim[rod].has(s), motivo: rodadas[rod].motivo, placar: rodadas[rod].placar, aliados: c.aliados, inimigos: c.inimigos, tick: c.tick, seg: Math.round((c.tick - iniT[rod]) / TICK) };
        clutches.push(it); inc(s, "cl_t"); if (ganhou) inc(s, "cl_v");
        if (!rodadas[rod].clutch || ganhou) rodadas[rod].clutch = { jogador: it.jogador, contra: c.contra, ganhou, equipe: it.equipe };
      }
      const top = Object.keys(kR).sort((x, y) => kR[y] - kR[x])[0];
      if (top && kR[top] >= 3) rodadas[rod].destaque = { jogador: nomes[top], k: kR[top], equipe: equipe[top] };
    }

    const jogadores = jog.filter((s) => g(s, "rodadas") > 0).map((s) => {
      const R = Math.max(g(s, "rodadas"), 1), k = g(s, "abates"), d = g(s, "mortes");
      const kpr = k / R, spr = (R - d) / R, rmk = (g(s, "k1") + 4 * g(s, "k2") + 9 * g(s, "k3") + 16 * g(s, "k4") + 25 * g(s, "k5")) / R;
      const rating = (kpr / 0.679 + (0.7 * spr) / 0.317 + rmk / 1.277) / 2.7;
      const fav = Object.entries(armasK[s]).sort((x, y) => y[1] - x[1])[0] || ["-", 0];
      return {
        steamid: s, nome: nomes[s] || s, equipe: equipe[s], k, d, a: g(s, "assist"), rodadas: R,
        adr: Math.round((g(s, "dano") / R) * 10) / 10, hs: k ? Math.round((100 * g(s, "hs")) / k) : 0,
        kast: Math.round((100 * kast[s].size) / R), rating: Math.round(rating * 100) / 100, kd: d ? Math.round((k / d) * 100) / 100 : k,
        ab_v: g(s, "ab_v"), ab_d: g(s, "ab_d"), trades: g(s, "trades"),
        multi: { "2k": g(s, "k2"), "3k": g(s, "k3"), "4k": g(s, "k4"), "5k": g(s, "k5") },
        cl_t: g(s, "cl_t"), cl_v: g(s, "cl_v"), dano_util: Math.round(g(s, "dano_util")), cegou: g(s, "cegou"), cegou_aliado: g(s, "cegou_aliado"),
        seg_cegueira: Math.round(g(s, "seg_cegueira") * 10) / 10, assist_flash: g(s, "assist_flash"), flashes: g(s, "flashes"), smokes: g(s, "smokes"),
        hes: g(s, "hes"), molotovs: g(s, "molotovs"), plantas: g(s, "plantas"), wallbangs: g(s, "wallbangs"), pela_smoke: g(s, "pela_smoke"), tk: g(s, "tk"),
        arma_fav: fav[0], arma_fav_k: fav[1],
      };
    }).sort((x, y) => y.rating - x.rating);

    clutches.sort((x, y) => (y.ganhou - x.ganhou) || (y.contra - x.contra) || (x.rodada - y.rodada));
    return {
      versao: 1, mapa: MAPAS[header.map_name] || header.map_name, mapa_id: header.map_name,
      placar, meio, mvp: jogadores[0] && jogadores[0].steamid, jogadores, rodadas, clutches,
    };
  }

  raiz.BiquiniMotor = { gerar };
})(typeof self !== "undefined" ? self : globalThis);
