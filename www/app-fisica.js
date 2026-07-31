/* =====================================================================
   Plugin: Física (app-fisica.js)
   ---------------------------------------------------------------------
   Apresentação interativa "A Física no Futebol" integrada ao KickHub.
   12 slides sobre Efeito Magnus, Aerodinâmica e Energia Cinética.

   Utiliza:
   - KickHub.ui.el para criar elementos
   - KickHub.navigate para navegação
   - Estado próprio (slides) encapsulado
   ===================================================================== */
(function () {
  "use strict";
  if (!window.KickHub) return;

  var el = KickHub.ui.el;

  /* 1) DADOS — slides com conteúdo pronto */
  var SLIDES = [
    {
      id: 1,
      title: "Por Que Futebol?",
      icon: "⚽",
      type: "intro",
      content: {
        subtitle: "Vocês jogam ou assistem futebol? Pois bem, hoje a gente mostra que toda aquela magia de um chute incrível é na verdade FÍSICA!",
        points: [
          "✓ Esporte que a gente ama",
          "✓ Tem MUITA física envolvida",
          "✓ Um chute perfeito é CIÊNCIA",
          "✓ Vamos descobrir os segredos!"
        ]
      }
    },
    {
      id: 2,
      title: "Conceito 1: Efeito Magnus",
      icon: "🌀",
      type: "concept",
      content: {
        subtitle: "Uma força que faz a bola CURVAR no ar!",
        sections: [
          { label: "O QUÊ É?", text: "Quando uma bola gira enquanto se move, o ar ao redor cria uma força que a puxa." },
          { label: "POR QUÊ?", text: "A bola girando + ar em movimento = pressão diferente = força!" },
          { label: "RESULTADO", text: "A bola desvia, sobe, desce - como um chute de falta!" }
        ]
      }
    },
    {
      id: 3,
      title: "Exemplos no Futebol",
      icon: "🏆",
      type: "examples",
      content: {
        subtitle: "Jogadores que usam Efeito Magnus:",
        items: [
          "Ronaldinho - Chute de falta que curva tipo mágica",
          "Cristiano Ronaldo - Chute de meia-volta que curva",
          "Beckham - Falta famosa que faz boomerang",
          "Neymar - Chute com efeito que engana o goleiro"
        ],
        transition: "Vocês já viram um chute de Ronaldinho? A bola sai na direção errada e depois CURVA pra dentro do gol!"
      }
    },
    {
      id: 4,
      title: "Conceito 2: Aerodinâmica",
      icon: "💨",
      type: "concept",
      content: {
        subtitle: "Como o ar interage com a bola!",
        sections: [
          { label: "POR QUÊ A BOLA É REDONDA?", text: "Redonda = estável + menos resistência → vai mais longe!" },
          { label: "SE FOSSE QUADRADA?", text: "Instável, tremeria, não ia longe... caos total!" },
          { label: "A FORMA IMPORTA!", text: "O ar passa ao redor de forma uniforme na esfera perfeita." }
        ]
      }
    },
    {
      id: 5,
      title: "Aerodinâmica na Prática",
      icon: "🏃",
      type: "concept",
      content: {
        subtitle: "Exemplos reais:",
        sections: [
          { label: "📊 BOLA MODERNA VS VELHA", text: "Bola nova = mais controle | Bola velha = imprevisível" },
          { label: "🚀 VELOCIDADE", text: "Chute forte corta o ar melhor → viaja 30-40 metros!" },
          { label: "📌 TEXTURA", text: "Bola áspera = melhor controle | Bola lisa = mais rápida" }
        ],
        transition: "A bola em 2010 (Jabulani) era muito lisa e imprevisível. Agora é mais áspera para melhor controle!"
      }
    },
    {
      id: 6,
      title: "Conceito 3: Energia Cinética",
      icon: "⚡",
      type: "concept",
      content: {
        subtitle: "A energia que uma coisa tem quando se move!",
        sections: [
          { label: "QUANTO MAIS RÁPIDO", text: "= MAIS ENERGIA" },
          { label: "QUANTO MAIS PESADO", text: "= MAIS ENERGIA" },
          { label: "NO FUTEBOL", text: "Chute forte = muita energia = bola rápida + difícil de bloquear!" }
        ]
      }
    },
    {
      id: 7,
      title: "Energia Cinética no Futebol",
      icon: "💥",
      type: "examples",
      content: {
        subtitle: "Exemplos práticos:",
        items: [
          "Chute Fraco → Pouca energia → bola vai devagar",
          "Chute Forte → Muita energia → bola vai rápido",
          "Colisão → Bola bate na trave = perde energia (vibra!)",
          "Queda da Altura → Bola cai com muita energia → dói na cabeça!"
        ],
        transition: "Alguns jogadores são mais fortes, mas a TÉCNICA também importa!"
      }
    },
    {
      id: 8,
      title: "Demonstração Prática",
      icon: "🧪",
      type: "demo",
      content: {
        subtitle: "Agora vamos ver tudo ao vivo!",
        demoTitle: "DEMONSTRAÇÃO: Secador + Bola de isopor",
        materials: "Material: Bola de isopor + Secador de cabelo",
        observe: [
          "✓ A bola flutua (energia do ar)",
          "✓ A bola gira (rotação)",
          "✓ A bola curva (Efeito Magnus!)",
          "✓ A bola sobe e desce (pressão diferente!)"
        ],
        note: "É bem simples e bem legal! Vocês vão ver a bola fazendo exatamente o que um chute de falta faz!"
      }
    },
    {
      id: 9,
      title: "Por Quê Funciona?",
      icon: "🎯",
      type: "explanation",
      content: {
        subtitle: "Como a demo mostra a física:",
        steps: [
          { num: "1️⃣", label: "AR QUENTE EMPURRA", text: "O ar empurra a bola pra cima (pressão)" },
          { num: "2️⃣", label: "BOLA GIRA", text: "Ar em movimento cria rotação" },
          { num: "3️⃣", label: "ROTAÇÃO + AR = EFEITO MAGNUS", text: "A bola curva, sobe, desce!" },
          { num: "4️⃣", label: "RESULTADO", text: "Exatamente como um chute de falta!" }
        ],
        transition: "O que acontece aqui é A MESMA COISA que no futebol! O pé aplica força + rotação."
      }
    },
    {
      id: 10,
      title: "Resumindo...",
      icon: "🌟",
      type: "conclusion",
      content: {
        summary: [
          { icon: "✅", label: "EFEITO MAGNUS", text: "A bola gira e curva" },
          { icon: "✅", label: "AERODINÂMICA", text: "A forma redonda é perfeita" },
          { icon: "✅", label: "ENERGIA CINÉTICA", text: "Quanto mais força, mais velocidade" }
        ],
        final: "TUDO JUNTO = CHUTE INCRÍVEL!"
      }
    },
    {
      id: 11,
      title: "A Física Está em Tudo!",
      icon: "🌍",
      type: "conclusion",
      content: {
        points: [
          "⚽ No esporte que amamos",
          "🎮 No videogame que jogamos",
          "🎬 Nos filmes que assistimos",
          "💡 Em TUDO que a gente faz!"
        ],
        message: "Entender Física nos ajuda a entender e até melhorar o MUNDO!"
      }
    },
    {
      id: 12,
      title: "Obrigado!",
      icon: "🙏",
      type: "thanks",
      content: {
        message: "Ficamos felizes em responder suas perguntas!",
        questions: "Qualquer coisa sobre Efeito Magnus, aerodinâmica, energia cinética ou futebol pode perguntar!"
      }
    }
  ];

  /* 2) VIEW — renderiza slides */
  function render(host, ctx) {
    var currentSlide = 0;

    function renderSlide() {
      var slide = SLIDES[currentSlide];
      var container = el("div", { class: "kh-fisica-container" });

      // Header
      var header = el("div", { class: "kh-fisica-header" },
        el("div", { class: "kh-fisica-icon", text: slide.icon }),
        el("h2", { class: "kh-fisica-title", text: slide.title })
      );

      // Conteúdo específico por tipo
      var content = el("div", { class: "kh-fisica-content" });

      if (slide.type === "intro") {
        var intro = slide.content;
        content.appendChild(el("p", { class: "kh-fisica-subtitle", text: intro.subtitle }));
        var pointsList = el("div", { class: "kh-fisica-points" });
        intro.points.forEach(function (p) {
          pointsList.appendChild(el("div", { class: "kh-fisica-point", text: p }));
        });
        content.appendChild(pointsList);
      } else if (slide.type === "concept") {
        var concept = slide.content;
        content.appendChild(el("p", { class: "kh-fisica-subtitle", text: concept.subtitle }));
        var sections = el("div", { class: "kh-fisica-sections" });
        concept.sections.forEach(function (sec) {
          var section = el("div", { class: "kh-fisica-section" },
            el("h3", { class: "kh-fisica-section-label", text: sec.label }),
            el("p", { class: "kh-fisica-section-text", text: sec.text })
          );
          sections.appendChild(section);
        });
        content.appendChild(sections);
      } else if (slide.type === "examples") {
        var examples = slide.content;
        content.appendChild(el("p", { class: "kh-fisica-subtitle", text: examples.subtitle }));
        var itemsList = el("div", { class: "kh-fisica-items" });
        examples.items.forEach(function (item) {
          itemsList.appendChild(el("div", { class: "kh-fisica-item", text: item }));
        });
        content.appendChild(itemsList);
        if (examples.transition) {
          content.appendChild(el("p", { class: "kh-fisica-transition", text: examples.transition }));
        }
      } else if (slide.type === "demo") {
        var demo = slide.content;
        content.appendChild(el("p", { class: "kh-fisica-subtitle", text: demo.subtitle }));
        var demoBox = el("div", { class: "kh-fisica-demo-box" },
          el("h3", { class: "kh-fisica-demo-title", text: demo.demoTitle }),
          el("p", { class: "kh-fisica-demo-materials", text: demo.materials })
        );
        var observeList = el("div", { class: "kh-fisica-observe" });
        demo.observe.forEach(function (obs) {
          observeList.appendChild(el("p", { class: "kh-fisica-observe-item", text: obs }));
        });
        demoBox.appendChild(observeList);
        content.appendChild(demoBox);
        if (demo.note) {
          content.appendChild(el("p", { class: "kh-fisica-note", text: demo.note }));
        }
      } else if (slide.type === "explanation") {
        var explanation = slide.content;
        content.appendChild(el("p", { class: "kh-fisica-subtitle", text: explanation.subtitle }));
        var stepsList = el("div", { class: "kh-fisica-steps" });
        explanation.steps.forEach(function (step) {
          var stepEl = el("div", { class: "kh-fisica-step" },
            el("span", { class: "kh-fisica-step-num", text: step.num }),
            el("div", { class: "kh-fisica-step-content" },
              el("h4", { class: "kh-fisica-step-label", text: step.label }),
              el("p", { class: "kh-fisica-step-text", text: step.text })
            )
          );
          stepsList.appendChild(stepEl);
        });
        content.appendChild(stepsList);
        if (explanation.transition) {
          content.appendChild(el("p", { class: "kh-fisica-transition", text: explanation.transition }));
        }
      } else if (slide.type === "conclusion") {
        if (slide.content.summary) {
          var summaryList = el("div", { class: "kh-fisica-summary" });
          slide.content.summary.forEach(function (item) {
            summaryList.appendChild(el("div", { class: "kh-fisica-summary-item" },
              el("span", { class: "kh-fisica-summary-icon", text: item.icon }),
              el("div", { class: "kh-fisica-summary-content" },
                el("h3", { class: "kh-fisica-summary-label", text: item.label }),
                el("p", { class: "kh-fisica-summary-text", text: item.text })
              )
            ));
          });
          content.appendChild(summaryList);
          if (slide.content.final) {
            content.appendChild(el("p", { class: "kh-fisica-final", text: slide.content.final }));
          }
        }
        if (slide.content.points) {
          var pointsList2 = el("div", { class: "kh-fisica-points" });
          slide.content.points.forEach(function (p) {
            pointsList2.appendChild(el("div", { class: "kh-fisica-point", text: p }));
          });
          content.appendChild(pointsList2);
          if (slide.content.message) {
            content.appendChild(el("p", { class: "kh-fisica-message", text: slide.content.message }));
          }
        }
      } else if (slide.type === "thanks") {
        content.appendChild(el("p", { class: "kh-fisica-thanks-message", text: slide.content.message }));
        content.appendChild(el("p", { class: "kh-fisica-thanks-questions", text: slide.content.questions }));
      }

      container.appendChild(header);
      container.appendChild(content);

      // Controles
      var controls = el("div", { class: "kh-fisica-controls" },
        el("button", {
          class: "kh-fisica-btn kh-fisica-btn-prev",
          text: "← Anterior",
          disabled: currentSlide === 0,
          onclick: function () { if (currentSlide > 0) { currentSlide--; renderSlide(); } }
        }),
        el("div", { class: "kh-fisica-progress" },
          el("div", { class: "kh-fisica-progress-bar" },
            el("div", {
              class: "kh-fisica-progress-fill",
              style: { width: ((currentSlide + 1) / SLIDES.length * 100) + "%" }
            })
          ),
          el("span", { class: "kh-fisica-slide-number", text: (currentSlide + 1) + " / " + SLIDES.length })
        ),
        el("button", {
          class: "kh-fisica-btn kh-fisica-btn-next",
          text: "Próximo →",
          disabled: currentSlide === SLIDES.length - 1,
          onclick: function () { if (currentSlide < SLIDES.length - 1) { currentSlide++; renderSlide(); } }
        })
      );

      container.appendChild(controls);
      host.replaceChildren(container);
    }

    renderSlide();
  }

  /* 3) ESTILOS inline (para facilitar o App) */
  var style = document.createElement("style");
  style.textContent = `
    .kh-fisica-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      padding: 2rem;
      background: linear-gradient(135deg, #0d0d0f, #161614);
      color: #ece4d3;
      font-family: 'Inter', sans-serif;
      overflow: hidden;
    }

    .kh-fisica-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid rgba(29,120,116,.2);
    }

    .kh-fisica-icon {
      font-size: 2.5rem;
      margin-bottom: 0.8rem;
      display: block;
    }

    .kh-fisica-title {
      font-size: 2.4rem;
      font-family: 'Playfair Display', serif;
      font-weight: 800;
      color: #ece4d3;
      text-shadow: 0 0 40px rgba(29,120,116,.35);
      margin: 0;
    }

    .kh-fisica-content {
      flex: 1;
      overflow-y: auto;
      padding-right: 1rem;
      margin-bottom: 2rem;
    }

    .kh-fisica-subtitle {
      font-size: 1.3rem;
      color: #c9bfa9;
      text-align: center;
      margin-bottom: 2rem;
      font-weight: 500;
    }

    .kh-fisica-points {
      display: grid;
      gap: 1.2rem;
      max-width: 600px;
      margin: 2rem auto;
    }

    .kh-fisica-point {
      background: linear-gradient(160deg, #1c1b19, #161614);
      border: 1px solid rgba(29,120,116,.3);
      border-radius: 8px;
      padding: 1.5rem;
      color: #ece4d3;
      font-size: 1.1rem;
    }

    .kh-fisica-sections {
      display: grid;
      gap: 1.5rem;
      max-width: 700px;
      margin: 2rem auto;
    }

    .kh-fisica-section {
      background: linear-gradient(160deg, #1c1b19, #161614);
      border: 1px solid rgba(29,120,116,.3);
      border-radius: 8px;
      padding: 1.8rem;
      transition: all .3s ease;
    }

    .kh-fisica-section:hover {
      border-color: #2a9b94;
      box-shadow: 0 8px 20px rgba(29,120,116,.2);
    }

    .kh-fisica-section-label {
      color: #2a9b94;
      font-size: 1.1rem;
      margin-bottom: 0.8rem;
      font-weight: 600;
    }

    .kh-fisica-section-text {
      color: #c9bfa9;
      font-size: 1rem;
      margin: 0;
      line-height: 1.6;
    }

    .kh-fisica-items {
      display: grid;
      gap: 1rem;
      max-width: 700px;
      margin: 2rem auto;
    }

    .kh-fisica-item {
      background: rgba(29,120,116,.1);
      border-left: 3px solid #2a9b94;
      padding: 1rem 1.5rem;
      color: #c9bfa9;
      font-size: 1.05rem;
      border-radius: 4px;
    }

    .kh-fisica-transition {
      background: rgba(29,120,116,.1);
      border-left: 3px solid #2a9b94;
      padding: 1.5rem;
      color: #c9bfa9;
      font-size: 1.05rem;
      font-style: italic;
      margin-top: 2rem;
      border-radius: 4px;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }

    .kh-fisica-demo-box {
      background: linear-gradient(160deg, rgba(29,120,116,.15), rgba(29,120,116,.05));
      border: 2px solid #2a9b94;
      border-radius: 8px;
      padding: 2.5rem;
      text-align: center;
      max-width: 700px;
      margin: 2rem auto;
    }

    .kh-fisica-demo-title {
      color: #2a9b94;
      font-size: 1.5rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .kh-fisica-demo-materials {
      color: #c9bfa9;
      font-size: 1.1rem;
      margin: 0;
    }

    .kh-fisica-observe {
      margin-top: 1.5rem;
      text-align: left;
    }

    .kh-fisica-observe-item {
      color: #c9bfa9;
      font-size: 1rem;
      margin: 0.6rem 0;
    }

    .kh-fisica-note {
      color: #c9bfa9;
      font-size: 1rem;
      font-style: italic;
      margin-top: 1.5rem;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }

    .kh-fisica-steps {
      display: grid;
      gap: 1.5rem;
      max-width: 700px;
      margin: 2rem auto;
    }

    .kh-fisica-step {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    .kh-fisica-step-num {
      font-size: 2rem;
    }

    .kh-fisica-step-label {
      color: #2a9b94;
      font-size: 1.1rem;
      margin: 0 0 0.5rem 0;
      font-weight: 600;
    }

    .kh-fisica-step-text {
      color: #c9bfa9;
      font-size: 1rem;
      margin: 0;
      line-height: 1.6;
    }

    .kh-fisica-summary {
      display: grid;
      gap: 1.5rem;
      max-width: 700px;
      margin: 2rem auto;
    }

    .kh-fisica-summary-item {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    .kh-fisica-summary-icon {
      font-size: 1.8rem;
    }

    .kh-fisica-summary-label {
      color: #2a9b94;
      font-size: 1rem;
      margin: 0 0 0.3rem 0;
      font-weight: 600;
    }

    .kh-fisica-summary-text {
      color: #c9bfa9;
      font-size: 0.95rem;
      margin: 0;
    }

    .kh-fisica-final {
      text-align: center;
      font-size: 1.4rem;
      color: #d4af37;
      font-weight: 700;
      margin-top: 2rem;
    }

    .kh-fisica-message {
      text-align: center;
      font-size: 1.3rem;
      color: #d4af37;
      font-weight: 600;
      margin: 2rem 0 1rem 0;
    }

    .kh-fisica-thanks-message {
      text-align: center;
      font-size: 1.3rem;
      color: #ece4d3;
      font-weight: 600;
      margin: 2rem 0 1rem 0;
    }

    .kh-fisica-thanks-questions {
      text-align: center;
      color: #d4af37;
      font-size: 1.05rem;
      line-height: 1.8;
    }

    .kh-fisica-controls {
      display: flex;
      gap: 1rem;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      padding: 1rem;
      border-top: 1px solid rgba(29,120,116,.2);
    }

    .kh-fisica-btn {
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      padding: 0.7rem 1.5rem;
      border-radius: 8px;
      border: 1px solid rgba(29,120,116,.3);
      background: rgba(13,13,15,.8);
      color: #2a9b94;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all .3s ease;
      backdrop-filter: blur(4px);
    }

    .kh-fisica-btn:hover:not(:disabled) {
      border-color: #2a9b94;
      background: rgba(29,120,116,.2);
      transform: translateY(-2px);
    }

    .kh-fisica-btn:disabled {
      opacity: 0.4;
      cursor: default;
    }

    .kh-fisica-progress {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }

    .kh-fisica-progress-bar {
      width: 200px;
      height: 3px;
      background: rgba(29,120,116,.2);
      border-radius: 2px;
      overflow: hidden;
    }

    .kh-fisica-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #2a9b94, #d4af37);
      transition: width .4s ease;
    }

    .kh-fisica-slide-number {
      font-size: 0.9rem;
      color: #d4af37;
      min-width: 50px;
      text-align: center;
    }

    @media (max-width: 768px) {
      .kh-fisica-container {
        padding: 1rem;
      }

      .kh-fisica-title {
        font-size: 1.8rem;
      }

      .kh-fisica-subtitle {
        font-size: 1.1rem;
      }

      .kh-fisica-progress-bar {
        width: 120px;
      }

      .kh-fisica-controls {
        flex-direction: column;
        gap: 0.8rem;
      }

      .kh-fisica-btn {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .kh-fisica-demo-box {
        padding: 1.5rem;
      }

      .kh-fisica-step {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);

  /* 4) REGISTRO */
  KickHub.registerApp({
    id: "fisica",
    parent: "escola",
    title: "Física",
    subtitle: "A Física no Futebol",
    theme: "green",
    order: 20,
    icon: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="18" fill="none" stroke="currentColor" stroke-width="3"/><path d="M32 14v36M14 32h36" stroke="currentColor" stroke-width="2"/><circle cx="32" cy="32" r="4" fill="currentColor"/></svg>',
    mount: render
  });
})();
