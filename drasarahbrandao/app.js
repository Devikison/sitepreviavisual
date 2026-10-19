/* Sarah Brandão | Link da bio
   Para ligar os botões, preencha apenas o bloco CONFIG abaixo.
   Campo vazio = botão aparece normalmente e mostra "Link disponível em breve". */
(function () {
  "use strict";

  // Não permite que a página seja exibida dentro de outro site (iframe).
  try {
    if (window.top !== window.self) window.top.location = window.self.location.href;
  } catch (e) {
    document.documentElement.style.display = "none";
  }

  var CONFIG = {
    // WhatsApp: só números, com DDI e DDD. Ex.: "5511999998888"
    whatsappNumero: "",
    whatsappMensagem: "Olá, Dra. Sarah! Vim pelo seu Instagram e gostaria de saber mais sobre o seu atendimento jurídico.",

    site: "",        // ex.: "https://sbadvocaciainternacional.com"
    instagram: "",   // ex.: "https://www.instagram.com/usuario"
    linkedin: "",    // ex.: "https://www.linkedin.com/in/usuario"
    maps: "",        // ex.: link de compartilhamento do Google Maps

    oab: ""          // ex.: "OAB/SP 000.000" (aparece no rodapé)
  };

  // Só aceita endereços https dos domínios esperados para cada botão.
  var ALLOWED = {
    site: [/^sbadvocaciainternacional\.com$/, /^www\.sbadvocaciainternacional\.com$/],
    instagram: [/^(www\.)?instagram\.com$/],
    linkedin: [/^([a-z]{2,3}\.)?linkedin\.com$/],
    maps: [/^maps\.app\.goo\.gl$/, /^goo\.gl$/, /^(www\.)?google\.[a-z.]+$/, /^maps\.google\.[a-z.]+$/],
    whatsapp: [/^wa\.me$/]
  };

  function safeUrl(key, value) {
    if (!value) return "";
    try {
      var u = new URL(value);
      if (u.protocol !== "https:") return "";
      var rules = ALLOWED[key] || [];
      for (var i = 0; i < rules.length; i++) {
        if (rules[i].test(u.hostname)) return u.href;
      }
    } catch (e) { /* endereço inválido */ }
    return "";
  }

  function whatsappUrl() {
    var n = String(CONFIG.whatsappNumero || "").replace(/\D/g, "");
    if (n.length < 10 || n.length > 15) return "";
    return "https://wa.me/" + n + "?text=" + encodeURIComponent(CONFIG.whatsappMensagem);
  }

  var urls = {
    whatsapp: safeUrl("whatsapp", whatsappUrl()),
    site: safeUrl("site", CONFIG.site),
    instagram: safeUrl("instagram", CONFIG.instagram),
    linkedin: safeUrl("linkedin", CONFIG.linkedin),
    maps: safeUrl("maps", CONFIG.maps)
  };

  var toast = document.querySelector(".toast");
  var toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-on"); }, 2200);
  }

  document.querySelectorAll("[data-key]").forEach(function (el) {
    var url = urls[el.getAttribute("data-key")];
    if (url) {
      el.setAttribute("href", url);
    } else {
      el.classList.add("is-pending");
      el.setAttribute("aria-disabled", "true");
      el.removeAttribute("target");
      el.addEventListener("click", function (ev) {
        ev.preventDefault();
        showToast("Link disponível em breve");
      });
    }
  });

  var oab = document.querySelector("[data-oab]");
  if (CONFIG.oab && oab) {
    oab.textContent = CONFIG.oab;
    oab.hidden = false;
  }

  // Luz suave que acompanha o cursor (só em mouse/trackpad).
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (ev) {
        var r = btn.getBoundingClientRect();
        btn.style.setProperty("--mx", (ev.clientX - r.left) + "px");
        btn.style.setProperty("--my", (ev.clientY - r.top) + "px");
      });
    });
  }

  // Proteção contra cópia: seleção, copiar, menu do botão direito, arrastar e salvar.
  ["contextmenu", "copy", "cut", "dragstart", "selectstart"].forEach(function (name) {
    window.addEventListener(name, function (ev) { ev.preventDefault(); }, true);
  });
  window.addEventListener("keydown", function (ev) {
    var k = (ev.key || "").toLowerCase();
    if ((ev.ctrlKey || ev.metaKey) && !ev.shiftKey && "sucpa".indexOf(k) !== -1 && k.length === 1) {
      ev.preventDefault();
    }
  }, true);
})();
