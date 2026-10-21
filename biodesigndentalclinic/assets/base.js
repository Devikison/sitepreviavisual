/* Base JS — site/bio de luxo. Sem dependências (Lenis opcional via CDN:
   <script src="https://unpkg.com/lenis@1.1.13/dist/lenis.min.js"></script>).
   Uso: copiar para o <script> do fim do body e chamar Base.init(). */
const Base = (() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const headerH = () => (document.querySelector('[data-header]')?.offsetHeight || 0) + 12;
  let lenis = null;

  /* Smooth scroll: Lenis só no desktop com mouse; touch usa scroll nativo */
  function initSmoothScroll() {
    if (finePointer && !reduced && window.Lenis) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { offset: -headerH() });
      else window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - headerH(), behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* Header: vira glass ao rolar; esconde ao descer, mostra ao subir */
  function initHeader() {
    const h = document.querySelector('[data-header]');
    if (!h) return;
    let last = scrollY;
    const onScroll = () => {
      const y = scrollY;
      h.classList.toggle('is-scrolled', y > 24);
      h.classList.toggle('is-hidden', y > last && y > 320 && !document.body.classList.contains('menu-open'));
      last = y;
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* Menu mobile */
  function closeMenu() {
    document.body.classList.remove('menu-open');
    document.querySelector('[data-menu-toggle]')?.setAttribute('aria-expanded', 'false');
    lenis?.start();
  }
  function initMenu() {
    const btn = document.querySelector('[data-menu-toggle]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const open = !document.body.classList.contains('menu-open');
      document.body.classList.toggle('menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      open ? lenis?.stop() : lenis?.start();
    });
    addEventListener('keydown', e => e.key === 'Escape' && closeMenu());
    matchMedia('(min-width: 960px)').addEventListener('change', closeMenu);
  }

  /* Revelação no scroll (uma vez). Elementos: [data-reveal], stagger via --i */
  function initReveal() {
    const els = document.querySelectorAll('[data-reveal]');
    if (reduced || !('IntersectionObserver' in window)) { els.forEach(el => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  /* Tilt 3D sutil: [data-tilt], só mouse */
  function initTilt() {
    if (!finePointer || reduced) return;
    document.querySelectorAll('[data-tilt]').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--rx', `${(-y * 5).toFixed(2)}deg`);
        el.style.setProperty('--ry', `${(x * 6).toFixed(2)}deg`);
        el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`);
      });
      el.addEventListener('pointerleave', () => { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); });
    });
  }

  /* Carrossel contínuo infinito, arrastável (mouse + touch) com inércia.
     HTML: <div class="marquee" data-marquee data-speed="38"><div class="marquee__track"> ...itens... </div></div>
     data-direction="-1" inverte o sentido. */
  function initMarquee(root) {
    const track = root.querySelector('.marquee__track');
    const originals = [...track.children];
    const speed = (reduced ? 0 : Number(root.dataset.speed || 38)) * Number(root.dataset.direction || 1); // px/s
    let setW = 0, x = 0, v = 0, dragging = false, hovering = false, visible = true;
    let startX = 0, startPos = 0, moved = 0, lastX = 0, lastT = 0, pid = null, last = performance.now();

    function build() {
      track.querySelectorAll('[data-clone]').forEach(n => n.remove());
      // repete o conjunto até cobrir 1x a largura visível, depois duplica (2 conjuntos = loop sem buraco)
      let reps = 0;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const measure = () => [...track.children].reduce((w, n) => w + n.getBoundingClientRect().width + gap, 0);
      while (measure() < root.clientWidth && reps++ < 10) originals.forEach(n => track.appendChild(clone(n)));
      setW = measure();                                   // largura de 1 conjunto (com o gap final)
      [...track.children].forEach(n => track.appendChild(clone(n, true)));
    }
    function clone(n, hide) {
      const c = n.cloneNode(true);
      c.setAttribute('data-clone', '');
      if (hide) { c.setAttribute('aria-hidden', 'true'); c.querySelectorAll('a,button').forEach(f => f.tabIndex = -1); }
      return c;
    }
    const wrap = val => ((val % setW) + setW) % setW;

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!dragging && visible) {
        if (Math.abs(v) > 4) { x += v * dt; v *= Math.pow(0.04, dt); }   // inércia após soltar
        else { v = 0; if (!hovering) x += speed * dt; }
      }
      track.style.transform = `translate3d(${-wrap(x)}px,0,0)`;
      requestAnimationFrame(frame);
    }

    root.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      dragging = true; moved = 0; v = 0; pid = e.pointerId;
      startX = lastX = e.clientX; startPos = x; lastT = performance.now();
      root.classList.add('is-dragging');
    });
    root.addEventListener('pointermove', e => {
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4 && !root.hasPointerCapture(pid)) root.setPointerCapture(pid);
      x = startPos - dx;
      const t = performance.now(), dtm = (t - lastT) / 1000;
      if (dtm > 0) v = 0.8 * (-(e.clientX - lastX) / dtm) + 0.2 * v;
      lastX = e.clientX; lastT = t;
    });
    const end = e => {
      if (!dragging || (e && e.pointerId !== pid)) return;
      dragging = false; root.classList.remove('is-dragging');
      if (performance.now() - lastT > 80) v = 0;                         // segurou parado: sem arremesso
      v = Math.max(-2600, Math.min(2600, v));
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', end);                          // scroll vertical no touch
    root.addEventListener('lostpointercapture', end);
    root.addEventListener('click', e => { if (moved > 6) { e.preventDefault(); e.stopPropagation(); } }, true);
    root.addEventListener('dragstart', e => e.preventDefault());
    root.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hovering = true; });
    root.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hovering = false; });
    root.addEventListener('focusin', () => hovering = true);
    root.addEventListener('focusout', () => hovering = false);
    new IntersectionObserver(([en]) => visible = en.isIntersecting).observe(root);

    build();
    let rw = root.clientWidth;
    new ResizeObserver(() => { if (Math.abs(root.clientWidth - rw) > 2) { rw = root.clientWidth; const p = x / setW; build(); x = p * setW; } }).observe(root);
    requestAnimationFrame(frame);
  }

  /* FAQ <details> em acordeão: abre e fecha devagar (altura + opacidade); abrir um fecha os irmãos abertos */
  function initDetails() {
    const all = [...document.querySelectorAll('details')];
    const toggles = new Map();
    const siblingsOf = d => all.filter(o => o !== d && o.parentElement === d.parentElement);
    all.forEach(d => {
      const sum = d.querySelector('summary');
      const body = [...d.children].find(c => c !== sum);
      if (!sum || !body) return;
      let anim = null;
      const closedH = () => sum.offsetHeight + (d.offsetHeight - d.clientHeight);
      const isOpen = () => d.open && !d.classList.contains('is-closing');
      const run = opening => {
        const from = d.offsetHeight;
        anim?.cancel();
        d.classList.remove('is-closing');
        if (opening) d.open = true;
        const to = opening ? d.scrollHeight + (d.offsetHeight - d.clientHeight) : closedH();
        if (!opening) d.classList.add('is-closing');
        d.style.overflow = 'hidden';
        anim = d.animate({ height: [`${from}px`, `${to}px`] }, { duration: opening ? 950 : 800, easing: 'cubic-bezier(.45,.05,.25,1)' });
        body.animate({ opacity: opening ? [0, 1] : [1, 0], transform: opening ? ['translateY(-8px)', 'none'] : ['none', 'translateY(-8px)'] }, { duration: opening ? 950 : 600, easing: 'ease-in-out', fill: 'forwards' });
        anim.onfinish = () => {
          if (!opening) d.open = false;
          d.classList.remove('is-closing');
          d.style.overflow = ''; anim = null;
          body.getAnimations().forEach(a => a.cancel());
        };
      };
      toggles.set(d, { run, isOpen });
      sum.addEventListener('click', e => {
        if (reduced) return;
        e.preventDefault();
        const opening = !isOpen();
        if (opening) siblingsOf(d).forEach(o => toggles.get(o)?.isOpen() && toggles.get(o).run(false));
        run(opening);
      });
      // sem animação (reduced motion): mantém o acordeão
      d.addEventListener('toggle', () => { if (reduced && d.open) siblingsOf(d).forEach(o => (o.open = false)); });
    });
  }

  /* Scroll stacking: <ol data-stack> com filhos sticky (CSS .s-card); o card coberto recua e escurece */
  function initStack() {
    const lists = [...document.querySelectorAll('[data-stack]')].map(s => [...s.children]);
    if (!lists.length || reduced) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      lists.forEach(list => list.forEach((el, i) => {
        const next = list[i + 1];
        let p = 0;
        if (next) {
          const r = el.getBoundingClientRect(), n = next.getBoundingClientRect();
          p = Math.min(1, Math.max(0, (r.bottom - n.top) / r.height));
        }
        el.style.setProperty('--s', (1 - p * 0.06).toFixed(4));
        el.style.setProperty('--b', (1 - p * 0.45).toFixed(3));
      }));
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update);
    update();
  }

  /* Ano automático no rodapé: <span data-year></span> */
  const initYear = () => document.querySelectorAll('[data-year]').forEach(n => n.textContent = new Date().getFullYear());

  function init() {
    initSmoothScroll(); initHeader(); initMenu(); initReveal(); initTilt(); initDetails(); initStack(); initYear();
    const start = () => document.querySelectorAll('[data-marquee]').forEach(initMarquee);
    document.fonts?.ready ? document.fonts.ready.then(start) : addEventListener('load', start);
  }
  return { init, initMarquee };
})();
