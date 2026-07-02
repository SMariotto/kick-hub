/* =====================================================================
   Plugin: Pelada Hub (app-pelada.js)
   Gerenciador de futebol + sorteador de times equilibrado.
   Segue o padrão do guide.md: dados via ctx.db (offline-first), UI do Core.
   ===================================================================== */
(function () {
  "use strict";
  if (!window.KickHub) return;

  var el = KickHub.ui.el;

  /* --------------------------- 1) DADOS / REGRA --------------------------- */
  var SEED_PLAYERS = [
    {
      "id": "pl-ana",
      "name": "Ana Goleira",
      "position": "goleiro",
      "rating": 4,
      "status": "mensalista",
      "active": true
    },
    {
      "id": "pl-bruno",
      "name": "Bruno Paredão",
      "position": "goleiro",
      "rating": 3,
      "status": "convidado",
      "active": true
    },
    {
      "id": "pl-caio",
      "name": "Caio Canhão",
      "position": "atacante",
      "rating": 5,
      "status": "mensalista",
      "active": true
    },
    {
      "id": "pl-diego",
      "name": "Diego Drible",
      "position": "meia",
      "rating": 4,
      "status": "mensalista",
      "active": true
    },
    {
      "id": "pl-edu",
      "name": "Edu Muralha",
      "position": "zagueiro",
      "rating": 3,
      "status": "mensalista",
      "active": true
    },
    {
      "id": "pl-fabio",
      "name": "Fábio Foguete",
      "position": "atacante",
      "rating": 4,
      "status": "convidado",
      "active": true
    },
    {
      "id": "pl-gabi",
      "name": "Gabi Maestro",
      "position": "meia",
      "rating": 5,
      "status": "mensalista",
      "active": true
    },
    {
      "id": "pl-hugo",
      "name": "Hugo Xerife",
      "position": "zagueiro",
      "rating": 2,
      "status": "convidado",
      "active": true
    },
    {
      "id": "pl-igor",
      "name": "Igor Veloz",
      "position": "meia",
      "rating": 3,
      "status": "mensalista",
      "active": true
    },
    {
      "id": "pl-joao",
      "name": "João Trator",
      "position": "zagueiro",
      "rating": 3,
      "status": "convidado",
      "active": true
    },
    {
      "id": "pl-leo",
      "name": "Léo Artilheiro",
      "position": "atacante",
      "rating": 4,
      "status": "mensalista",
      "active": true
    },
    {
      "id": "pl-miguel",
      "name": "Miguel Pipoca",
      "position": "meia",
      "rating": 2,
      "status": "convidado",
      "active": true
    }
  ];
  if (KickHub.db) KickHub.db.seed("pelada_players", SEED_PLAYERS);

  var POSITIONS = [
    { id: "goleiro", label: "Goleiro" },
    { id: "zagueiro", label: "Zagueiro" },
    { id: "meia", label: "Meia" },
    { id: "atacante", label: "Atacante" }
  ];
  function posLabel(id) {
    for (var i = 0; i < POSITIONS.length; i++) if (POSITIONS[i].id === id) return POSITIONS[i].label;
    return id || "—";
  }
  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0); }).join("").toUpperCase();
  }
  function stars(n) {
    n = Math.max(0, Math.min(5, n | 0));
    return new Array(n + 1).join("★") + new Array(6 - n).join("☆");
  }
  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }
  function byName(a, b) {
    return (a.order_index || 0) - (b.order_index || 0) || String(a.name).localeCompare(b.name);
  }

  // Sorteio equilibrado: goleiros em times diferentes; resto distribuído
  // pelo rating (greedy) para aproximar as médias técnicas.
  function drawTeams(players, perTeam) {
    var pool = players.slice().sort(function () { return Math.random() - 0.5; });
    var gks = pool.filter(function (p) { return p.position === "goleiro"; });
    var line = pool.filter(function (p) { return p.position !== "goleiro"; });
    var a = [], b = [], sa = 0, sb = 0, bench = [];
    if (gks[0]) { a.push(gks[0]); sa += gks[0].rating; }
    if (gks[1]) { b.push(gks[1]); sb += gks[1].rating; }
    var rest = line.concat(gks.slice(2)).sort(function (x, y) { return y.rating - x.rating; });
    rest.forEach(function (p) {
      var aOpen = a.length < perTeam, bOpen = b.length < perTeam;
      if (!aOpen && !bOpen) { bench.push(p); return; }
      if (aOpen && (!bOpen || sa <= sb)) { a.push(p); sa += p.rating; }
      else { b.push(p); sb += p.rating; }
    });
    return { a: a, b: b, bench: bench, avgA: a.length ? sa / a.length : 0, avgB: b.length ? sb / b.length : 0 };
  }

  /* ------------------------------ 2) VIEW -------------------------------- */
  function render(host, ctx) {
    var state = {
      tab: "players",
      players: SEED_PLAYERS,
      history: [],
      present: {},
      perTeam: 5,
      teams: null,
      match: { scoreA: 0, scoreB: 0, elapsed: 0, running: false },
      timer: null,
      timeEl: null
    };

    var content = el("div", { class: "kh-pel__content" });
    var seg = el("div", { class: "kh-seg" });
    [["players", "Jogadores"], ["draw", "Sortear"], ["score", "Placar"]].forEach(function (t) {
      var b = el("button", { class: "kh-seg__btn" + (t[0] === state.tab ? " is-active" : ""), type: "button", text: t[1] });
      ctx.on(b, "click", function () {
        state.tab = t[0];
        seg.querySelectorAll(".kh-seg__btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        renderTab();
      });
      seg.appendChild(b);
    });

    host.replaceChildren(el("div", { class: "kh-panel kh-pel" }, [
      el("div", { class: "kh-pel__head" }, [
        el("p", { class: "kh-eyebrow", text: "Pelada Hub" }),
        el("h2", { class: "kh-pel__title", text: "Futebol & Times" })
      ]),
      seg, content
    ]));

    loadPlayers().then(renderTab);

    function loadPlayers() {
      var p = ctx.db ? ctx.db.collection("pelada_players").list() : Promise.resolve(SEED_PLAYERS);
      return p.then(function (rows) {
        state.players = (rows && rows.length ? rows : SEED_PLAYERS)
          .filter(function (x) { return x.active !== false; }).slice().sort(byName);
        return state.players;
      }).catch(function () { state.players = SEED_PLAYERS; return state.players; });
    }
    function loadHistory() {
      var p = ctx.db ? ctx.db.collection("pelada_history").list() : Promise.resolve([]);
      return p.then(function (rows) {
        state.history = (rows || []).slice().sort(function (a, b) { return String(b.date).localeCompare(a.date); });
        return state.history;
      }).catch(function () { state.history = []; return state.history; });
    }
    function confirmedPlayers() {
      return state.players.filter(function (p) { return state.present[p.id]; });
    }

    function renderTab() {
      if (state.tab === "players") renderPlayers();
      else if (state.tab === "draw") renderDraw();
      else renderScore();
    }

    /* -------- Aba 1: Jogadores & Presença -------- */
    function renderPlayers() {
      var confirmed = confirmedPlayers().length;
      var toolbar = el("div", { class: "kh-pel__toolbar" }, [
        el("span", { class: "kh-pel__count", text: confirmed + " confirmado" + (confirmed === 1 ? "" : "s") }),
        el("div", { class: "kh-pel__toolbar-actions" }, [
          linkBtn("Todos", function () { state.players.forEach(function (p) { state.present[p.id] = true; }); renderPlayers(); }),
          linkBtn("Limpar", function () { state.present = {}; renderPlayers(); }),
          btn("+ Jogador", "kh-btn kh-btn--primary kh-btn--sm", openAddPlayer)
        ])
      ]);

      var list = el("div", { class: "kh-pel__list" });
      state.players.forEach(function (p) {
        var check = el("input", { type: "checkbox", class: "kh-pel__check" });
        check.checked = !!state.present[p.id];
        ctx.on(check, "change", function () {
          state.present[p.id] = check.checked;
          toolbar.querySelector(".kh-pel__count").textContent = (function () {
            var c = confirmedPlayers().length; return c + " confirmado" + (c === 1 ? "" : "s");
          })();
          row.classList.toggle("is-on", check.checked);
        });
        var row = el("label", { class: "kh-pel__player" + (state.present[p.id] ? " is-on" : "") }, [
          el("span", { class: "kh-pel__avatar", text: initials(p.name) }),
          el("span", { class: "kh-pel__info" }, [
            el("strong", { text: p.name }),
            el("small", { text: posLabel(p.position) + (p.status === "mensalista" ? " · Mensalista" : "") })
          ]),
          el("span", { class: "kh-pel__stars", title: p.rating + "/5", text: stars(p.rating) }),
          check
        ]);
        list.appendChild(row);
      });

      content.replaceChildren(toolbar, list);
    }

    function openAddPlayer() {
      KickHub.ui.modal({
        className: "kh-modal--glass",
        render: function (body, handle) {
          body.appendChild(el("h2", { class: "kh-modal__title", text: "Adicionar jogador" }));
          var name = el("input", { class: "kh-input", type: "text", placeholder: "Nome do jogador" });
          var pos = el("select", { class: "kh-input kh-select" },
            POSITIONS.map(function (o) { return el("option", { value: o.id }, o.label); }));
          var rate = el("select", { class: "kh-input kh-select" },
            [1, 2, 3, 4, 5].map(function (n) { return el("option", { value: String(n) }, stars(n) + "  (" + n + ")"); }));
          rate.value = "3";
          var err = el("p", { class: "kh-input-error" });
          var form = el("form", { class: "kh-form", autocomplete: "off" }, [
            name,
            el("label", { class: "kh-field" }, [el("small", { text: "Posição" }), pos]),
            el("label", { class: "kh-field" }, [el("small", { text: "Nível" }), rate]),
            err,
            el("button", { class: "kh-btn kh-btn--primary", type: "submit", text: "Salvar" })
          ]);
          form.addEventListener("submit", function (ev) {
            ev.preventDefault();
            var nm = name.value.trim();
            if (!nm) { err.textContent = "Informe o nome."; err.classList.add("is-visible"); return; }
            var rec = {
              id: "pl-" + Date.now().toString(36),
              name: nm, position: pos.value, rating: parseInt(rate.value, 10),
              status: "convidado", active: true, order_index: state.players.length + 1
            };
            var save = ctx.db ? ctx.db.collection("pelada_players").upsert(rec) : Promise.resolve();
            save.then(function () {
              if (!ctx.db) state.players.push(rec);
              handle.close();
              loadPlayers().then(renderPlayers);
            });
          });
          body.appendChild(form);
          window.setTimeout(function () { name.focus(); }, 150);
        }
      });
    }

    /* -------- Aba 2: Sorteador de Times -------- */
    function renderDraw() {
      var confirmed = confirmedPlayers();
      var controls = el("div", { class: "kh-pel__draw-ctrl" }, [
        el("label", { class: "kh-field" }, [
          el("small", { text: "Jogadores por time" }),
          (function () {
            var sel = el("select", { class: "kh-input kh-select" },
              [4, 5, 6, 7].map(function (n) { return el("option", { value: String(n) }, n + " x " + n); }));
            sel.value = String(state.perTeam);
            ctx.on(sel, "change", function () { state.perTeam = parseInt(sel.value, 10); });
            return sel;
          })()
        ]),
        btn("⚽ Sortear Equilibrado", "kh-btn kh-btn--primary", function () {
          var pool = confirmedPlayers();
          if (pool.length < 2) { state.teams = "few"; renderDraw(); return; }
          state.teams = drawTeams(pool, state.perTeam);
          renderDraw();
        })
      ]);

      var out = el("div", { class: "kh-pel__teams" });
      if (state.teams === "few") {
        out.appendChild(el("p", { class: "kh-empty", text: "Marque pelo menos 2 jogadores na aba Jogadores." }));
      } else if (state.teams) {
        out.appendChild(teamColumn("Time Colete", state.teams.a, state.teams.avgA, "a"));
        out.appendChild(teamColumn("Time Sem Colete", state.teams.b, state.teams.avgB, "b"));
        if (state.teams.bench.length) {
          out.appendChild(el("div", { class: "kh-pel__bench" }, [
            el("strong", { text: "Reservas" }),
            el("span", { text: state.teams.bench.map(function (p) { return p.name; }).join(", ") })
          ]));
        }
      } else {
        out.appendChild(el("p", { class: "kh-empty", text: confirmed.length + " confirmados. Toque em Sortear para gerar os times." }));
      }

      content.replaceChildren(controls, out);
    }

    function teamColumn(title, players, avg, side) {
      return el("div", { class: "kh-pel__team kh-pel__team--" + side }, [
        el("div", { class: "kh-pel__team-head" }, [
          el("strong", { text: title }),
          el("span", { class: "kh-pel__team-avg", text: "média " + avg.toFixed(1) + " ★" })
        ]),
        el("div", { class: "kh-pel__team-list" }, players.map(function (p) {
          return el("div", { class: "kh-pel__team-player" }, [
            el("span", { class: "kh-pel__avatar kh-pel__avatar--sm", text: initials(p.name) }),
            el("span", { text: p.name + (p.position === "goleiro" ? " (GK)" : "") }),
            el("span", { class: "kh-pel__stars kh-pel__stars--sm", text: stars(p.rating) })
          ]);
        }))
      ]);
    }

    /* -------- Aba 3: Placar & Estatísticas -------- */
    function renderScore() {
      ensureTimer();
      state.timeEl = el("span", { class: "kh-pel__time", text: fmtTime(state.match.elapsed) });

      var timerRow = el("div", { class: "kh-pel__timer" }, [
        state.timeEl,
        el("div", { class: "kh-pel__timer-btns" }, [
          btn(state.match.running ? "Pausar" : "Iniciar", "kh-btn kh-btn--primary kh-btn--sm", function () {
            state.match.running = !state.match.running;
            renderScore();
          }),
          linkBtn("Zerar", function () { state.match.running = false; state.match.elapsed = 0; renderScore(); })
        ])
      ]);

      var board = el("div", { class: "kh-pel__board" }, [
        scoreSide("Colete", "scoreA"),
        el("span", { class: "kh-pel__board-x", text: "×" }),
        scoreSide("Sem Colete", "scoreB")
      ]);

      var save = btn("Salvar Pelada", "kh-btn kh-btn--primary", saveMatch);

      var hist = el("div", { class: "kh-pel__history" }, [el("strong", { text: "Últimas peladas" })]);
      if (!state.history.length) {
        hist.appendChild(el("small", { class: "kh-pel__muted", text: "Nenhuma pelada salva ainda." }));
      } else {
        state.history.slice(0, 5).forEach(function (h) {
          hist.appendChild(el("div", { class: "kh-pel__history-row" }, [
            el("span", { text: formatDate(h.date) }),
            el("strong", { text: h.score_a + " × " + h.score_b })
          ]));
        });
      }

      content.replaceChildren(timerRow, board, save, hist);
    }

    function scoreSide(label, key) {
      var val = el("span", { class: "kh-pel__score", text: String(state.match[key]) });
      return el("div", { class: "kh-pel__board-side" }, [
        el("small", { text: label }),
        val,
        el("div", { class: "kh-pel__score-btns" }, [
          btn("−", "kh-btn kh-btn--ghost kh-btn--sm", function () { state.match[key] = Math.max(0, state.match[key] - 1); val.textContent = state.match[key]; }),
          btn("+", "kh-btn kh-btn--primary kh-btn--sm", function () { state.match[key]++; val.textContent = state.match[key]; })
        ])
      ]);
    }

    function ensureTimer() {
      if (state.timer) return;
      state.timer = window.setInterval(function () {
        if (!state.match.running) return;
        state.match.elapsed++;
        if (state.timeEl && state.timeEl.isConnected) state.timeEl.textContent = fmtTime(state.match.elapsed);
      }, 1000);
      ctx.cleanup(function () { window.clearInterval(state.timer); state.timer = null; });
    }

    function saveMatch() {
      var rec = {
        id: "pel-" + Date.now().toString(36),
        date: new Date().toISOString().slice(0, 10),
        team_a: state.teams && state.teams.a ? state.teams.a.map(function (p) { return p.id; }) : [],
        team_b: state.teams && state.teams.b ? state.teams.b.map(function (p) { return p.id; }) : [],
        score_a: state.match.scoreA, score_b: state.match.scoreB, stats: {}
      };
      var save = ctx.db ? ctx.db.collection("pelada_history").upsert(rec) : Promise.resolve();
      save.then(loadHistory).then(function () {
        state.match = { scoreA: 0, scoreB: 0, elapsed: 0, running: false };
        renderScore();
      });
    }

    loadHistory();
  }

  /* Helpers de UI locais. */
  function btn(label, cls, onClick) {
    var b = el("button", { class: cls, type: "button", text: label });
    b.addEventListener("click", onClick);
    return b;
  }
  function linkBtn(label, onClick) {
    var b = el("button", { class: "kh-link-btn", type: "button", text: label });
    b.addEventListener("click", onClick);
    return b;
  }
  function formatDate(d) {
    var p = String(d).split("-");
    return p.length === 3 ? p[2] + "/" + p[1] : d;
  }

  /* ---------------------------- 3) REGISTRO ------------------------------ */
  KickHub.registerApp({
    id: "pelada",
    parent: null,
    title: "Pelada Hub",
    subtitle: "Times & placar",
    theme: "green",
    order: 20,
    icon: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20"/><path d="M32 18l6 4-2 7h-8l-2-7 6-4Z"/><path d="M14 30l8 2 3 8M50 30l-8 2-3 8M26 45l6 3 6-3"/></svg>',
    mount: render
  });
})();
