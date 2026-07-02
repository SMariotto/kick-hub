/* =====================================================================
   Pelada Hub (app-pelada.js)
   Gerenciador de futebol premium: jogadores, sorteio equilibrado por
   posição e histórico editável. Protegido por passcode declarativo.
   Dados 100% via ctx.db (offline-first). Segue o guide.md.
   ===================================================================== */
(function () {
  "use strict";
  if (!window.KickHub) return;

  var el = KickHub.ui.el;
  var store = (KickHub.storage && KickHub.storage.local) || { get: function (k, d) { return d; }, set: function () {} };

  /* --------------------------- Modelo / regra --------------------------- */
  var MODALITIES = {
    futsal:  { label: "Futsal",  positions: ["Goleiro", "Fixo", "Ala", "Pivô"] },
    society: { label: "Society", positions: ["Goleiro", "Zagueiro", "Ala", "Meio-Campo", "Atacante"] },
    campo:   { label: "Campo",   positions: ["Goleiro", "Zagueiro", "Lateral", "Volante", "Meia", "Ponta", "Centroavante"] }
  };
  var ROLE = {
    "Goleiro": "gk",
    "Fixo": "def", "Zagueiro": "def", "Lateral": "def",
    "Volante": "mid", "Ala": "mid", "Meio-Campo": "mid", "Meia": "mid",
    "Pivô": "att", "Atacante": "att", "Ponta": "att", "Centroavante": "att"
  };
  var ROLE_LABEL = { gk: "Goleiro", def: "Defesa", mid: "Meio", att: "Ataque" };
  function roleOf(pos) { return ROLE[pos] || "mid"; }

  // Sem jogadores fake: começa vazio.
  if (KickHub.db) KickHub.db.seed("pelada_players", []);

  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0); }).join("").toUpperCase();
  }
  function stars(n) {
    n = Math.max(0, Math.min(5, n | 0));
    return new Array(n + 1).join("★") + new Array(6 - n).join("☆");
  }
  function byRatingDesc(a, b) { return b.rating - a.rating; }
  function fmtDate(d) { var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] : d; }
  function newId(prefix) { return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

  // Sorteio equilibrado: 1 goleiro por time, defensores distribuídos
  // igualmente, restante pelo rating para aproximar as médias.
  function drawTeams(players, perTeam) {
    var pool = players.slice().sort(function () { return Math.random() - 0.5; });
    var gk = pool.filter(function (p) { return roleOf(p.position) === "gk"; });
    var def = pool.filter(function (p) { return roleOf(p.position) === "def"; }).sort(byRatingDesc);
    var rest = pool.filter(function (p) { var r = roleOf(p.position); return r !== "gk" && r !== "def"; }).sort(byRatingDesc);
    var A = { list: [], sum: 0, def: 0 }, B = { list: [], sum: 0, def: 0 }, bench = [];
    function cap(t) { return t.list.length < perTeam; }
    function add(t, p) { t.list.push(p); t.sum += p.rating; if (roleOf(p.position) === "def") t.def++; }

    if (gk[0] && cap(A)) add(A, gk[0]);
    if (gk[1] && cap(B)) add(B, gk[1]);

    def.forEach(function (p) {
      var aOpen = cap(A), bOpen = cap(B);
      if (!aOpen && !bOpen) { bench.push(p); return; }
      var toA = aOpen && (!bOpen ? true : (A.def !== B.def ? A.def < B.def : A.sum <= B.sum));
      if (!aOpen) toA = false;
      add(toA ? A : B, p);
    });
    rest.concat(gk.slice(2)).sort(byRatingDesc).forEach(function (p) {
      var aOpen = cap(A), bOpen = cap(B);
      if (!aOpen && !bOpen) { bench.push(p); return; }
      var toA = aOpen && (!bOpen || A.sum <= B.sum);
      add(toA ? A : B, p);
    });
    return {
      a: A.list, b: B.list, bench: bench,
      avgA: A.list.length ? A.sum / A.list.length : 0,
      avgB: B.list.length ? B.sum / B.list.length : 0
    };
  }

  /* ------------------------------ Componentes --------------------------- */
  function posBadge(pos) {
    return el("span", { class: "kh-pos kh-pos--" + roleOf(pos), text: pos || "—" });
  }
  function avatar(name, cls) {
    return el("span", { class: "kh-pel-av kh-pel-av--" + roleOf("") + (cls ? " " + cls : ""), text: initials(name) });
  }
  function starPicker(initial) {
    var val = initial || 3;
    var wrap = el("div", { class: "kh-rate" });
    var btns = [];
    for (var i = 1; i <= 5; i++) (function (n) {
      var s = el("button", { type: "button", class: "kh-rate__star" + (n <= val ? " is-on" : ""), text: "★" });
      s.addEventListener("click", function () {
        val = n;
        btns.forEach(function (b, idx) { b.classList.toggle("is-on", idx < val); });
      });
      btns.push(s); wrap.appendChild(s);
    })(i);
    wrap.getValue = function () { return val; };
    return wrap;
  }
  function segPicker(options, initial, cls) {
    var val = initial || options[0][0];
    var wrap = el("div", { class: "kh-seg " + (cls || "") });
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "kh-seg__btn" + (o[0] === val ? " is-active" : ""), text: o[1] });
      b.addEventListener("click", function () {
        val = o[0];
        wrap.querySelectorAll(".kh-seg__btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
      });
      wrap.appendChild(b);
    });
    wrap.getValue = function () { return val; };
    return wrap;
  }

  /* -------------------------------- VIEW -------------------------------- */
  function render(host, ctx) {
    var state = {
      tab: "players",
      players: [],
      history: [],
      present: {},
      perTeam: 5,
      teams: null,
      modality: store.get("pelada.modality", "society")
    };
    if (!MODALITIES[state.modality]) state.modality = "society";

    var content = el("div", { class: "kh-pel__content" });
    var modalityChip = el("span", { class: "kh-pel__mod-chip", text: MODALITIES[state.modality].label });

    var seg = el("div", { class: "kh-seg kh-seg--tabs" });
    [["players", "Jogadores"], ["draw", "Sorteador"], ["history", "Histórico"]].forEach(function (t) {
      var b = el("button", { class: "kh-seg__btn" + (t[0] === state.tab ? " is-active" : ""), type: "button", text: t[1] });
      ctx.on(b, "click", function () {
        state.tab = t[0];
        seg.querySelectorAll(".kh-seg__btn").forEach(function (x) { x.classList.toggle("is-active", x === b); });
        renderTab();
      });
      seg.appendChild(b);
    });

    var modalityBtn = el("button", { class: "kh-pel__mod", type: "button" }, [
      el("span", { class: "kh-eyebrow", text: "Tipo de jogo" }),
      el("span", { class: "kh-pel__mod-val" }, [modalityChip, el("span", { class: "kh-pel__mod-caret", text: "▾" })])
    ]);
    ctx.on(modalityBtn, "click", openModalityPicker);

    host.replaceChildren(el("div", { class: "kh-panel kh-pel" }, [
      el("div", { class: "kh-pel__head" }, [
        el("div", null, [
          el("p", { class: "kh-eyebrow", text: "Pelada Hub" }),
          el("h2", { class: "kh-pel__title", text: "Futebol & Times" })
        ]),
        modalityBtn
      ]),
      seg, content
    ]));

    reloadAll().then(renderTab);

    /* ---- dados ---- */
    function reloadAll() { return Promise.all([loadPlayers(), loadHistory()]); }
    function loadPlayers() {
      var p = ctx.db ? ctx.db.collection("pelada_players").list() : Promise.resolve([]);
      return p.then(function (rows) {
        state.players = (rows || []).filter(function (x) { return x.active !== false; })
          .slice().sort(function (a, b) { return byRatingDesc(a, b) || String(a.name).localeCompare(b.name); });
        return state.players;
      }).catch(function () { state.players = []; return state.players; });
    }
    function loadHistory() {
      var p = ctx.db ? ctx.db.collection("pelada_history").list() : Promise.resolve([]);
      return p.then(function (rows) {
        state.history = (rows || []).slice().sort(function (a, b) {
          return String(b.date).localeCompare(a.date) || (b.order_index || 0) - (a.order_index || 0);
        });
        return state.history;
      }).catch(function () { state.history = []; return state.history; });
    }
    function savePlayer(rec) { return ctx.db ? ctx.db.collection("pelada_players").upsert(rec) : Promise.resolve(); }
    function delPlayer(id) { return ctx.db ? ctx.db.collection("pelada_players").remove(id) : Promise.resolve(); }
    function saveHistory(rec) { return ctx.db ? ctx.db.collection("pelada_history").upsert(rec) : Promise.resolve(); }
    function delHistory(id) { return ctx.db ? ctx.db.collection("pelada_history").remove(id) : Promise.resolve(); }
    function playerName(id) {
      for (var i = 0; i < state.players.length; i++) if (state.players[i].id === id) return state.players[i].name;
      return "Jogador removido";
    }
    function confirmed() { return state.players.filter(function (p) { return state.present[p.id]; }); }
    function positions() { return MODALITIES[state.modality].positions; }

    function setPane(nodes) {
      content.replaceChildren(el("div", { class: "kh-pel__pane" }, nodes));
    }
    function renderTab() {
      if (state.tab === "players") renderPlayers();
      else if (state.tab === "draw") renderDraw();
      else renderHistory();
    }

    /* ---- Tipo de jogo ---- */
    function openModalityPicker() {
      KickHub.ui.modal({
        className: "kh-modal--glass kh-modal--center",
        render: function (body, handle) {
          body.appendChild(el("h2", { class: "kh-modal__title", text: "Tipo de jogo" }));
          body.appendChild(el("p", { class: "kh-modal__hint", text: "As posições dos jogadores mudam conforme a modalidade." }));
          var list = el("div", { class: "kh-pel__mod-list" });
          Object.keys(MODALITIES).forEach(function (key) {
            var m = MODALITIES[key];
            var opt = el("button", { class: "kh-pel__mod-opt" + (key === state.modality ? " is-active" : ""), type: "button" }, [
              el("strong", { text: m.label }),
              el("span", { text: m.positions.join(" · ") })
            ]);
            opt.addEventListener("click", function () {
              state.modality = key;
              store.set("pelada.modality", key);
              modalityChip.textContent = m.label;
              handle.close();
              renderTab();
            });
            list.appendChild(opt);
          });
          body.appendChild(list);
        }
      });
    }

    /* ---- Aba 1: Jogadores ---- */
    function renderPlayers() {
      var c = confirmed().length;
      var head = el("div", { class: "kh-pel__toolbar" }, [
        el("span", { class: "kh-pel__count" }, [
          el("strong", { text: String(c) }), " confirmado" + (c === 1 ? "" : "s") + " · " + state.players.length + " no elenco"
        ]),
        el("div", { class: "kh-pel__toolbar-actions" }, [
          linkBtn("Todos", function () { state.players.forEach(function (p) { state.present[p.id] = true; }); renderPlayers(); }),
          linkBtn("Limpar", function () { state.present = {}; renderPlayers(); }),
          actionBtn("+ Jogador", "kh-btn kh-btn--primary kh-btn--sm", function () { openPlayerModal(null); })
        ])
      ]);

      var body;
      if (!state.players.length) {
        body = el("div", { class: "kh-pel__empty" }, [
          el("span", { class: "kh-pel__empty-emoji", text: "⚽" }),
          el("strong", { text: "Nenhum jogador ainda" }),
          el("span", { text: "Toque em “+ Jogador” para montar seu elenco." })
        ]);
      } else {
        body = el("div", { class: "kh-pel__list" });
        state.players.forEach(function (p) {
          var check = el("input", { type: "checkbox", class: "kh-pel__check" });
          check.checked = !!state.present[p.id];
          var row = el("div", { class: "kh-pel__player" + (state.present[p.id] ? " is-on" : "") });
          ctx.on(check, "change", function () {
            state.present[p.id] = check.checked;
            row.classList.toggle("is-on", check.checked);
            head.querySelector(".kh-pel__count").replaceChildren(
              el("strong", { text: String(confirmed().length) }),
              document.createTextNode(" confirmado" + (confirmed().length === 1 ? "" : "s") + " · " + state.players.length + " no elenco")
            );
          });
          var edit = el("button", { class: "kh-pel__edit", type: "button", "aria-label": "Editar", html: KickHub.ui.icons.gear });
          ctx.on(edit, "click", function () { openPlayerModal(p); });

          row.append(
            el("label", { class: "kh-pel__pick" }, check),
            avatar(p.name),
            el("span", { class: "kh-pel__info" }, [
              el("strong", { text: p.name }),
              el("span", { class: "kh-pel__meta" }, [
                posBadge(p.position),
                el("span", { class: "kh-pel__contract kh-pel__contract--" + (p.status === "mensalista" ? "m" : "c"), text: p.status === "mensalista" ? "Mensalista" : "Convidado" })
              ])
            ]),
            el("span", { class: "kh-pel__stars", title: p.rating + "/5", text: stars(p.rating) }),
            edit
          );
          body.appendChild(row);
        });
      }
      setPane([head, body]);
    }

    function openPlayerModal(player) {
      var editing = !!player;
      KickHub.ui.modal({
        className: "kh-modal--glass",
        render: function (body, handle) {
          body.appendChild(el("h2", { class: "kh-modal__title", text: editing ? "Editar jogador" : "Novo jogador" }));
          var name = el("input", { class: "kh-input", type: "text", placeholder: "Nome do jogador" });
          if (editing) name.value = player.name;
          var pos = el("select", { class: "kh-input kh-select" },
            positions().map(function (o) { return el("option", { value: o }, o); }));
          if (editing && positions().indexOf(player.position) !== -1) pos.value = player.position;
          var rate = starPicker(editing ? player.rating : 3);
          var contract = segPicker([["mensalista", "Mensalista"], ["convidado", "Convidado"]], editing ? player.status : "convidado", "kh-seg--2");
          var err = el("p", { class: "kh-input-error" });

          var form = el("form", { class: "kh-form", autocomplete: "off" }, [
            field("Nome", name),
            field("Posição (" + MODALITIES[state.modality].label + ")", pos),
            field("Nível", rate),
            field("Contrato", contract),
            err,
            el("button", { class: "kh-btn kh-btn--primary", type: "submit", text: "Salvar" })
          ]);
          form.addEventListener("submit", function (ev) {
            ev.preventDefault();
            var nm = name.value.trim();
            if (!nm) { err.textContent = "Informe o nome."; err.classList.add("is-visible"); return; }
            var rec = {
              id: editing ? player.id : newId("pl"),
              name: nm, position: pos.value, rating: rate.getValue(),
              status: contract.getValue(), active: true,
              order_index: editing ? player.order_index : state.players.length + 1
            };
            savePlayer(rec).then(function () { handle.close(); loadPlayers().then(renderPlayers); });
          });
          body.appendChild(form);

          if (editing) {
            var del = el("button", { class: "kh-btn kh-provider kh-provider--danger", type: "button" }, [
              el("span", { class: "kh-provider__icon", html: KickHub.ui.icons.close }),
              el("span", { text: "Excluir jogador" })
            ]);
            del.addEventListener("click", function () {
              del.disabled = true; del.querySelector("span:last-child").textContent = "Excluindo…";
              delPlayer(player.id).then(function () {
                delete state.present[player.id];
                handle.close(); loadPlayers().then(renderPlayers);
              });
            });
            body.appendChild(del);
          }
          window.setTimeout(function () { name.focus(); }, 150);
        }
      });
    }

    /* ---- Aba 2: Sorteador ---- */
    function renderDraw() {
      var pool = confirmed();
      var controls = el("div", { class: "kh-pel__draw-ctrl" }, [
        field("Jogadores por time", (function () {
          var sel = el("select", { class: "kh-input kh-select" },
            [3, 4, 5, 6, 7].map(function (n) { return el("option", { value: String(n) }, n + " x " + n); }));
          sel.value = String(state.perTeam);
          ctx.on(sel, "change", function () { state.perTeam = parseInt(sel.value, 10); });
          return sel;
        })()),
        actionBtn("⚽ Sortear equilibrado", "kh-btn kh-btn--primary kh-pel__draw-btn", function () {
          if (confirmed().length < 2) { state.teams = "few"; renderDraw(); return; }
          state.teams = drawTeams(confirmed(), state.perTeam);
          renderDraw();
        })
      ]);

      var out = el("div", { class: "kh-pel__result" });
      if (state.teams === "few") {
        out.appendChild(hint("Marque pelo menos 2 jogadores na aba Jogadores."));
      } else if (state.teams) {
        out.append(
          el("div", { class: "kh-pel__teams" }, [
            teamCard("Time Colete", state.teams.a, state.teams.avgA, "a"),
            teamCard("Time Sem Colete", state.teams.b, state.teams.avgB, "b")
          ])
        );
        if (state.teams.bench.length) {
          out.appendChild(el("div", { class: "kh-pel__bench" }, [
            el("strong", { text: "Reservas" }),
            el("span", { text: state.teams.bench.map(function (p) { return p.name; }).join(", ") })
          ]));
        }
        out.appendChild(actionBtn("💾 Salvar no histórico", "kh-btn kh-btn--primary kh-pel__save", function () {
          var rec = {
            id: newId("pel"), date: new Date().toISOString().slice(0, 10), modality: state.modality,
            team_a: state.teams.a.map(function (p) { return p.id; }),
            team_b: state.teams.b.map(function (p) { return p.id; }),
            name_a: "Time Colete", name_b: "Time Sem Colete",
            score_a: 0, score_b: 0, scorers: [], order_index: Date.now()
          };
          saveHistory(rec).then(loadHistory).then(function () { state.tab = "history"; syncTabs(); renderTab(); });
        }));
      } else {
        out.appendChild(hint(pool.length + " confirmados. Toque em Sortear para gerar os times."));
      }
      setPane([controls, out]);
    }

    function teamCard(title, players, avg, side) {
      return el("div", { class: "kh-pel__team kh-pel__team--" + side }, [
        el("div", { class: "kh-pel__team-head" }, [
          el("strong", { text: title }),
          el("span", { class: "kh-pel__team-avg", text: avg.toFixed(1) + " ★" })
        ]),
        el("div", { class: "kh-pel__team-list" }, players.map(function (p) {
          return el("div", { class: "kh-pel__team-player" }, [
            avatar(p.name, "kh-pel-av--sm"),
            el("span", { class: "kh-pel__team-name", text: p.name }),
            posBadge(p.position),
            el("span", { class: "kh-pel__stars kh-pel__stars--sm", text: stars(p.rating) })
          ]);
        }))
      ]);
    }

    /* ---- Aba 3: Histórico & Placar ---- */
    function renderHistory() {
      var head = el("div", { class: "kh-pel__toolbar" }, [
        el("span", { class: "kh-pel__count" }, [el("strong", { text: String(state.history.length) }), " pelada" + (state.history.length === 1 ? "" : "s")]),
        actionBtn("+ Registrar placar", "kh-btn kh-btn--primary kh-btn--sm", function () {
          var rec = {
            id: newId("pel"), date: new Date().toISOString().slice(0, 10), modality: state.modality,
            team_a: [], team_b: [], name_a: "Time A", name_b: "Time B", score_a: 0, score_b: 0, scorers: [], order_index: Date.now()
          };
          saveHistory(rec).then(loadHistory).then(function () { renderHistory(); openHistoryModal(rec); });
        })
      ]);

      var body;
      if (!state.history.length) {
        body = el("div", { class: "kh-pel__empty" }, [
          el("span", { class: "kh-pel__empty-emoji", text: "📋" }),
          el("strong", { text: "Nenhuma pelada salva" }),
          el("span", { text: "Sorteie times e salve, ou registre um placar." })
        ]);
      } else {
        body = el("div", { class: "kh-pel__history" });
        state.history.forEach(function (h) {
          var card = el("button", { class: "kh-pel__match", type: "button" }, [
            el("div", { class: "kh-pel__match-top" }, [
              el("span", { class: "kh-pel__match-date", text: fmtDate(h.date) }),
              el("span", { class: "kh-pel__mod-tag", text: (MODALITIES[h.modality] || {}).label || h.modality || "" })
            ]),
            el("div", { class: "kh-pel__match-score" }, [
              el("span", { class: "kh-pel__match-team", text: h.name_a || "Time A" }),
              el("strong", { class: "kh-pel__match-num", text: (h.score_a || 0) + " × " + (h.score_b || 0) }),
              el("span", { class: "kh-pel__match-team", text: h.name_b || "Time B" })
            ])
          ]);
          card.addEventListener("click", function () { openHistoryModal(h); });
          body.appendChild(card);
        });
      }
      setPane([head, body]);
    }

    function openHistoryModal(h) {
      KickHub.ui.modal({
        className: "kh-modal--glass",
        render: function (body, handle) {
          body.appendChild(el("h2", { class: "kh-modal__title", text: "Editar pelada" }));
          body.appendChild(el("p", { class: "kh-modal__hint", text: fmtDate(h.date) + " · " + ((MODALITIES[h.modality] || {}).label || "") }));

          var nameA = el("input", { class: "kh-input", type: "text", value: h.name_a || "Time A" });
          var nameB = el("input", { class: "kh-input", type: "text", value: h.name_b || "Time B" });
          var scoreA = h.score_a || 0, scoreB = h.score_b || 0;
          var scoreAEl = el("span", { class: "kh-pel__score", text: String(scoreA) });
          var scoreBEl = el("span", { class: "kh-pel__score", text: String(scoreB) });

          var board = el("div", { class: "kh-pel__board" }, [
            el("div", { class: "kh-pel__board-side" }, [
              nameA,
              scoreAEl,
              stepper(function (d) { scoreA = Math.max(0, scoreA + d); scoreAEl.textContent = scoreA; })
            ]),
            el("span", { class: "kh-pel__board-x", text: "×" }),
            el("div", { class: "kh-pel__board-side" }, [
              nameB,
              scoreBEl,
              stepper(function (d) { scoreB = Math.max(0, scoreB + d); scoreBEl.textContent = scoreB; })
            ])
          ]);

          // Artilheiros: jogadores das duas equipes com contador de gols.
          var goalMap = {};
          (h.scorers || []).forEach(function (s) { goalMap[s.id] = s.goals; });
          var ids = (h.team_a || []).concat(h.team_b || []);
          var scorersBox = el("div", { class: "kh-pel__scorers" });
          if (ids.length) {
            scorersBox.appendChild(el("strong", { class: "kh-pel__scorers-title", text: "Quem fez os gols" }));
            ids.forEach(function (id) {
              var val = el("span", { class: "kh-pel__goal-num", text: String(goalMap[id] || 0) });
              scorersBox.appendChild(el("div", { class: "kh-pel__scorer" }, [
                avatar(playerName(id), "kh-pel-av--sm"),
                el("span", { class: "kh-pel__scorer-name", text: playerName(id) }),
                val,
                stepper(function (d) { goalMap[id] = Math.max(0, (goalMap[id] || 0) + d); val.textContent = goalMap[id]; })
              ]));
            });
          }

          var save = el("button", { class: "kh-btn kh-btn--primary", type: "button", text: "Salvar alterações" });
          save.addEventListener("click", function () {
            var scorers = Object.keys(goalMap).filter(function (id) { return goalMap[id] > 0; })
              .map(function (id) { return { id: id, goals: goalMap[id] }; });
            var rec = Object.assign({}, h, {
              name_a: nameA.value.trim() || "Time A", name_b: nameB.value.trim() || "Time B",
              score_a: scoreA, score_b: scoreB, scorers: scorers
            });
            saveHistory(rec).then(loadHistory).then(function () { handle.close(); renderHistory(); });
          });

          var del = el("button", { class: "kh-btn kh-provider kh-provider--danger", type: "button" }, [
            el("span", { class: "kh-provider__icon", html: KickHub.ui.icons.close }),
            el("span", { text: "Excluir pelada" })
          ]);
          del.addEventListener("click", function () {
            delHistory(h.id).then(loadHistory).then(function () { handle.close(); renderHistory(); });
          });

          body.append(board, scorersBox, save, del);
        }
      });
    }

    function syncTabs() {
      seg.querySelectorAll(".kh-seg__btn").forEach(function (x, i) {
        x.classList.toggle("is-active", ["players", "draw", "history"][i] === state.tab);
      });
    }
  }

  /* ------------------------------- helpers UI --------------------------- */
  function field(label, control) {
    return el("label", { class: "kh-field" }, [el("small", { text: label }), control]);
  }
  function actionBtn(label, cls, onClick) {
    var b = el("button", { class: cls, type: "button", text: label });
    b.addEventListener("click", onClick);
    return b;
  }
  function linkBtn(label, onClick) {
    var b = el("button", { class: "kh-link-btn", type: "button", text: label });
    b.addEventListener("click", onClick);
    return b;
  }
  function stepper(onStep) {
    return el("div", { class: "kh-pel__stepper" }, [
      actionBtn("−", "kh-btn kh-btn--ghost kh-btn--sm", function () { onStep(-1); }),
      actionBtn("+", "kh-btn kh-btn--primary kh-btn--sm", function () { onStep(1); })
    ]);
  }
  function hint(text) { return el("p", { class: "kh-empty", text: text }); }

  /* ------------------------------- REGISTRO ----------------------------- */
  KickHub.registerApp({
    id: "pelada",
    parent: null,
    locked: true,
    password: "futeballs",
    title: "Pelada Hub",
    subtitle: "Protegido · Futebol",
    theme: "green",
    order: 20,
    icon: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20"/><path d="M32 18l6 4-2 7h-8l-2-7 6-4Z"/><path d="M14 30l8 2 3 8M50 30l-8 2-3 8M26 45l6 3 6-3"/></svg>',
    mount: render
  });
})();
