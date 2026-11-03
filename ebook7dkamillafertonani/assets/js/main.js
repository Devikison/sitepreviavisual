/* Detox 7D · Kamilla Fertonani — interações */

// Link do checkout: preencha aqui e todos os botões de compra passam a apontar para ele.
const CHECKOUT_URL = '';

// Data da próxima turma (ex.: '03/11'). Enquanto vazia, o selo de turma fica escondido.
const PROXIMA_TURMA = '';

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Checkout
  if (CHECKOUT_URL) {
    document.querySelectorAll('[data-checkout]').forEach(a => { a.href = CHECKOUT_URL; });
  }

  // Próxima turma
  if (PROXIMA_TURMA) {
    document.querySelectorAll('[data-turma]').forEach(el => {
      el.querySelector('span').textContent = 'Próxima turma: ' + PROXIMA_TURMA;
      el.hidden = false;
    });
  }

  // Imagens que ainda não existem viram um fundo neutro com a folha da marca
  document.querySelectorAll('.media img, .bgphoto img').forEach(img => {
    const fail = () => {
      if (img.parentElement.classList.contains('media')) img.parentElement.classList.add('is-missing');
      img.remove();
    };
    if (img.complete && img.naturalWidth === 0) fail();
    else img.addEventListener('error', fail, { once: true });
  });

  // Carrosséis infinitos: 4 cópias do conteúdo, a animação anda 50%
  document.querySelectorAll('[data-marquee]').forEach(track => {
    const items = Array.from(track.children);
    for (let r = 0; r < 3; r++) {
      items.forEach(el => {
        const c = el.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      });
    }
  });

  // Smooth scroll (Lenis)
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.075, smoothWheel: true });
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  // Âncoras internas (enquanto o checkout não estiver definido, levam para #oferta)
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -20 });
    else target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  // Barra fixa: aparece depois de 700px de rolagem
  const bar = document.querySelector('.sticky-bar');
  if (bar) {
    const barLink = bar.querySelector('a');
    let shown = false;
    const onScroll = () => {
      const s = window.scrollY > 700;
      if (s === shown) return;
      shown = s;
      bar.classList.toggle('is-visible', s);
      bar.setAttribute('aria-hidden', s ? 'false' : 'true');
      barLink.tabIndex = s ? 0 : -1;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Entregáveis: cada card recua conforme os seguintes sobem por cima dele
  const cards = Array.from(document.querySelectorAll('.deliv'));
  if (cards.length && !reduceMotion) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const heights = cards.map(c => c.offsetHeight);
      const tops = cards.map(c => c.getBoundingClientRect().top);
      cards.forEach((card, i) => {
        let d = 0;
        for (let j = i + 1; j < cards.length; j++) {
          // 0 quando o próximo card ainda está abaixo; 1 quando ele chegou na posição de empilhamento
          const gap = tops[j] - tops[i];
          const cover = 1 - gap / heights[i];
          d += Math.min(Math.max(cover, 0), 1);
        }
        card.style.setProperty('--d', Math.min(d, 3).toFixed(3));
      });
    };
    const request = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    update();
  }

  // FAQ: um item aberto por vez; clicar no aberto fecha
  const faqItems = Array.from(document.querySelectorAll('.faq__item'));
  faqItems.forEach(item => {
    item.querySelector('.faq__q').addEventListener('click', () => {
      const willOpen = !item.classList.contains('is-open');
      faqItems.forEach(other => {
        const open = other === item && willOpen;
        other.classList.toggle('is-open', open);
        other.querySelector('.faq__q').setAttribute('aria-expanded', String(open));
      });
    });
  });
})();

/* rolagem suave da roda do mouse, sem biblioteca. Solta o controle na hora se a pessoa
   pegar a barra lateral, clicar, usar o teclado ou o navegador mover a página por outro motivo. */
(function () {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement, alvoY = 0, posY = 0, escrito = 0, anima = false, antes = 0;
  function parar() { anima = false; }
  function travada() { return getComputedStyle(root).overflowY === 'hidden' || getComputedStyle(document.body).overflowY === 'hidden' || getComputedStyle(document.body).position === 'fixed'; }
  function temRolagemPropria(el) {
    for (; el && el !== document.body && el !== root && el.nodeType === 1; el = el.parentElement) {
      var o = getComputedStyle(el).overflowY;
      if ((o === 'auto' || o === 'scroll') && el.scrollHeight > el.clientHeight) return true;
    }
    return false;
  }
  function passo(t) {
    if (!anima) return;
    if (Math.abs(scrollY - escrito) > 3) { parar(); return; } /* outra coisa moveu a página */
    var dt = Math.min(t - antes, 50); antes = t;
    posY += (alvoY - posY) * (1 - Math.exp(-dt * .0062));
    if (Math.abs(alvoY - posY) < .6) posY = alvoY;
    scrollTo({ top: posY, behavior: 'instant' }); escrito = scrollY;
    if (posY === alvoY) { parar(); return; }
    requestAnimationFrame(passo);
  }
  addEventListener('wheel', function (e) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || travada() || temRolagemPropria(e.target)) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    var dy = e.deltaY * (e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? innerHeight : 1);
    e.preventDefault();
    if (!anima) { posY = alvoY = escrito = scrollY; antes = performance.now(); anima = true; requestAnimationFrame(passo); }
    alvoY = Math.max(0, Math.min(root.scrollHeight - innerHeight, alvoY + dy));
  }, { passive: false });
  ['mousedown', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, parar, { passive: true }); });
})();
