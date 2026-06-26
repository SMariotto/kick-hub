/* =====================================================================
   Plugin: Calendário (app-calendario.js)
   ---------------------------------------------------------------------
   Agenda escolar. Mostra o mês em grade e abre o detalhe do dia num
   modal genérico do Core. O atalho "Ir para Resumo" é um link CRUZADO
   por id (ctx.navigate("resumos", { subjectId })) — sem o Core nem este
   app conhecerem a implementação do outro.
   ===================================================================== */
(function () {
  "use strict";
  if (!window.KickHub) return;

  var el = KickHub.ui.el;

  /* 1) DADOS / REGRA. */
  var EVENTS = [
    {
      "date": "2026-06-24",
      "subjectId": "matematica-a",
      "title": "Matemática (A)",
      "time": "1º Aula",
      "type": "Prova",
      "warnings": [
        "As avaliações da 1ª aula começam impreterivelmente às 7h.",
        "Não será permitida a entrada de alunos após esse horário.",
        "Avaliação substitutiva mediante taxa de R$70,00 na secretaria."
      ]
    },
    {
      "date": "2026-06-24",
      "subjectId": "matematica-b",
      "title": "Matemática (B)",
      "time": "1º Aula",
      "type": "Prova",
      "warnings": [
        "As avaliações da 1ª aula começam impreterivelmente às 7h.",
        "Não será permitida a entrada de alunos após esse horário.",
        "Avaliação substitutiva mediante taxa de R$70,00 na secretaria."
      ]
    },
    {
      "date": "2026-06-24",
      "subjectId": "arte",
      "title": "Artes",
      "time": "4º Aula",
      "type": "Prova",
      "warnings": [
        "Avaliação substitutiva mediante taxa de R$70,00 na secretaria."
      ]
    },
    {
      "date": "2026-06-25",
      "subjectId": null,
      "title": "Espanhol",
      "time": "2º Aula",
      "type": "Prova",
      "warnings": [
        "Avaliação substitutiva mediante taxa de R$70,00 na secretaria."
      ]
    },
    {
      "date": "2026-06-25",
      "subjectId": "fisica",
      "title": "Física",
      "time": "5º Aula",
      "type": "Prova",
      "warnings": [
        "Avaliação substitutiva mediante taxa de R$70,00 na secretaria."
      ]
    },
    {
      "date": "2026-06-25",
      "subjectId": null,
      "title": "Atividade de Química (Personagem)",
      "time": "5º Aula",
      "type": "Trabalho",
      "warnings": [
        "Data limite para a entrega. (Segunda chance valem 5 pontos)"
      ]
    },
    {
      "date": "2026-06-26",
      "subjectId": null,
      "title": "História",
      "time": "1ª Aula",
      "type": "Prova",
      "warnings": [
        "As avaliações da 1ª aula começam impreterivelmente às 7h.",
        "Não será permitida a entrada de alunos após esse horário.",
        "Avaliação substitutiva mediante taxa de R$70,00 na secretaria."
      ]
    },
    {
      "date": "2026-06-26",
      "subjectId": null,
      "title": "Fundamentos à Tecnologia de Informação e Hardware",
      "time": "3ª Aula",
      "type": "Avaliação por projeto",
      "warnings": [
        "Avaliação por projeto no período regular de aula."
      ]
    },
    {
      "date": "2026-06-26",
      "subjectId": null,
      "title": "Atividade Cultural Festa da Amizade",
      "time": "5º Aula",
      "type": "Atividade interna",
      "warnings": [
        "Evento interno da escola."
      ]
    },
    {
      "date": "2026-06-29",
      "subjectId": "circuitos",
      "title": "Circuitos de Programação Integrados",
      "time": "2ª Aula",
      "type": "Avaliação por projeto",
      "warnings": [
        "Avaliação por projeto no período regular de aula."
      ]
    },
    {
      "date": "2026-06-29",
      "subjectId": null,
      "title": "Projeto de Vida",
      "time": "5ª Aula",
      "type": "Prova",
      "warnings": [
        "Avaliação substitutiva mediante taxa de R$70,00 na secretaria."
      ]
    },
    {
      "date": "2026-06-30",
      "subjectId": null,
      "title": "Geografia",
      "time": "2ª Aula",
      "type": "Prova",
      "warnings": [
        "Avaliação substitutiva mediante taxa de R$70,00 na secretaria."
      ]
    },
    {
      "date": "2026-06-30",
      "subjectId": "logica",
      "title": "Lógica e Algoritmos de Programação",
      "time": "6ª Aula",
      "type": "Avaliação por projeto",
      "warnings": [
        "Avaliação por projeto no período regular de aula."
      ]
    }
  ];

  function eventsByDate() {
    return EVENTS.reduce(function (acc, ev) {
      (acc[ev.date] = acc[ev.date] || []).push(ev);
      return acc;
    }, {});
  }
  function dateKey(date) {
    return date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0");
  }
  function parseKey(key) {
    var p = key.split("-").map(Number);
    return new Date(p[0], p[1] - 1, p[2]);
  }
  function formatLong(key) {
    return parseKey(key).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  }
  function initialMonth() {
    var sorted = EVENTS.slice().sort(function (a, b) { return a.date.localeCompare(b.date); });
    if (sorted.length) {
      var p = sorted[0].date.split("-").map(Number);
      return new Date(p[0], p[1] - 1, 1);
    }
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  var WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  /* 2) VIEW. */
  function render(host, ctx) {
    var month = initialMonth();
    var byDate = eventsByDate();

    var title = el("h2", { class: "kh-cal__title" });
    var grid = el("div", { class: "kh-cal__grid" });

    var head = el("div", { class: "kh-cal__head" }, [
      el("div", null, [
        el("p", { class: "kh-eyebrow", text: "Agenda escolar" }),
        title
      ]),
      el("div", { class: "kh-cal__nav" }, [
        navBtn(KickHub.ui.icons.back, "Mês anterior", function () { shift(-1); }),
        navBtn(flip(KickHub.ui.icons.back), "Próximo mês", function () { shift(1); })
      ])
    ]);

    var weekdays = el("div", { class: "kh-cal__weekdays" },
      WEEKDAYS.map(function (d) { return el("span", { text: d }); }));

    host.replaceChildren(el("div", { class: "kh-panel kh-cal" }, [head, weekdays, grid]));
    paint();

    function navBtn(icon, label, onClick) {
      var b = el("button", { class: "kh-cal__nav-btn", type: "button", "aria-label": label,
        html: icon });
      ctx.on(b, "click", onClick);
      return b;
    }
    function flip(svg) { return svg.replace("<svg ", "<svg style=\"transform:scaleX(-1)\" "); }

    function shift(delta) {
      month = new Date(month.getFullYear(), month.getMonth() + delta, 1);
      paint();
    }

    function paint() {
      var year = month.getFullYear();
      var m = month.getMonth();
      var label = month.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
      title.textContent = label.charAt(0).toUpperCase() + label.slice(1);

      var firstWeekday = new Date(year, m, 1).getDay();
      var daysInMonth = new Date(year, m + 1, 0).getDate();
      var prevMonthDays = new Date(year, m, 0).getDate();
      var todayKey = dateKey(new Date());

      grid.replaceChildren();
      for (var slot = 0; slot < 42; slot++) {
        var offset = slot - firstWeekday + 1;
        var inMonth = offset >= 1 && offset <= daysInMonth;
        var dayNum = inMonth ? offset : (offset < 1 ? prevMonthDays + offset : offset - daysInMonth);
        var cellDate = inMonth ? new Date(year, m, offset)
          : (offset < 1 ? new Date(year, m - 1, dayNum) : new Date(year, m + 1, dayNum));
        var key = dateKey(cellDate);
        var dayEvents = byDate[key] || [];

        var cell = el("button", {
          class: "kh-cal__day" + (inMonth ? "" : " is-outside") +
                 (dayEvents.length ? " has-events" : "") + (key === todayKey ? " is-today" : ""),
          type: "button", disabled: !inMonth || !dayEvents.length
        }, el("span", { class: "kh-cal__day-num", text: String(dayNum) }));

        if (dayEvents.length) {
          var pills = el("span", { class: "kh-cal__pills" });
          dayEvents.slice(0, 3).forEach(function (ev) {
            pills.appendChild(el("span", { class: "kh-cal__pill", text: ev.title }));
          });
          if (dayEvents.length > 3) {
            pills.appendChild(el("span", { class: "kh-cal__pill kh-cal__pill--more", text: "+" + (dayEvents.length - 3) }));
          }
          cell.appendChild(pills);
          (function (k, evs) {
            ctx.on(cell, "click", function () { openDay(k, evs); });
          })(key, dayEvents);
        }
        grid.appendChild(cell);
      }
    }

    function openDay(key, dayEvents) {
      KickHub.ui.modal({
        className: "kh-modal--glass",
        render: function (body, handle) {
          body.appendChild(el("p", { class: "kh-eyebrow", text: "Detalhes do dia" }));
          body.appendChild(el("h3", { class: "kh-day__title", text: formatLong(key) }));
          var content = el("div", { class: "kh-day__content" });
          dayEvents.forEach(function (ev) {
            var card = el("section", { class: "kh-day-event" }, [
              el("span", { class: "kh-day-event__time", text: ev.time }),
              el("strong", { text: ev.title }),
              el("small", { text: ev.type })
            ]);
            if (Array.isArray(ev.warnings) && ev.warnings.length) {
              card.appendChild(el("ul", { class: "kh-day-event__warnings" },
                ev.warnings.map(function (w) { return el("li", { text: w }); })));
            }
            var goBtn = el("button", { class: "kh-btn kh-btn--primary", type: "button", text: "Ir para Resumo" });
            if (ev.subjectId && KickHub.getApp("resumos")) {
              goBtn.addEventListener("click", function () {
                handle.close();
                ctx.navigate("resumos", { subjectId: ev.subjectId });
              });
            } else {
              goBtn.disabled = true;
              goBtn.title = "Esta matéria não tem resumo disponível.";
            }
            card.appendChild(el("div", { class: "kh-day-event__actions" }, goBtn));
            content.appendChild(card);
          });
          body.appendChild(content);
        }
      });
    }
  }

  /* 3) REGISTRO. */
  KickHub.registerApp({
    id: "calendario",
    parent: "escola",
    title: "Calendário",
    subtitle: "Agenda escolar",
    theme: "violet",
    order: 30,
    icon: '<svg viewBox="0 0 64 64"><path d="M20 12v8M44 12v8"/><rect x="12" y="16" width="40" height="36" rx="4"/><path d="M12 26h40M22 36h6M32 36h6M22 44h6"/></svg>',
    mount: render
  });
})();
