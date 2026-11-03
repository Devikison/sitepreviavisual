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
  // ---------- carrossel contínuo de fotos ----------
  var marquee = document.getElementById('marquee');
  if (marquee) {
    var reducedMarquee = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMarquee) {
      marquee.querySelectorAll('.marquee-track').forEach(function (track) {
        Array.prototype.slice.call(track.children).forEach(function (li) {
          var copy = li.cloneNode(true);
          copy.setAttribute('aria-hidden', 'true');
          copy.querySelector('img').alt = '';
          track.appendChild(copy);
        });
      });
      marquee.classList.add('is-ready');
    }
    var marqueeToggle = document.getElementById('marqueeToggle');
    if (marqueeToggle) {
      if (reducedMarquee) marqueeToggle.hidden = true;
      marqueeToggle.addEventListener('click', function () {
        var paused = marquee.classList.toggle('is-paused');
        marqueeToggle.setAttribute('aria-pressed', String(paused));
        marqueeToggle.textContent = paused ? 'Continuar as fotos' : 'Pausar as fotos';
      });
    }
  }

  // ---------- entrada das seções ----------
  var toReveal = document.querySelectorAll('.reveal, #prints');
  if ('IntersectionObserver' in window) {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    toReveal.forEach(function (el) { revealIO.observe(el); });
  } else {
    toReveal.forEach(function (el) { el.classList.add('is-in'); });
  }

  // ---------- a barra superior acompanha a cor do capítulo ----------
  var siteHeader = document.querySelector('.site-header');
  var chapters = document.querySelectorAll('[data-chapter]');
  if (siteHeader && chapters.length && 'IntersectionObserver' in window) {
    var chapterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) siteHeader.setAttribute('data-on', entry.target.getAttribute('data-chapter'));
      });
    }, { rootMargin: '-72px 0px -88% 0px' });
    chapters.forEach(function (c) { chapterIO.observe(c); });
  }

  // ---------- link atual no menu ----------
  var page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-full a').forEach(function (a) {
    if (a.getAttribute('href') === page) a.setAttribute('aria-current', 'page');
  });
})();
