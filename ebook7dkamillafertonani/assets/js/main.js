/* EBOOK 7D · Kamilla Fertonani — interações */

// Link do checkout: preencha aqui e todos os botões de compra passam a apontar para ele.
const CHECKOUT_URL = '';

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Checkout
  if (CHECKOUT_URL) {
    document.querySelectorAll('[data-checkout]').forEach(a => { a.href = CHECKOUT_URL; });
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
