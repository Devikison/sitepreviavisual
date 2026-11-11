/* Kazê: recursos comuns a todas as páginas (site, link da bio e páginas legais)
   1. Aviso de cookies com consentimento (LGPD): nada de medição antes do "Aceitar"
   2. Google Tag Manager só carrega com consentimento e com o ID preenchido
   3. Rolagem suave da roda do mouse, sutil, sem biblioteca */
(() => {
  const KEY = 'kaze_cookies_v1';
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.dataLayer = window.dataLayer || [];

  /* ── 1 e 2. Consentimento ── */
  const read = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const save = (v) => { try { localStorage.setItem(KEY, JSON.stringify({ escolha: v, data: new Date().toISOString() })); } catch (e) {} };

  let gtmOn = false;
  const loadGTM = () => {
    const id = window.KAZE_GTM;
    if (gtmOn || !id) return;
    gtmOn = true;
    dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const s = document.createElement('script');
    s.async = true; s.src = 'https://www.googletagmanager.com/gtm.js?id=' + encodeURIComponent(id);
    document.head.appendChild(s);
  };
  const apply = (v) => {
    dataLayer.push({ event: 'consentimento', cookies_medicao: v === 'todos' ? 'sim' : 'nao' });
    if (v === 'todos') loadGTM();
  };

  const banner = document.createElement('div');
  banner.className = 'ck';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-label', 'Aviso de cookies');
  banner.hidden = true;
  banner.innerHTML =
    '<p class="ck__t">Sua privacidade</p>' +
    '<p class="ck__p">Usamos cookies essenciais para o site funcionar. Com a sua permissão, também usamos cookies de medição para entender as visitas e melhorar o atendimento. Saiba mais na <a href="/kazecortinas/politica-de-cookies/">Política de Cookies</a>.</p>' +
    '<div class="ck__b"><button type="button" class="ck__ok" data-ck="todos">Aceitar</button><button type="button" class="ck__no" data-ck="essenciais">Somente essenciais</button></div>';

  const open = () => { banner.hidden = false; requestAnimationFrame(() => banner.classList.add('is-on')); };
  const close = () => { banner.classList.remove('is-on'); setTimeout(() => { banner.hidden = true; }, 500); };

  document.addEventListener('DOMContentLoaded', () => {
    document.body.appendChild(banner);
    const c = read();
    if (c && c.escolha) apply(c.escolha); else setTimeout(open, 900);
    banner.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ck]');
      if (!b) return;
      save(b.dataset.ck); apply(b.dataset.ck); close();
    });
    document.querySelectorAll('[data-cookies]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); open(); }));
  });

  /* ── 3. Rolagem suave da roda do mouse ──
     Desliza com inércia leve. Solta o controle ao pegar a barra lateral,
     usar o teclado, tocar na tela ou clicar. Desligada em "reduzir movimento". */
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine || still) return;
  const root = document.documentElement;
  /* Mola amortecida (sem quique): parte de velocidade zero, acelera de leve e
     assenta devagar. Calculada pelo tempo real, então é igual em 60 Hz e 144 Hz. */
  const W = 8.6;           /* firmeza da mola: menor = mais lento e mais "flutuante" */
  const STEP_MAX = 160;     /* limite por clique da roda, evita saltos bruscos */
  let target = scrollY, cur = scrollY, vel = 0, running = false, last = 0, mine = -1;
  const maxY = () => root.scrollHeight - innerHeight;
  const loop = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    /* integra em passos pequenos para ficar estável */
    let rest = dt;
    while (rest > 0) {
      const h = Math.min(rest, 0.008); rest -= h;
      const acc = -2 * W * vel - W * W * (cur - target);
      vel += acc * h; cur += vel * h;
    }
    if (Math.abs(target - cur) < 0.4 && Math.abs(vel) < 4) { cur = target; vel = 0; running = false; }
    mine = Math.round(cur);
    window.scrollTo({ top: cur, behavior: 'instant' });
    if (running) requestAnimationFrame(loop);
  };
  const free = () => { running = false; vel = 0; target = cur = scrollY; };
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const t = e.target;
    if (t && t.closest && t.closest('dialog[open], .menu.is-open, iframe, .ck, [data-own-scroll]')) return;
    e.preventDefault();
    let d = e.deltaMode === 1 ? e.deltaY * 36 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    d = Math.max(-STEP_MAX, Math.min(STEP_MAX, d));
    if (!running) { cur = target = scrollY; vel = 0; }
    target = Math.max(0, Math.min(maxY(), target + d * 1.1));
    if (!running) { running = true; last = performance.now(); requestAnimationFrame(loop); }
  }, { passive: false });
  /* se a página rolar por outro motivo (âncora, barra lateral, teclado), segue a posição real */
  addEventListener('scroll', () => { if (!running && Math.abs(scrollY - mine) > 2) { target = cur = scrollY; vel = 0; } }, { passive: true });
  addEventListener('pointerdown', free, { passive: true });
  addEventListener('keydown', free);
  addEventListener('touchstart', free, { passive: true });
})();
