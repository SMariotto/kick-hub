/* =====================================================================
   Pelada Hub (app-pelada.js)
   Gestão de futebol premium: elenco, montagem de times (automática por
   rating OU manual em draft, com N times livres) e histórico editável.
   Protegido por passcode. Dados 100% via ctx.db (offline-first).
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
  function roleOf(pos) { return ROLE[pos] || "mid"; }

  if (KickHub.db) KickHub.db.seed("pelada_players", []); // sem jogadores fake

  function initials(name) {
    return String(name || "?").trim().split(/\s+/).slice(0, 2)
      .map(function (w) { return w.charAt(0); }).join("").toUpperCase();
  }
  function stars(n) { n = Math.max(0, Math.min(5, n | 0)); return new Array(n + 1).join("★") + new Array(6 - n).join("☆"); }
  function byRatingDesc(a, b) { return b.rating - a.rating; }
  function fmtDate(d) { var p = String(d).split("-"); return p.length === 3 ? p[2] + "/" + p[1] : d; }
  function newId(p) { return p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
  function teamName(i) { return "Time " + String.fromCharCode(65 + i); }
  function avgOf(list) { return list.length ? list.reduce(function (s, p) { return s + (p.rating || 0); }, 0) / list.length : 0; }

  // Montagem automática em N times: goleiros isolados, defensores
  // distribuídos igualmente, restante pelo rating equilibrando as médias.
  function autoDraw(players, numTeams, perTeam) {
    var teams = [];
    for (var i = 0; i < numTeams; i++) teams.push({ name: teamName(i), players: [], positions: {}, sum: 0, def: 0 });
    var pool = players.slice().sort(function () { return Math.random() - 0.5; });
    var gk = pool.filter(function (p) { return roleOf(p.position) === "gk"; }).sort(byRatingDesc);
    var def = pool.filter(function (p) { return roleOf(p.position) === "def"; }).sort(byRatingDesc);
    var rest = pool.filter(function (p) { var r = roleOf(p.position); return r !== "gk" && r !== "def"; }).sort(byRatingDesc);
    var bench = [];
    function cap(t) { return !perTeam || t.players.length < perTeam; }
    function place(p, t) { t.players.push(p); t.positions[p.id] = p.position; t.sum += p.rating; if (roleOf(p.position) === "def") t.def++; }
    function pick(byDef) {
      var open = teams.filter(cap);
      if (!open.length) return null;
      return open.sort(function (a, b) {
        if (byDef && a.def !== b.def) return a.def - b.def;
        return a.sum - b.sum || a.players.length - b.players.length;
      })[0];
    }
    gk.forEach(function (p) { var t = pick(false); if (t) place(p, t); else bench.push(p); });
    def.forEach(function (p) { var t = pick(true); if (t) place(p, t); else bench.push(p); });
    rest.forEach(function (p) { var t = pick(false); if (t) place(p, t); else bench.push(p); });
    teams.forEach(function (t) { delete t.sum; delete t.def; });
    return { teams: teams, bench: bench };
  }

  /* ------------------------------ Componentes --------------------------- */
  function posBadge(pos) { return el("span", { class: "kh-pos kh-pos--" + roleOf(pos), text: pos || "—" }); }
  function avatar(name, cls) { return el("span", { class: "kh-pel-av" + (cls ? " " + cls : ""), text: initials(name) }); }
  function starPicker(initial) {
    var val = initial || 3, wrap = el("div", { class: "kh-rate" }), btns = [];
    for (var i = 1; i <= 5; i++) (function (n) {
      var s = el("button", { type: "button", class: "kh-rate__star" + (n <= val ? " is-on" : ""), text: "★" });
      s.addEventListener("click", function () { val = n; btns.forEach(function (b, idx) { b.classList.toggle("is-on", idx < val); }); });
      btns.push(s); wrap.appendChild(s);
    })(i);
    wrap.getValue = function () { return val; };
    return wrap;
  }
  function segPicker(options, initial, cls) {
    var val = initial || options[0][0], wrap = el("div", { class: "kh-seg " + (cls || "") });
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "kh-seg__btn" + (o[0] === val ? " is-active" : ""), text: o[1] });
      b.addEventListener("click", function () { val = o[0]; wrap.querySelectorAll(".kh-seg__btn").forEach(function (x) { x.classList.toggle("is-active", x === b); }); if (wrap._on) wrap._on(val); });
      wrap.appendChild(b);
    });
    wrap.getValue = function () { return val; };
    wrap.onChange = function (fn) { wrap._on = fn; return wrap; };
    return wrap;
  }

  /* -------------------------------- VIEW -------------------------------- */
  function render(host, ctx) {
    var state = {
      tab: "players", players: [], history: [], present: {},
      modality: store.get("pelada.modality", "society"),
      mode: "auto", numTeams: 2, perTeam: 5,
      teams: null, bench: []
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
        el("div", null, [el("p", { class: "kh-eyebrow", text: "Pelada Hub" }), el("h2", { class: "kh-pel__title", text: "Futebol & Times" })]),
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
        state.history = (rows || []).slice().sort(function (a, b) { return String(b.date).localeCompare(a.date) || (b.order_index || 0) - (a.order_index || 0); });
        return state.history;
      }).catch(function () { state.history = []; return state.history; });
    }
    function savePlayer(r) { return ctx.db ? ctx.db.collection("pelada_players").upsert(r) : Promise.resolve(); }
    function delPlayer(id) { return ctx.db ? ctx.db.collection("pelada_players").remove(id) : Promise.resolve(); }
    function saveHist(r) { return ctx.db ? ctx.db.collection("pelada_history").upsert(r) : Promise.resolve(); }
    function delHist(id) { return ctx.db ? ctx.db.collection("pelada_history").remove(id) : Promise.resolve(); }
    function playerName(id) { for (var i = 0; i < state.players.length; i++) if (state.players[i].id === id) return state.players[i].name; return "Removido"; }
    function playerBy(id) { for (var i = 0; i < state.players.length; i++) if (state.players[i].id === id) return state.players[i]; return null; }
    function confirmed() { return state.players.filter(function (p) { return state.present[p.id]; }); }
    function positions() { return MODALITIES[state.modality].positions; }
    function setPane(nodes) { content.replaceChildren(el("div", { class: "kh-pel__pane" }, nodes)); }
    function renderTab() { state.tab === "players" ? renderPlayers() : state.tab === "draw" ? renderDraw() : renderHistory(); }

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
              el("strong", { text: m.label }), el("span", { text: m.positions.join(" · ") })
            ]);
            opt.addEventListener("click", function () {
              state.modality = key; store.set("pelada.modality", key); modalityChip.textContent = m.label;
              handle.close(); renderTab();
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
        countLabel(c),
        el("div", { class: "kh-pel__toolbar-actions" }, [
          linkBtn("Todos", function () { state.players.forEach(function (p) { state.present[p.id] = true; }); renderPlayers(); }),
          linkBtn("Limpar", function () { state.present = {}; renderPlayers(); }),
          actionBtn("+ Jogador", "kh-btn kh-btn--primary kh-btn--sm", function () { openPlayerModal(null); })
        ])
      ]);

      var body;
      if (!state.players.length) {
        body = emptyState("⚽", "Nenhum jogador ainda", "Toque em “+ Jogador” para montar seu elenco.");
      } else {
        body = el("div", { class: "kh-pel__list" });
        state.players.forEach(function (p) {
          var check = el("input", { type: "checkbox", class: "kh-pel__check" });
          check.checked = !!state.present[p.id];
          var row = el("div", { class: "kh-pel__player" + (state.present[p.id] ? " is-on" : "") });
          ctx.on(check, "change", function () {
            state.present[p.id] = check.checked; row.classList.toggle("is-on", check.checked);
            head.replaceChildren(countLabel(confirmed().length), head.querySelector(".kh-pel__toolbar-actions"));
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
          var pos = el("select", { class: "kh-input kh-select" }, positions().map(function (o) { return el("option", { value: o }, o); }));
          if (editing && positions().indexOf(player.position) !== -1) pos.value = player.position;
          var rate = starPicker(editing ? player.rating : 3);
          var contract = segPicker([["mensalista", "Mensalista"], ["convidado", "Convidado"]], editing ? player.status : "convidado", "kh-seg--2");
          var err = el("p", { class: "kh-input-error" });
          var form = el("form", { class: "kh-form", autocomplete: "off" }, [
            field("Nome", name),
            field("Posição padrão (" + MODALITIES[state.modality].label + ")", pos),
            field("Nível", rate), field("Contrato", contract), err,
            el("button", { class: "kh-btn kh-btn--primary", type: "submit", text: "Salvar" })
          ]);
          form.addEventListener("submit", function (ev) {
            ev.preventDefault();
            var nm = name.value.trim();
            if (!nm) { err.textContent = "Informe o nome."; err.classList.add("is-visible"); return; }
            savePlayer({
              id: editing ? player.id : newId("pl"), name: nm, position: pos.value, rating: rate.getValue(),
              status: contract.getValue(), active: true, order_index: editing ? player.order_index : state.players.length + 1
            }).then(function () { handle.close(); loadPlayers().then(renderPlayers); });
          });
          body.appendChild(form);
          if (editing) {
            var del = dangerBtn("Excluir jogador", function () {
              delPlayer(player.id).then(function () { delete state.present[player.id]; handle.close(); loadPlayers().then(renderPlayers); });
            });
            body.appendChild(del);
          }
          window.setTimeout(function () { name.focus(); }, 150);
        }
      });
    }

    /* ---- Aba 2: Sorteador / Montagem ---- */
    function ensureManualTeams() {
      if (!state.teams || state.teams.length !== state.numTeams || state._teamsMode !== "manual") {
        state.teams = [];
        for (var i = 0; i < state.numTeams; i++) state.teams.push({ name: teamName(i), players: [], positions: {} });
        state._teamsMode = "manual";
      }
    }
    function assignedIds() { var s = {}; (state.teams || []).forEach(function (t) { t.players.forEach(function (p) { s[p.id] = true; }); }); return s; }

    function renderDraw() {
      var modeSeg = segPicker([["auto", "Automático"], ["manual", "Manual (Draft)"]], state.mode, "kh-seg--2");
      modeSeg.onChange(function (m) { state.mode = m; state.teams = null; state.bench = []; renderDraw(); });

      var numInput = el("input", { class: "kh-input", type: "number", min: "2", max: "8", value: String(state.numTeams) });
      ctx.on(numInput, "change", function () {
        state.numTeams = Math.max(2, Math.min(8, parseInt(numInput.value, 10) || 2));
        numInput.value = String(state.numTeams); state.teams = null; renderDraw();
      });
      var perInput = el("input", { class: "kh-input", type: "number", min: "1", value: String(state.perTeam) });
      ctx.on(perInput, "change", function () { state.perTeam = Math.max(1, parseInt(perInput.value, 10) || 1); perInput.value = String(state.perTeam); });

      var configItems = [field("Modo", modeSeg), field("Nº de times", numInput)];
      if (state.mode === "auto") configItems.push(field("Por time (máx.)", perInput));
      var config = el("div", { class: "kh-pel__cfg" }, configItems);

      var out = el("div", { class: "kh-pel__result" });
      if (state.mode === "auto") renderAuto(out);
      else renderManual(out);

      setPane([config, out]);
    }

    function renderAuto(out) {
      out.appendChild(actionBtn("⚽ Sortear equilibrado", "kh-btn kh-btn--primary kh-pel__draw-btn", function () {
        if (confirmed().length < state.numTeams) { state.teams = "few"; renderDraw(); return; }
        var r = autoDraw(confirmed(), state.numTeams, state.perTeam);
        state.teams = r.teams; state.bench = r.bench; state._teamsMode = "auto"; renderDraw();
      }));
      if (state.teams === "few") { out.appendChild(hint("Marque pelo menos " + state.numTeams + " jogadores confirmados.")); return; }
      if (state.teams && state._teamsMode === "auto") {
        out.appendChild(teamsGrid(state.teams, null));
        if (state.bench.length) out.appendChild(benchRow(state.bench));
        out.appendChild(saveBtn());
      } else {
        out.appendChild(hint(confirmed().length + " confirmados. Toque em Sortear."));
      }
    }

    function renderManual(out) {
      ensureManualTeams();
      var assigned = assignedIds();
      var pool = confirmed().filter(function (p) { return !assigned[p.id]; });

      out.appendChild(el("div", { class: "kh-pel__pool" }, [
        el("strong", { class: "kh-pel__pool-title", text: "No banco (" + pool.length + ")" }),
        pool.length
          ? el("div", { class: "kh-pel__chips" }, pool.map(function (p) {
              var chip = el("button", { class: "kh-pel__chip", type: "button" }, [
                avatar(p.name, "kh-pel-av--sm"), el("span", { text: p.name }), el("span", { class: "kh-pel__chip-star", text: "★" + p.rating })
              ]);
              chip.addEventListener("click", function () { openAssign(p); });
              return chip;
            }))
          : el("span", { class: "kh-pel__muted", text: "Todos escalados. Clique num jogador dentro do time para tirá-lo." })
      ]));

      out.appendChild(teamsGrid(state.teams, function (p) { unassign(p); renderDraw(); }));
      var anyAssigned = state.teams.some(function (t) { return t.players.length; });
      if (anyAssigned) out.appendChild(saveBtn());
    }

    function openAssign(player) {
      KickHub.ui.modal({
        className: "kh-modal--glass kh-modal--center",
        render: function (body, handle) {
          body.appendChild(el("h2", { class: "kh-modal__title", text: "Escalar " + player.name }));
          var pos = el("select", { class: "kh-input kh-select" }, positions().map(function (o) { return el("option", { value: o }, o); }));
          if (positions().indexOf(player.position) !== -1) pos.value = player.position;
          body.appendChild(field("Posição nesta partida", pos));
          var teamsRow = el("div", { class: "kh-pel__assign-teams" }, state.teams.map(function (t, idx) {
            var b = el("button", { class: "kh-btn kh-btn--primary", type: "button", text: t.name });
            b.addEventListener("click", function () {
              t.players.push(player); t.positions[player.id] = pos.value; handle.close(); renderDraw();
            });
            return b;
          }));
          body.appendChild(el("p", { class: "kh-modal__hint", text: "Para qual time?" }));
          body.appendChild(teamsRow);
        }
      });
    }
    function unassign(player) {
      state.teams.forEach(function (t) {
        var i = t.players.map(function (p) { return p.id; }).indexOf(player.id);
        if (i !== -1) { t.players.splice(i, 1); delete t.positions[player.id]; }
      });
    }

    function teamsGrid(teams, onRemove) {
      return el("div", { class: "kh-pel__teams", style: "--cols:" + Math.min(teams.length, 2) }, teams.map(function (t, idx) {
        return el("div", { class: "kh-pel__team kh-pel__team--" + (idx % 4) }, [
          el("div", { class: "kh-pel__team-head" }, [
            el("strong", { text: t.name }),
            el("span", { class: "kh-pel__team-avg", text: t.players.length ? avgOf(t.players).toFixed(1) + " ★" : "—" })
          ]),
          t.players.length
            ? el("div", { class: "kh-pel__team-list" }, t.players.map(function (p) {
                var node = el("div", { class: "kh-pel__team-player" + (onRemove ? " is-clickable" : "") }, [
                  avatar(p.name, "kh-pel-av--sm"), el("span", { class: "kh-pel__team-name", text: p.name }),
                  posBadge(t.positions[p.id] || p.position), el("span", { class: "kh-pel__stars kh-pel__stars--sm", text: stars(p.rating) })
                ]);
                if (onRemove) node.addEventListener("click", function () { onRemove(p); });
                return node;
              }))
            : el("span", { class: "kh-pel__muted kh-pel__team-empty", text: "Sem jogadores" })
        ]);
      }));
    }
    function benchRow(bench) {
      return el("div", { class: "kh-pel__bench" }, [el("strong", { text: "Reservas" }), el("span", { text: bench.map(function (p) { return p.name; }).join(", ") })]);
    }
    function saveBtn() {
      return actionBtn("💾 Salvar no histórico", "kh-btn kh-btn--primary kh-pel__save", function () {
        var rec = {
          id: newId("pel"), date: new Date().toISOString().slice(0, 10), modality: state.modality,
          teams: state.teams.map(function (t) { return { name: t.name, players: t.players.map(function (p) { return p.id; }), positions: t.positions }; }),
          scores: state.teams.map(function () { return 0; }), scorers: [], order_index: Date.now()
        };
        saveHist(rec).then(loadHistory).then(function () { state.tab = "history"; syncTabs(); renderTab(); });
      });
    }

    /* ---- Aba 3: Histórico & Placar ---- */
    function normHistory(h) {
      if (h.teams && h.teams.length) return { teams: h.teams, scores: h.scores || h.teams.map(function () { return 0; }) };
      return {
        teams: [{ name: h.name_a || "Time A", players: h.team_a || [], positions: {} }, { name: h.name_b || "Time B", players: h.team_b || [], positions: {} }],
        scores: [h.score_a || 0, h.score_b || 0]
      };
    }
    function renderHistory() {
      var head = el("div", { class: "kh-pel__toolbar" }, [
        el("span", { class: "kh-pel__count" }, [el("strong", { text: String(state.history.length) }), " pelada" + (state.history.length === 1 ? "" : "s")]),
        actionBtn("+ Registrar placar", "kh-btn kh-btn--primary kh-btn--sm", function () {
          var rec = {
            id: newId("pel"), date: new Date().toISOString().slice(0, 10), modality: state.modality,
            teams: [{ name: "Time A", players: [], positions: {} }, { name: "Time B", players: [], positions: {} }],
            scores: [0, 0], scorers: [], order_index: Date.now()
          };
          saveHist(rec).then(loadHistory).then(function () { renderHistory(); openHistoryModal(rec); });
        })
      ]);
      var body;
      if (!state.history.length) {
        body = emptyState("📋", "Nenhuma pelada salva", "Monte os times e salve, ou registre um placar.");
      } else {
        body = el("div", { class: "kh-pel__history" });
        state.history.forEach(function (h) {
          var v = normHistory(h);
          var card = el("button", { class: "kh-pel__match", type: "button" }, [
            el("div", { class: "kh-pel__match-top" }, [
              el("span", { class: "kh-pel__match-date", text: fmtDate(h.date) }),
              el("span", { class: "kh-pel__mod-tag", text: (MODALITIES[h.modality] || {}).label || h.modality || "" })
            ]),
            el("div", { class: "kh-pel__match-teams" }, v.teams.map(function (t, i) {
              return el("span", { class: "kh-pel__match-cell" }, [
                el("span", { class: "kh-pel__match-team", text: t.name }),
                el("strong", { class: "kh-pel__match-num", text: String(v.scores[i] || 0) })
              ]);
            }))
          ]);
          card.addEventListener("click", function () { openHistoryModal(h); });
          body.appendChild(card);
        });
      }
      setPane([head, body]);
    }

    function openHistoryModal(h) {
      var v = normHistory(h);
      KickHub.ui.modal({
        className: "kh-modal--glass",
        render: function (body, handle) {
          body.appendChild(el("h2", { class: "kh-modal__title", text: "Editar pelada" }));
          body.appendChild(el("p", { class: "kh-modal__hint", text: fmtDate(h.date) + " · " + ((MODALITIES[h.modality] || {}).label || "") }));

          var nameInputs = [], scoreState = v.scores.slice();
          var teamsBox = el("div", { class: "kh-pel__edit-teams" }, v.teams.map(function (t, i) {
            var nm = el("input", { class: "kh-input", type: "text", value: t.name }); nameInputs.push(nm);
            var scoreEl = el("span", { class: "kh-pel__score", text: String(scoreState[i] || 0) });
            return el("div", { class: "kh-pel__edit-team" }, [
              nm, scoreEl,
              stepper(function (d) { scoreState[i] = Math.max(0, (scoreState[i] || 0) + d); scoreEl.textContent = scoreState[i]; })
            ]);
          }));

          var goalMap = {}; (h.scorers || []).forEach(function (s) { goalMap[s.id] = s.goals; });
          var allIds = []; v.teams.forEach(function (t) { (t.players || []).forEach(function (id) { if (allIds.indexOf(id) === -1) allIds.push(id); }); });
          var scorersBox = el("div", { class: "kh-pel__scorers" });
          if (allIds.length) {
            scorersBox.appendChild(el("strong", { class: "kh-pel__scorers-title", text: "Quem fez os gols" }));
            allIds.forEach(function (id) {
              var val = el("span", { class: "kh-pel__goal-num", text: String(goalMap[id] || 0) });
              scorersBox.appendChild(el("div", { class: "kh-pel__scorer" }, [
                avatar(playerName(id), "kh-pel-av--sm"), el("span", { class: "kh-pel__scorer-name", text: playerName(id) }), val,
                stepper(function (d) { goalMap[id] = Math.max(0, (goalMap[id] || 0) + d); val.textContent = goalMap[id]; })
              ]));
            });
          }

          var save = actionBtn("Salvar alterações", "kh-btn kh-btn--primary", function () {
            var teams = v.teams.map(function (t, i) { return { name: nameInputs[i].value.trim() || teamName(i), players: t.players, positions: t.positions || {} }; });
            var scorers = Object.keys(goalMap).filter(function (id) { return goalMap[id] > 0; }).map(function (id) { return { id: id, goals: goalMap[id] }; });
            saveHist(Object.assign({}, h, { teams: teams, scores: scoreState, scorers: scorers })).then(loadHistory).then(function () { handle.close(); renderHistory(); });
          });
          var del = dangerBtn("Excluir pelada", function () { delHist(h.id).then(loadHistory).then(function () { handle.close(); renderHistory(); }); });

          body.append(teamsBox, scorersBox, save, del);
        }
      });
    }

    function countLabel(c) {
      return el("span", { class: "kh-pel__count" }, [el("strong", { text: String(c) }), " confirmado" + (c === 1 ? "" : "s") + " · " + state.players.length + " no elenco"]);
    }
    function syncTabs() { seg.querySelectorAll(".kh-seg__btn").forEach(function (x, i) { x.classList.toggle("is-active", ["players", "draw", "history"][i] === state.tab); }); }
  }

  /* ------------------------------- helpers UI --------------------------- */
  function field(label, control) { return el("label", { class: "kh-field" }, [el("small", { text: label }), control]); }
  function actionBtn(label, cls, onClick) { var b = el("button", { class: cls, type: "button", text: label }); b.addEventListener("click", onClick); return b; }
  function linkBtn(label, onClick) { var b = el("button", { class: "kh-link-btn", type: "button", text: label }); b.addEventListener("click", onClick); return b; }
  function dangerBtn(label, onClick) {
    var b = el("button", { class: "kh-btn kh-provider kh-provider--danger", type: "button" }, [el("span", { class: "kh-provider__icon", html: KickHub.ui.icons.close }), el("span", { text: label })]);
    b.addEventListener("click", onClick); return b;
  }
  function stepper(onStep) {
    return el("div", { class: "kh-pel__stepper" }, [
      actionBtn("−", "kh-btn kh-btn--ghost kh-btn--sm", function () { onStep(-1); }),
      actionBtn("+", "kh-btn kh-btn--primary kh-btn--sm", function () { onStep(1); })
    ]);
  }
  function hint(text) { return el("p", { class: "kh-empty", text: text }); }
  function emptyState(emoji, title, sub) {
    return el("div", { class: "kh-pel__empty" }, [el("span", { class: "kh-pel__empty-emoji", text: emoji }), el("strong", { text: title }), el("span", { text: sub })]);
  }

  /* ------------------------------- REGISTRO ----------------------------- */
  KickHub.registerApp({
    id: "pelada", parent: null, locked: true, password: "futeballs",
    title: "Pelada Hub", subtitle: "Protegido · Futebol", theme: "green", order: 20,
    icon: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="20"/><path d="M32 18l6 4-2 7h-8l-2-7 6-4Z"/><path d="M14 30l8 2 3 8M50 30l-8 2-3 8M26 45l6 3 6-3"/></svg>',
    mount: render
  });
})();
