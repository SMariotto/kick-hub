/* =====================================================================
   Plugin: Trabalhos (app-trabalhos.js)
   ---------------------------------------------------------------------
   Lista os trabalhos e abre as páginas externas standalone existentes
   (espanhol/, portugues/) — que permanecem inalteradas. O plugin só
   conhece a si mesmo; some sem quebrar o hub se for removido.
   ===================================================================== */
(function () {
  "use strict";
  if (!window.KickHub) return;

  /* 1) DADOS — escopo próprio do app. */
  var WORKS = [
    {
      "id": "espanhol-manu-chao",
      "title": "Espanhol",
      "subtitle": "Manu Chao e Me Gustas Tu",
      "icon": "🎸",
      "theme": "yellow",
      "url": "espanhol/manu-chao.html"
    },
    {
      "id": "portugues-gregorio",
      "title": "Português",
      "subtitle": "Gregório de Matos",
      "icon": "🪶",
      "theme": "dark",
      "url": "portugues/gregorio-matos.html"
    }
  ];

  var WORK_ICONS = {
    "espanhol-manu-chao": '<svg viewBox="0 0 64 64"><path d="M24 17v25a8 8 0 1 0 6 7V25l18-4v15a8 8 0 1 0 6 7V14L24 17Z"/></svg>',
    "portugues-gregorio": '<svg viewBox="0 0 64 64"><path d="M20 48c9-3 22-15 25-32-15 3-27 16-30 30l5 2Z"/><path d="M24 41 16 49M31 25c3 5 6 8 12 10"/></svg>'
  };
  var DEFAULT_ICON = '<svg viewBox="0 0 64 64"><path d="M14 18h15l5 6h16v22a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V18Z"/><path d="M20 34h24M20 42h16"/></svg>';

  /* 2) VIEW. */
  function render(host, ctx) {
    var el = KickHub.ui.el;
    var row = el("div", { class: "kh-card-row" });
    WORKS.forEach(function (work) {
      var card = KickHub.ui.card(
        { title: work.title, subtitle: work.subtitle, theme: work.theme, icon: WORK_ICONS[work.id] || DEFAULT_ICON },
        function () { window.location.href = work.url; } // navegação de página inteira (app externo)
      );
      row.appendChild(card);
    });
    host.replaceChildren(el("div", { class: "kh-view--menu" }, row));
  }

  /* 3) REGISTRO. */
  KickHub.registerApp({
    id: "trabalhos",
    parent: "escola",
    title: "Trabalhos",
    subtitle: "Português e Espanhol",
    theme: "blue",
    order: 10,
    icon: '<svg viewBox="0 0 64 64"><path d="M14 18h15l5 6h16v22a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V18Z"/><path d="M20 34h24M20 42h16"/></svg>',
    mount: render
  });
})();
