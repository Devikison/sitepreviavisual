/* ARCA Sorocaba: comportamentos compartilhados por todas as páginas */
(function () {
  'use strict';

  var WA_NUMBER = '5515997124769';
  var PIX_KEY = '19.831.448/0001-85';

  function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }

  // ---------- menu mobile ----------
  var menuToggle = document.getElementById('menuToggle');
  var mobileNav = document.getElementById('mobileNav');

  function closeMenu() {
    mobileNav.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1120) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileNav.classList.contains('is-open')) {
        closeMenu();
        menuToggle.focus();
      }
    });
  }

  // ---------- perguntas frequentes ----------
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    var sign = item.querySelector('.faq-sign');
    btn.addEventListener('click', function () {
      var isOpen = item.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(isOpen));
      sign.textContent = isOpen ? '−' : '+';
    });
  });

  // ---------- copiar chave PIX (qualquer botão com data-pix-copy) ----------
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { fallbackCopy(text); });
    }
    fallbackCopy(text);
    return Promise.resolve();
  }
  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(area);
  }

  document.querySelectorAll('[data-pix-copy]').forEach(function (btn) {
    var scope = btn.closest('[data-pix-scope]') || btn.parentElement;
    var msg = scope.querySelector('[data-pix-msg]');
    var timer;
    btn.addEventListener('click', function () {
      copyText(PIX_KEY);
      if (msg) {
        msg.classList.add('is-visible');
        clearTimeout(timer);
        timer = setTimeout(function () { msg.classList.remove('is-visible'); }, 9000);
      }
    });
  });

  // ---------- doação da home: valor + frequência, PIX ou WhatsApp ----------
  var doarRoot = document.getElementById('doar');
  if (doarRoot && doarRoot.querySelector('[data-freq]')) {
    var freqButtons = doarRoot.querySelectorAll('[data-freq]');
    var valorButtons = doarRoot.querySelectorAll('[data-valor]');
    var impactoText = document.getElementById('impactoText');
    var otherWrap = document.getElementById('doarOther');
    var otherInput = document.getElementById('doarOtherInput');
    var doarBtn = document.getElementById('doarWhatsBtn');
    var state = { freq: 'mensal', valor: 30 };
    var CUSTO_MES = 30000; // valor informado pela ARCA

    // só o valor de R$ 30 tem significado definido pela ARCA
    var IMPACTOS = {
      30: 'Com R$ 30 você mantém um dia de oficina.',
      other: 'Qualquer valor ajuda a manter a casa de portas abertas.'
    };

    function currentValue() {
      if (state.valor === 0) {
        var n = parseFloat(String(otherInput.value).replace(/\./g, '').replace(',', '.'));
        return isNaN(n) || n <= 0 ? 0 : n;
      }
      return state.valor;
    }

    function fmt(n) {
      return 'R$ ' + (n % 1 === 0 ? String(n) : n.toFixed(2).replace('.', ','));
    }

    function refresh() {
      var v = currentValue();
      var mensal = state.freq === 'mensal';
      impactoText.textContent = IMPACTOS[state.valor] || IMPACTOS.other;
      otherWrap.classList.toggle('is-visible', state.valor === 0);
      var resumo = document.getElementById('doarResumo');
      var pixValor = document.getElementById('pixValor');
      var pixMensal = document.getElementById('pixMensal');
      if (resumo) resumo.textContent = v > 0 ? fmt(v) + (mensal ? ' por mês' : ' (doação única)') : 'Escolha um valor';
      if (pixValor) pixValor.textContent = v > 0 ? fmt(v) : 'que você escolheu';
      if (pixMensal) pixMensal.classList.toggle('is-visible', mensal);
      var contaBig = document.getElementById('contaBig');
      var contaText = document.getElementById('contaText');
      if (contaBig && contaText) {
        var quantos = v > 0 ? Math.ceil(CUSTO_MES / v) : 0;
        if (mensal && quantos > 0) {
          contaBig.textContent = quantos.toLocaleString('pt-BR') + (quantos === 1 ? ' Guardião' : ' Guardiões');
          contaText.textContent = 'doando ' + fmt(v) + ' por mês fecham a conta da casa, que custa cerca de R$ 30 mil por mês.';
        } else {
          contaBig.textContent = 'R$ 30 mil por mês';
          contaText.textContent = 'é o custo aproximado para manter a casa aberta. Toda doação, de qualquer valor, ajuda.';
        }
      }
    }
    otherInput.addEventListener('input', refresh);

    freqButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        freqButtons.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        state.freq = btn.dataset.freq;
        refresh();
      });
    });
    valorButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        valorButtons.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');
        state.valor = Number(btn.dataset.valor);
        refresh();
        if (state.valor === 0) otherInput.focus();
      });
    });

    doarBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var v = currentValue();
      var tipo = state.freq === 'mensal' ? 'mensal' : 'única';
      var msg = v > 0
        ? 'Olá! Quero fazer uma doação ' + tipo + ' de ' + fmt(v) + ' para a ARCA Sorocaba.'
        : 'Olá! Quero fazer uma doação ' + tipo + ' para a ARCA Sorocaba.';
      window.open(waLink(msg), '_blank', 'noopener');
    });

    refresh();
  }

  // ---------- chips de seleção múltipla ----------
  document.querySelectorAll('.chip').forEach(function (chip) {
    chip.setAttribute('aria-pressed', 'false');
    chip.addEventListener('click', function () {
      chip.classList.toggle('is-selected');
      chip.setAttribute('aria-pressed', chip.classList.contains('is-selected') ? 'true' : 'false');
    });
  });

  // ---------- validação dos formulários: o erro aparece abaixo do campo ----------
  function validate(form) {
    var first = null;
    form.querySelectorAll('input, textarea').forEach(function (field) {
      var old = field.parentElement.querySelector('.field-error');
      if (old) old.remove();
      field.removeAttribute('aria-invalid');
      field.removeAttribute('aria-describedby');
      var msg = '';
      if (field.required && !field.value.trim()) msg = 'Preencha este campo para continuar.';
      else if (field.type === 'email' && field.value.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(field.value.trim())) msg = 'Confira o e-mail. Exemplo: voce@email.com';
      if (msg) {
        var err = document.createElement('span');
        err.className = 'field-error';
        err.id = field.name + '-erro-' + form.getAttribute('data-wa-form');
        err.textContent = msg;
        field.parentElement.appendChild(err);
        field.setAttribute('aria-invalid', 'true');
        field.setAttribute('aria-describedby', err.id);
        if (!first) first = field;
      }
    });
    if (first) first.focus();
    return !first;
  }

  // ---------- formulários que abrem o WhatsApp da ARCA ----------
  // O site é estático: em vez de fingir que enviou, montamos a mensagem e abrimos o WhatsApp.
  document.querySelectorAll('form[data-wa-form]').forEach(function (form) {
    var done = form.parentElement.querySelector('.form-done');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validate(form)) return;
      var kind = form.getAttribute('data-wa-form');
      var val = function (name) {
        var el = form.elements[name];
        return el ? String(el.value).trim() : '';
      };
      var chips = Array.prototype.map.call(form.querySelectorAll('.chip.is-selected'), function (c) {
        return c.textContent.trim();
      });
      var text;
      if (kind === 'voluntario') {
        text = 'Olá! Meu nome é ' + (val('nome') || '(nome)') + ' e quero ser voluntário(a) na ARCA Sorocaba.';
        if (chips.length) text += ' Posso ajudar: ' + chips.join(', ') + '.';
        if (val('whatsapp')) text += ' Meu WhatsApp: ' + val('whatsapp') + '.';
      } else {
        text = 'Olá! Meu nome é ' + (val('nome') || '(nome)') + '.';
        if (val('email')) text += ' Meu e-mail: ' + val('email') + '.';
        if (val('mensagem')) text += ' ' + val('mensagem');
      }
      window.open(waLink(text), '_blank', 'noopener');
      if (done) done.classList.add('is-visible');
    });
  });
  // ---------- carrossel de fotos: passa sozinho, pode ser arrastado e retoma com suavidade ----------
  var marquee = document.getElementById('marquee');
  if (marquee) {
    var semMovimento = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var parado = semMovimento;
    var RETOMADA = 2.6;  // quanto maior, mais rápido volta ao ritmo normal depois de soltar
    var trilhos = Array.prototype.map.call(marquee.querySelectorAll('.marquee-track'), function (track, i) {
      var originais = Array.prototype.slice.call(track.children);
      originais.forEach(function (li) {
        var copia = li.cloneNode(true);
        copia.setAttribute('aria-hidden', 'true');
        copia.querySelector('img').alt = '';
        track.appendChild(copia);
      });
      return {
        el: track,
        primeiraCopia: track.children[originais.length],
        x: 0,
        ritmo: i % 2 ? 30 : -38,  // px por segundo; cada fileira vai para um lado
        v: i % 2 ? 30 : -38,
        volta: 0,
        arrastando: false
      };
    });

    function medir() {
      trilhos.forEach(function (t) { t.volta = t.primeiraCopia.offsetLeft - t.el.children[0].offsetLeft; });
    }
    function posicionar(t) {
      if (t.volta > 0) {
        while (t.x <= -t.volta) t.x += t.volta;
        while (t.x > 0) t.x -= t.volta;
      }
      t.el.style.transform = 'translate3d(' + t.x + 'px,0,0)';
    }
    medir();
    window.addEventListener('resize', medir);
    window.addEventListener('load', medir);

    trilhos.forEach(function (t) {
      var ultimoX = 0, ultimoT = 0;
      t.el.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        t.arrastando = true;
        t.v = 0;
        ultimoX = e.clientX;
        ultimoT = e.timeStamp;
        t.el.classList.add('is-dragging');
        t.el.setPointerCapture(e.pointerId);
      });
      t.el.addEventListener('pointermove', function (e) {
        if (!t.arrastando) return;
        var dx = e.clientX - ultimoX;
        var dt = Math.max(e.timeStamp - ultimoT, 1) / 1000;
        t.x += dx;
        t.v = 0.75 * (dx / dt) + 0.25 * t.v;
        ultimoX = e.clientX;
        ultimoT = e.timeStamp;
        posicionar(t);
      });
      function soltar(e) {
        if (!t.arrastando) return;
        t.arrastando = false;
        t.el.classList.remove('is-dragging');
        // se a pessoa segurou parada antes de soltar, não há embalo
        if (e.timeStamp - ultimoT > 90) t.v = 0;
        t.v = Math.max(-2600, Math.min(2600, t.v));
      }
      t.el.addEventListener('pointerup', soltar);
      t.el.addEventListener('pointercancel', soltar);
      t.el.addEventListener('dragstart', function (e) { e.preventDefault(); });
    });

    // teclado: setas movem as fotos
    marquee.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      trilhos.forEach(function (t) { t.v = e.key === 'ArrowLeft' ? 900 : -900; });
    });

    var visivel = true, antes = 0;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visivel = es[0].isIntersecting; antes = 0; }).observe(marquee);
    }
    (function passo(agora) {
      requestAnimationFrame(passo);
      if (!visivel) return;
      var dt = antes ? Math.min((agora - antes) / 1000, 0.05) : 0;
      antes = agora;
      trilhos.forEach(function (t) {
        if (t.arrastando) return;
        var alvo = parado ? 0 : t.ritmo;
        t.v += (alvo - t.v) * (1 - Math.exp(-dt * RETOMADA));
        t.x += t.v * dt;
        posicionar(t);
      });
    })(performance.now());

    var marqueeToggle = document.getElementById('marqueeToggle');
    if (marqueeToggle) {
      marqueeToggle.setAttribute('aria-pressed', String(parado));
      marqueeToggle.textContent = parado ? 'Continuar as fotos' : 'Pausar as fotos';
      marqueeToggle.addEventListener('click', function () {
        parado = !parado;
        marqueeToggle.setAttribute('aria-pressed', String(parado));
        marqueeToggle.textContent = parado ? 'Continuar as fotos' : 'Pausar as fotos';
      });
    }
  }

  // ---------- faixas de texto infinitas ----------
  if (!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
    document.querySelectorAll('[data-ticker] ul').forEach(function (ul) {
      var originais = Array.prototype.slice.call(ul.children);
      for (var i = 0; i < 3; i++) {
        originais.forEach(function (li) {
          var copia = li.cloneNode(true);
          copia.setAttribute('aria-hidden', 'true');
          ul.appendChild(copia);
        });
      }
      ul.parentElement.classList.add('is-ready');
    });
  }

  // ---------- surgimento ao rolar ----------
  var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var observados = [];

  // títulos: cada palavra sobe de trás de uma máscara
  function dividir(no, contador) {
    Array.prototype.slice.call(no.childNodes).forEach(function (filho) {
      if (filho.nodeType === 3) {
        var frag = document.createDocumentFragment();
        filho.textContent.split(/(\s+)/).forEach(function (parte) {
          if (!parte) return;
          if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(' ')); return; }
          var w = document.createElement('span'); w.className = 'w';
          var dentro = document.createElement('span'); dentro.textContent = parte;
          dentro.style.setProperty('--i', contador.n++);
          w.appendChild(dentro); frag.appendChild(w);
        });
        no.replaceChild(frag, filho);
      } else if (filho.nodeType === 1) {
        dividir(filho, contador);
      }
    });
  }
  if (!calmo) {
    document.querySelectorAll('.hero h1, .pg-title, .h2').forEach(function (t) {
      t.classList.remove('reveal');
      t.classList.add('split');
      dividir(t, { n: 0 });
      observados.push(t);
    });

    // textos, botões e pílulas entram em sequência dentro do bloco
    var blocos = '.hero-text, .pg-hero-text, .head, .doar-left, .pix-card, .b-main, .guardiao-text, .acolhe-text, .volunt-body, .contato-card, .duo-head, .transp-head > div, .transp-copy, .closing, .split-card > div, .card-body, .help-card, .glass, .prose, .form-wrap form, .footer-inner';
    document.querySelectorAll(blocos).forEach(function (bloco) {
      var i = 0;
      Array.prototype.forEach.call(bloco.children, function (el) {
        if (el.classList.contains('split') || el.tagName === 'H1' || el.tagName === 'FORM') return;
        el.classList.add('reveal');
        el.style.setProperty('--d', Math.min(i++ * 90, 540) + 'ms');
      });
    });

    // cards entram um depois do outro
    document.querySelectorAll('.valores, .help, .destinos, .duo-cards, .bento, .steps, .faq-list, .two-col, .contact-list, .contato-grid, .footer-grid, .badges').forEach(function (grade) {
      Array.prototype.forEach.call(grade.children, function (el, i) {
        el.classList.add('reveal');
        el.style.setProperty('--d', (i % 3) * 110 + 'ms');
      });
    });
    document.querySelectorAll('.ticker, .marquee, .doar-card, .acolhe, .guardiao, .volunt, .split-card, .panel, .transp').forEach(function (el) { el.classList.add('reveal'); });

    // fotos abrem com máscara e assentam o zoom
    document.querySelectorAll('.card-media, .b-photo, .guardiao-photo, .volunt-photo, .contato-photo, .split-card > figure, .hero-photo, .pg-hero-photo').forEach(function (el) {
      el.classList.add('mask');
      observados.push(el);
    });
  }
  var toReveal = observados.concat(Array.prototype.slice.call(document.querySelectorAll('.reveal, #prints')));
  if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.04 });
    toReveal.forEach(function (el) { revealIO.observe(el); });
  } else {
    toReveal.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------- empilhamento de cards no celular ----------
  (function () {
    var telaPequena = window.matchMedia('(max-width:760px)');
    var semAnim = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (semAnim) return;
    var pilhas = [];
    var pedido = false;

    function atualizar() {
      pedido = false;
      pilhas.forEach(function (itens) {
        itens.forEach(function (card, i) {
          var prox = itens[i + 1];
          if (!prox) return;
          var a = card.getBoundingClientRect();
          var altura = card.offsetHeight;
          var topoProx = prox.getBoundingClientRect().top;
          var base = a.top;
          var p = 1 - Math.max(0, Math.min(1, (topoProx - base) / altura));
          // cards mais antigos recuam um pouco mais conforme a pilha cresce
          var ultimo = itens[itens.length - 1].getBoundingClientRect().top;
          var extra = Math.max(0, Math.min(1, 1 - (ultimo - base) / (altura * (itens.length - 1 - i))));
          var escala = 1 - p * 0.05 - extra * 0.04;
          card.style.transform = p > 0 ? 'scale(' + escala.toFixed(4) + ')' : '';
        });
      });
    }
    function pedir() {
      if (!pedido) { pedido = true; requestAnimationFrame(atualizar); }
    }
    function medir() {
      pilhas.forEach(function (itens) {
        itens.forEach(function (card, i) {
          // card mais alto que a tela rola até o fim antes de prender
          var livre = window.innerHeight - card.offsetHeight - 16;
          card.style.setProperty('--stack-top', Math.min(84 + i * 8, livre) + 'px');
        });
      });
      atualizar();
    }
    function montar() {
      pilhas = [];
      document.querySelectorAll('.help, .valores, .destinos, .steps, .stack-list').forEach(function (grade) {
        var itens = Array.prototype.slice.call(grade.children);
        if (telaPequena.matches && itens.length > 2) {
          grade.classList.add('stack-on');
          itens.forEach(function (c) {
            c.classList.remove('reveal');
            c.classList.add('is-in');
            c.style.removeProperty('--d');
          });
          pilhas.push(itens);
        } else {
          grade.classList.remove('stack-on');
          itens.forEach(function (c) { c.style.transform = ''; c.style.removeProperty('--stack-top'); });
        }
      });
      medir();
    }
    montar();
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', medir);
    window.addEventListener('load', medir);
    if (telaPequena.addEventListener) telaPequena.addEventListener('change', montar);
  })();

  // ---------- link atual no menu ----------
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-full a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
  });
})();
