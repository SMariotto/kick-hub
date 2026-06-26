/* =====================================================================
   Plugin: Resumos (app-resumos.js)
   ---------------------------------------------------------------------
   MÓDULO-EXEMPLO CANÔNICO do padrão de plugin do Kick Hub.

   Um plugin é estritamente independente: tem seu PRÓPRIO escopo de dados,
   seus PRÓPRIOS ícones e sua PRÓPRIA lógica de render. Acopla-se ao Core
   apenas por KickHub.registerApp(...). Apague este arquivo e o hub
   continua funcionando — só não mostra o card "Resumos".

   Estrutura (sempre nesta ordem):
     1) CAMADA DE DADOS / REGRA  -> sem DOM, fácil de portar p/ outro shell
     2) CAMADA DE VIEW           -> recebe (host, ctx) e só desenha
     3) REGISTRO                 -> único ponto de acoplamento ao Core
   ===================================================================== */
(function () {
  "use strict";
  if (!window.KickHub) return; // sem Core, o plugin simplesmente não ativa.

  var el = KickHub.ui.el;

  /* ----------------------------------------------------------------- *
   * 1) DADOS / REGRA DE NEGÓCIO (escopo próprio — sem tocar no DOM)    *
   * ----------------------------------------------------------------- */
  var SUBJECTS = [
    {
      "id": "quimica",
      "title": "Química A",
      "icon": "⚗️",
      "theme": "green",
      "description": "Interações atômicas e moleculares: metais, alotropia, geometria, polaridade e forças intermoleculares.",
      "modules": [
        {
          "id": "quimica-7",
          "title": "Módulo 7",
          "subtitle": "Ligação metálica",
          "summary": "Ligação metálica é explicada pelo modelo do mar de elétrons: cátions metálicos organizados em rede cristalina são estabilizados por elétrons deslocalizados. Esse modelo explica a condutibilidade elétrica e térmica, o brilho, a maleabilidade, a ductilidade e a formação de ligas.",
          "keyPoints": [
            "Metais conduzem eletricidade porque possuem elétrons livres que se movimentam pela estrutura.",
            "Maleabilidade e ductilidade surgem porque as camadas de cátions podem deslizar sem romper a ligação.",
            "Ligas metálicas são misturas homogêneas de metais ou de metal com outro elemento, feitas para melhorar propriedades.",
            "Bronze é cobre com estanho; latão é cobre com zinco; aço inoxidável envolve ferro, carbono, cromo e níquel.",
            "O nióbio pode aumentar a resistência mecânica do aço sem prejudicar a soldabilidade e a tenacidade."
          ],
          "glossary": [
            [
              "Mar de elétrons",
              "Modelo em que elétrons deslocalizados transitam entre cátions metálicos."
            ],
            [
              "Ductilidade",
              "Capacidade de formar fios."
            ],
            [
              "Maleabilidade",
              "Capacidade de formar lâminas."
            ],
            [
              "Liga metálica",
              "Mistura sólida com propriedades metálicas."
            ],
            [
              "Tenacidade",
              "Capacidade de deformar sem romper."
            ]
          ],
          "concepts": [
            "ligação metálica",
            "mar de elétrons",
            "condutibilidade",
            "liga metálica",
            "bronze",
            "latão",
            "aço inoxidável",
            "nióbio",
            "maleabilidade",
            "ductilidade"
          ],
          "facts": [
            "metais têm elétrons deslocalizados",
            "ligas ajustam resistência e durabilidade",
            "aço com nióbio pode ficar mais resistente",
            "bronze contém cobre e estanho",
            "latão contém cobre e zinco"
          ]
        },
        {
          "id": "quimica-8",
          "title": "Módulo 8",
          "subtitle": "Alotropia e retículos",
          "summary": "Alotropia ocorre quando substâncias diferentes são formadas pelo mesmo elemento químico. Carbono pode formar diamante, grafite e fulereno; oxigênio forma O2 e O3; fósforo e enxofre também têm formas alotrópicas. O módulo também compara cristais moleculares, covalentes, iônicos e metálicos.",
          "keyPoints": [
            "Alótropos possuem o mesmo elemento químico, mas estruturas e propriedades diferentes.",
            "Diamante é duro e isolante; grafite é macio e conduz eletricidade por sua estrutura em camadas.",
            "Cristais moleculares tendem a ter baixa temperatura de fusão e baixa condução.",
            "Cristais iônicos conduzem eletricidade quando fundidos ou dissolvidos em água.",
            "Cristais covalentes costumam ter alta temperatura de fusão, como diamante e quartzo."
          ],
          "glossary": [
            [
              "Alotropia",
              "Fenômeno de um mesmo elemento formar substâncias simples diferentes."
            ],
            [
              "Cristal molecular",
              "Estrutura mantida por interações intermoleculares."
            ],
            [
              "Cristal iônico",
              "Rede de cátions e ânions unidos por atração eletrostática."
            ],
            [
              "Cristal covalente",
              "Rede extensa de ligações covalentes."
            ],
            [
              "Grafite",
              "Alótropo do carbono que conduz eletricidade."
            ]
          ],
          "concepts": [
            "alotropia",
            "diamante",
            "grafite",
            "fulereno",
            "ozônio",
            "gás oxigênio",
            "retículo iônico",
            "retículo covalente",
            "retículo molecular",
            "retículo metálico"
          ],
          "facts": [
            "O2 e O3 são alótropos do oxigênio",
            "grafite conduz eletricidade",
            "diamante e grafite são carbono",
            "NaCl é retículo iônico",
            "sacarose é cristal molecular"
          ]
        },
        {
          "id": "quimica-9",
          "title": "Módulo 9",
          "subtitle": "Geometria e polaridade",
          "summary": "A geometria molecular depende da repulsão entre nuvens eletrônicas ao redor do átomo central. Moléculas lineares, angulares, trigonais planas e piramidais podem ser previstas observando pares ligantes e pares não ligantes. A polaridade das ligações depende da diferença de eletronegatividade; a polaridade da molécula depende da soma dos dipolos e da geometria.",
          "keyPoints": [
            "Duas nuvens eletrônicas ao redor do átomo central tendem a formar geometria linear.",
            "Três átomos ligantes sem par livre podem formar geometria trigonal plana.",
            "Pares de elétrons não ligantes podem gerar geometria angular ou piramidal.",
            "Ligação entre átomos iguais é apolar; entre átomos com eletronegatividade diferente tende a ser polar.",
            "Uma molécula pode ter ligações polares e ser apolar se os dipolos se anularem pela simetria."
          ],
          "glossary": [
            [
              "Geometria molecular",
              "Forma espacial da molécula."
            ],
            [
              "Eletronegatividade",
              "Tendência de atrair elétrons em uma ligação."
            ],
            [
              "Dipolo",
              "Separação de cargas parciais em uma ligação ou molécula."
            ],
            [
              "Molécula polar",
              "Molécula com dipolo resultante diferente de zero."
            ],
            [
              "Molécula apolar",
              "Molécula sem dipolo resultante."
            ]
          ],
          "concepts": [
            "geometria linear",
            "geometria angular",
            "trigonal plana",
            "piramidal",
            "eletronegatividade",
            "dipolo",
            "ligação polar",
            "molécula polar",
            "simetria",
            "pares livres"
          ],
          "facts": [
            "CO2 é linear e apolar",
            "H2O é angular e polar",
            "NH3 é piramidal",
            "ligações entre átomos iguais são apolares",
            "pares livres alteram a geometria"
          ]
        },
        {
          "id": "quimica-10",
          "title": "Módulo 10",
          "subtitle": "Interações intermoleculares",
          "summary": "Interações intermoleculares são forças entre moléculas. Dipolo instantâneo-dipolo induzido aparece em todas as moléculas e domina em substâncias apolares. Dipolo-dipolo ocorre entre moléculas polares. Ligações de hidrogênio aparecem quando H está ligado a F, O ou N. A intensidade dessas interações influencia ebulição, fusão, solubilidade e miscibilidade.",
          "keyPoints": [
            "Forças de London existem em todas as substâncias moleculares, mas são decisivas nas apolares.",
            "Dipolo-dipolo ocorre entre moléculas polares com polos permanentes.",
            "Ligação de hidrogênio é uma interação intensa envolvendo H ligado a F, O ou N.",
            "Interações mais fortes aumentam a temperatura de ebulição, se o tamanho molecular for comparável.",
            "Semelhante dissolve semelhante: polar tende a dissolver polar; apolar tende a dissolver apolar."
          ],
          "glossary": [
            [
              "London",
              "Interação dipolo instantâneo-dipolo induzido."
            ],
            [
              "Dipolo-dipolo",
              "Atração entre moléculas polares."
            ],
            [
              "Ligação de hidrogênio",
              "Interação forte envolvendo H ligado a F, O ou N."
            ],
            [
              "Miscibilidade",
              "Capacidade de dois líquidos se misturarem."
            ],
            [
              "Solubilidade",
              "Capacidade de uma substância dissolver em outra."
            ]
          ],
          "concepts": [
            "London",
            "dipolo-dipolo",
            "ligação de hidrogênio",
            "temperatura de ebulição",
            "solubilidade",
            "polaridade",
            "miscibilidade",
            "moléculas apolares",
            "H ligado a F O N",
            "tamanho molecular"
          ],
          "facts": [
            "água faz ligação de hidrogênio",
            "moléculas apolares interagem por London",
            "maior interação aumenta ebulição",
            "polar dissolve polar",
            "hexano é apolar"
          ]
        }
      ]
    },
    {
      "id": "portugues",
      "title": "Análise Linguística",
      "icon": "📚",
      "theme": "red",
      "description": "Figuras de linguagem: implicação, intensidade, oposição, repetição e sonoridade.",
      "modules": [
        {
          "id": "portugues-8",
          "title": "Módulo 8",
          "subtitle": "Figuras II",
          "summary": "O módulo trabalha figuras de implicação mútua e intensidade. Metonímia troca um termo por outro ligado por relação de proximidade ou associação. Sinédoque envolve relação entre parte e todo. Hipérbole exagera; eufemismo suaviza; gradação organiza ideias em sequência crescente ou decrescente.",
          "keyPoints": [
            "Metonímia depende de relação de contiguidade, como autor pela obra ou lugar pela instituição.",
            "Sinédoque pode trocar parte pelo todo ou todo pela parte.",
            "Hipérbole usa exagero intencional para intensificar sentido.",
            "Eufemismo suaviza expressões duras, desagradáveis ou ofensivas.",
            "Gradação cria progressão de intensidade, ordem ou importância."
          ],
          "glossary": [
            [
              "Metonímia",
              "Substituição por relação de proximidade."
            ],
            [
              "Sinédoque",
              "Substituição envolvendo parte e todo."
            ],
            [
              "Hipérbole",
              "Exagero expressivo."
            ],
            [
              "Eufemismo",
              "Suavização de uma ideia."
            ],
            [
              "Gradação",
              "Sequência progressiva de ideias."
            ]
          ],
          "concepts": [
            "metonímia",
            "sinédoque",
            "hipérbole",
            "eufemismo",
            "gradação",
            "contiguidade",
            "parte pelo todo",
            "exagero",
            "suavização",
            "intensidade"
          ],
          "facts": [
            "metonímia não é comparação direta",
            "hipérbole exagera para expressar",
            "eufemismo reduz impacto",
            "gradação pode ser crescente",
            "sinédoque usa parte e todo"
          ]
        },
        {
          "id": "portugues-9",
          "title": "Módulo 9",
          "subtitle": "Figuras III",
          "summary": "As figuras de oposição exploram contrastes. Antítese aproxima termos opostos explícitos. Paradoxo reúne ideias aparentemente incompatíveis. Ironia diz algo para sugerir o contrário ou um sentido crítico diferente. Preterição finge não falar de algo enquanto fala indiretamente.",
          "keyPoints": [
            "Antítese cria contraste direto entre palavras ou ideias opostas.",
            "Paradoxo aproxima ideias que parecem se excluir, mas produzem reflexão.",
            "Ironia depende do contexto e da diferença entre o dito e o pretendido.",
            "Preterição pode reforçar um argumento ao declarar que não vai abordar algo.",
            "O efeito argumentativo dessas figuras costuma depender de leitura atenta do contexto."
          ],
          "glossary": [
            [
              "Antítese",
              "Aproximação de ideias opostas."
            ],
            [
              "Paradoxo",
              "Convivência de sentidos aparentemente incompatíveis."
            ],
            [
              "Ironia",
              "Dito que sugere sentido diferente, muitas vezes contrário."
            ],
            [
              "Preterição",
              "Fingir não falar enquanto se fala indiretamente."
            ],
            [
              "Contraste",
              "Relação de oposição contextual."
            ]
          ],
          "concepts": [
            "antítese",
            "paradoxo",
            "ironia",
            "preterição",
            "oposição",
            "contraste",
            "crítica",
            "contexto",
            "argumentação",
            "oximoro"
          ],
          "facts": [
            "antítese opõe termos explícitos",
            "paradoxo combina ideias incompatíveis",
            "ironia exige contexto",
            "preterição fala indiretamente",
            "oximoro é forma de paradoxo"
          ]
        },
        {
          "id": "portugues-10",
          "title": "Módulo 10",
          "subtitle": "Figuras IV",
          "summary": "O módulo trata de repetição e sonoridade. Anáfora repete palavras ou expressões. Polissíndeto repete conjunções. Quiasmo cruza a ordem dos termos. Pleonasmo repete informações de modo expressivo. Aliteração, assonância, onomatopeia e paronomásia exploram sons.",
          "keyPoints": [
            "Anáfora cria ritmo e insistência pela repetição no início ou ao longo de enunciados.",
            "Polissíndeto repete conjunções para somar ações, criar ritmo ou prolongar uma cena.",
            "Quiasmo inverte a ordem dos termos, como histórias de vida e vidas de histórias.",
            "Aliteração repete sons consonantais; assonância repete sons vocálicos.",
            "Paronomásia aproxima palavras parecidas no som; onomatopeia imita sons."
          ],
          "glossary": [
            [
              "Anáfora",
              "Repetição recorrente de palavras ou expressões."
            ],
            [
              "Polissíndeto",
              "Repetição de conjunções."
            ],
            [
              "Quiasmo",
              "Cruzamento/inversão de termos."
            ],
            [
              "Aliteração",
              "Repetição de sons consonantais."
            ],
            [
              "Paronomásia",
              "Jogo com palavras de som parecido."
            ]
          ],
          "concepts": [
            "anáfora",
            "polissíndeto",
            "quiasmo",
            "pleonasmo",
            "aliteração",
            "assonância",
            "onomatopeia",
            "paronomásia",
            "repetição",
            "sonoridade"
          ],
          "facts": [
            "anáfora repete expressões",
            "polissíndeto repete conjunções",
            "quiasmo cruza termos",
            "aliteração usa consoantes",
            "assonância usa vogais"
          ]
        },
        {
          "id": "portugues-6",
          "title": "Módulo 6",
          "subtitle": "Linguagem figurada",
          "summary": "O módulo abre a unidade de figuras de linguagem distinguindo sentido literal (denotativo, dicionarizado) de sentido figurado (conotativo, dependente de contexto). Mostra que a maior parte das figuras de linguagem nasce de dois grandes mecanismos: relação de semelhança entre dois termos ou relação de implicação mútua, em que um elemento concreto evoca outro por proximidade lógica ou cultural, sem precisar de comparação explícita.",
          "keyPoints": [
            "Sentido literal é o significado de dicionário, sem desvio em relação ao uso convencional da palavra.",
            "Sentido figurado ocorre quando a palavra é deslocada do seu uso comum para construir um efeito de sentido novo.",
            "A semelhança aproxima dois termos por uma característica que eles compartilham, mesmo sendo de naturezas diferentes.",
            "A implicação mútua liga dois termos porque um sugere ou pressupõe o outro dentro de um mesmo contexto cultural ou narrativo.",
            "Identificar se a base da figura é semelhança ou implicação mútua ajuda a nomear corretamente o recurso usado no texto."
          ],
          "glossary": [
            [
              "Sentido denotativo",
              "Significado literal, convencional, de dicionário."
            ],
            [
              "Sentido conotativo",
              "Significado figurado, que depende do contexto."
            ],
            [
              "Semelhança",
              "Mecanismo que aproxima dois termos por uma característica comum."
            ],
            [
              "Implicação mútua",
              "Mecanismo em que um termo remete ao outro por proximidade lógica."
            ],
            [
              "Desvio de sentido",
              "Afastamento do uso convencional de uma palavra ou expressão."
            ]
          ],
          "concepts": [
            "sentido literal",
            "sentido figurado",
            "denotação",
            "conotação",
            "semelhança",
            "implicação mútua",
            "contexto",
            "figura de linguagem",
            "desvio semântico"
          ],
          "facts": [
            "sentido literal segue o uso convencional da palavra",
            "sentido figurado depende do contexto para ser interpretado",
            "semelhança e implicação mútua são as duas bases mais comuns das figuras de linguagem",
            "a mesma palavra pode ter sentido literal em um texto e figurado em outro"
          ]
        },
        {
          "id": "portugues-7",
          "title": "Módulo 7",
          "subtitle": "Figuras de semelhança",
          "summary": "O módulo detalha as figuras de linguagem baseadas em semelhança. Comparação aproxima dois termos de forma explícita, usando conectores como 'como' ou 'tal qual'. Metáfora faz a mesma aproximação sem conector, substituindo um termo por outro. Catacrese é uma metáfora tão usada no dia a dia que perdeu a percepção de ser figurada. Sinestesia mistura sensações captadas por sentidos diferentes (visão, audição, tato) numa só expressão. Personificação atribui características de seres vivos a seres ou objetos inanimados.",
          "keyPoints": [
            "Comparação usa um conector explícito para ligar os dois termos aproximados.",
            "Metáfora aproxima dois termos sem conector, fundindo os sentidos diretamente.",
            "Catacrese é uma metáfora tão consolidada pelo uso que deixou de ser percebida como figura, como em 'braço da cadeira'.",
            "Sinestesia combina percepções de sentidos diferentes, como som e cor, numa mesma imagem.",
            "Personificação (ou prosopopeia) dá ações ou sentimentos humanos a algo que não é humano."
          ],
          "glossary": [
            [
              "Comparação",
              "Aproximação explícita entre dois termos por meio de conector."
            ],
            [
              "Metáfora",
              "Substituição de um termo por outro com base em semelhança, sem conector."
            ],
            [
              "Catacrese",
              "Metáfora popularizada que perdeu a percepção de ser figura de linguagem."
            ],
            [
              "Sinestesia",
              "Mistura de sensações de diferentes órgãos do sentido em uma expressão."
            ],
            [
              "Personificação",
              "Atribuição de qualidades humanas a seres inanimados ou abstratos."
            ]
          ],
          "concepts": [
            "comparação",
            "metáfora",
            "catacrese",
            "sinestesia",
            "personificação",
            "prosopopeia",
            "conector comparativo",
            "semelhança",
            "substituição"
          ],
          "facts": [
            "a comparação sempre usa um termo comparativo explícito",
            "a metáfora não precisa de conector para funcionar",
            "catacrese é uma metáfora desgastada pelo uso cotidiano",
            "sinestesia mistura sentidos diferentes em uma única imagem",
            "personificação trata algo não humano como se tivesse vida ou vontade"
          ]
        },
        {
          "id": "portugues-11",
          "title": "Módulo 11",
          "subtitle": "Inferência de temas",
          "summary": "O módulo trabalha a diferença entre figuras e temas em textos verbais, não verbais e multimodais. Figuras são elementos concretos do texto, muitas vezes expressos por substantivos concretos; temas são noções abstratas que ficam, em geral, implícitas, sendo expressas por substantivos abstratos. Inferir o tema de um texto narrativo ou imagético exige levantar hipóteses de leitura apoiadas em pistas do próprio texto e no repertório de mundo do leitor, sempre considerando o conjunto das figuras combinadas, nunca uma figura isolada.",
          "keyPoints": [
            "Figuras são elementos concretos do texto; temas são noções abstratas, geralmente implícitas.",
            "O tema de um texto emerge da combinação de várias figuras, e não da análise isolada de uma única figura.",
            "A inferência de temas depende de hipóteses de leitura baseadas em pistas textuais e no repertório de mundo do leitor.",
            "Textos não verbais e multimodais (como fotografias e campanhas publicitárias) também veiculam temas implícitos por meio de suas figuras visuais.",
            "Comparar diferentes textos sobre o mesmo acontecimento ajuda a perceber como a escolha das figuras pode sugerir posicionamentos distintos sobre um mesmo tema."
          ],
          "glossary": [
            [
              "Figura (no sentido temático)",
              "Elemento concreto do texto, muitas vezes ligado a um substantivo concreto."
            ],
            [
              "Tema",
              "Noção abstrata que o texto sugere, geralmente de forma implícita."
            ],
            [
              "Inferência",
              "Conclusão obtida a partir de pistas do texto e de conhecimento prévio do leitor."
            ],
            [
              "Texto multimodal",
              "Texto que combina mais de um modo de linguagem, como imagem e palavra."
            ],
            [
              "Hipótese de leitura",
              "Interpretação provisória construída e testada à medida que se lê o texto."
            ]
          ],
          "concepts": [
            "figura concreta",
            "tema abstrato",
            "inferência",
            "texto multimodal",
            "fotojornalismo",
            "hipótese de leitura",
            "repertório de mundo",
            "posicionamento implícito"
          ],
          "facts": [
            "figuras são concretas e temas são abstratos",
            "o tema de um texto resulta da combinação das figuras, não de uma figura isolada",
            "imagens e fotografias também podem veicular temas implícitos",
            "a escolha de quais figuras mostrar pode sugerir diferentes posicionamentos sobre o mesmo fato"
          ]
        }
      ]
    },
    {
      "id": "fisica",
      "title": "Física",
      "icon": "🧲",
      "theme": "blue",
      "description": "Leis de Newton, forças, equilíbrio, máquinas simples e cálculos básicos de cinemática.",
      "modules": [
        {
          "id": "fisica-newton",
          "title": "Módulo 1",
          "subtitle": "Newton e forças",
          "summary": "A revisão de Física cobre conversão de unidades, leis de Newton, força resultante, peso, normal, atrito, plano inclinado e equilíbrio por torque. A ideia central é identificar forças, calcular resultantes e relacionar massa, aceleração e força.",
          "keyPoints": [
            "Para converter m/s para km/h, multiplique por 3,6; para converter km/h para m/s, divida por 3,6.",
            "A Primeira Lei de Newton diz que o movimento só muda se houver força resultante não nula.",
            "A Segunda Lei usa F = m.a para relacionar força resultante, massa e aceleração.",
            "Peso é calculado por P = m.g; normal é a força da superfície sobre o corpo.",
            "Atrito se opõe à tendência de escorregamento; torque depende de força e distância ao apoio."
          ],
          "glossary": [
            [
              "Força resultante",
              "Soma vetorial das forças que atuam em um corpo."
            ],
            [
              "Inércia",
              "Tendência de manter repouso ou movimento uniforme."
            ],
            [
              "Peso",
              "Força gravitacional sobre um corpo."
            ],
            [
              "Normal",
              "Força perpendicular exercida por uma superfície."
            ],
            [
              "Torque",
              "Efeito de rotação produzido por uma força."
            ]
          ],
          "concepts": [
            "inércia",
            "força resultante",
            "F = m.a",
            "peso",
            "normal",
            "atrito",
            "torque",
            "ação e reação",
            "plano inclinado",
            "alavanca"
          ],
          "facts": [
            "20 m/s equivale a 72 km/h",
            "massa de 70 kg pesa cerca de 700 N na Terra",
            "ação e reação atuam em corpos diferentes",
            "alicates são alavancas",
            "sem atrito no plano inclinado atuam peso e normal"
          ]
        },
        {
          "id": "fisica-calculos",
          "title": "Módulo 2",
          "subtitle": "Cálculos e equilíbrio",
          "summary": "Nos exercícios dissertativos, é importante mostrar o cálculo completo: converter unidades, aplicar F = m.a, calcular peso, somar forças opostas, usar atrito Fat = μ.N, aplicar equilíbrio de torques e calcular velocidade média.",
          "keyPoints": [
            "Em forças opostas na mesma direção, subtraia intensidades e mantenha o sentido da maior força.",
            "Velocidade média é distância dividida pelo tempo, com unidades compatíveis.",
            "Com velocidade constante, a força resultante é zero.",
            "O coeficiente de atrito pode ser calculado por μ = Fat/N.",
            "No equilíbrio, os torques horário e anti-horário devem se compensar."
          ],
          "glossary": [
            [
              "Velocidade média",
              "Razão entre deslocamento/distância e intervalo de tempo."
            ],
            [
              "Coeficiente de atrito",
              "Número que relaciona atrito e força normal."
            ],
            [
              "Equilíbrio",
              "Situação em que força resultante e torque resultante podem ser nulos."
            ],
            [
              "Sentido da força",
              "Direção orientada para onde a força atua."
            ],
            [
              "Unidade SI",
              "Sistema Internacional, como metro, segundo e newton."
            ]
          ],
          "concepts": [
            "velocidade média",
            "conversão",
            "forças opostas",
            "coeficiente de atrito",
            "equilíbrio",
            "torque",
            "newton",
            "massa",
            "aceleração",
            "gravidade"
          ],
          "facts": [
            "360 km/h equivale a 100 m/s",
            "1800 m em 300 s equivale a 6 m/s",
            "60 kg com g 9,8 pesa 588 N",
            "forças 15 N e 5 N opostas resultam em 10 N",
            "μ = 0,2 quando Fat 4 N e N 20 N"
          ]
        }
      ]
    },
    {
      "id": "circuitos",
      "title": "Circuitos de Programação",
      "icon": "🔌",
      "theme": "yellow",
      "description": "Circuitos elétricos, Arduino, LEDs, resistores, protoboard, sensor ultrassônico, transistores e processadores.",
      "modules": [
        {
          "id": "circuitos-basico",
          "title": "Módulo 1",
          "subtitle": "Circuito elétrico",
          "summary": "Um circuito elétrico precisa de fonte de energia, condutores e componente consumidor. Para a corrente circular, o caminho deve estar fechado. GND é a referência negativa; curto-circuito é um caminho de resistência muito baixa que pode danificar fios, componentes e placas.",
          "keyPoints": [
            "Circuito fechado permite passagem de corrente.",
            "Circuito aberto interrompe a corrente.",
            "Fonte, condutores e carga formam o circuito básico.",
            "GND funciona como referência negativa.",
            "Curto-circuito é perigoso por gerar corrente alta."
          ],
          "glossary": [
            [
              "Corrente",
              "Fluxo de cargas elétricas."
            ],
            [
              "Tensão",
              "Diferença de potencial elétrico."
            ],
            [
              "GND",
              "Referência negativa do circuito."
            ],
            [
              "Carga",
              "Componente que consome energia."
            ],
            [
              "Curto-circuito",
              "Caminho de resistência muito baixa."
            ]
          ],
          "concepts": [
            "corrente",
            "tensão",
            "fonte",
            "caminho fechado",
            "GND",
            "curto-circuito",
            "carga",
            "condutores",
            "Arduino",
            "porta"
          ],
          "facts": [
            "circuito aberto não funciona",
            "curto pode queimar placa",
            "GND é referência negativa",
            "corrente precisa de caminho fechado",
            "carga pode ser LED motor ou sensor"
          ]
        },
        {
          "id": "circuitos-led",
          "title": "Módulo 2",
          "subtitle": "LEDs e resistores",
          "summary": "LED possui polaridade: anodo positivo e catodo negativo. Ele deve ser ligado com resistor em série, pois o resistor limita a corrente e protege tanto o LED quanto a porta do Arduino.",
          "keyPoints": [
            "LED conduz em apenas um sentido.",
            "Anodo é o terminal positivo; catodo é o negativo.",
            "Resistor limita corrente.",
            "Resistência é medida em ohms.",
            "Sem resistor, o LED pode queimar."
          ],
          "glossary": [
            [
              "Anodo",
              "Terminal positivo do LED."
            ],
            [
              "Catodo",
              "Terminal negativo do LED."
            ],
            [
              "Resistor",
              "Componente que limita corrente."
            ],
            [
              "Ohm",
              "Unidade de resistência elétrica."
            ],
            [
              "Série",
              "Ligação em sequência no mesmo caminho."
            ]
          ],
          "concepts": [
            "LED",
            "resistor",
            "anodo",
            "catodo",
            "polaridade",
            "série",
            "ohm",
            "corrente",
            "proteção",
            "código de cores"
          ],
          "facts": [
            "LED sem resistor é erro",
            "resistor protege componentes",
            "LED invertido não acende",
            "anodo vai no positivo",
            "catodo vai no negativo"
          ]
        },
        {
          "id": "circuitos-protoboard",
          "title": "Módulo 3",
          "subtitle": "Jumpers e protoboard",
          "summary": "Jumpers conectam pontos do circuito. A protoboard permite montar circuitos sem solda, facilitando testes e correções. Organização evita erros como inverter GND e 5V, trocar polaridade de LED ou ligar sensores nos pinos errados.",
          "keyPoints": [
            "Jumpers são fios de conexão.",
            "Protoboard permite testes sem solda.",
            "Organização reduz erros de montagem.",
            "Linhas internas da protoboard conectam pontos específicos.",
            "Identificar trilhas evita conexões erradas."
          ],
          "glossary": [
            [
              "Jumper",
              "Fio usado para conexão."
            ],
            [
              "Protoboard",
              "Placa de montagem sem solda."
            ],
            [
              "Trilha",
              "Conjunto de pontos conectados internamente."
            ],
            [
              "Montagem",
              "Organização física do circuito."
            ],
            [
              "Teste",
              "Verificação antes da montagem definitiva."
            ]
          ],
          "concepts": [
            "jumpers",
            "protoboard",
            "sem solda",
            "organização",
            "trilhas",
            "conexões",
            "Arduino",
            "5V",
            "GND",
            "pinos"
          ],
          "facts": [
            "protoboard facilita correções",
            "jumpers conectam Arduino e componentes",
            "organização evita inversão",
            "sem solda favorece protótipo",
            "pinos errados geram falhas"
          ]
        },
        {
          "id": "circuitos-ultrassonico",
          "title": "Módulo 4",
          "subtitle": "Sensor ultrassônico",
          "summary": "O sensor ultrassônico mede distância emitindo um pulso sonoro e calculando o tempo até o eco retornar. Os pinos principais são VCC, GND, TRIG e ECHO. Projetos comuns incluem lixeira automática, robô desvia-obstáculos e medidor de distância.",
          "keyPoints": [
            "VCC alimenta o sensor.",
            "GND liga ao negativo.",
            "TRIG dispara o pulso sonoro.",
            "ECHO recebe o retorno.",
            "A distância depende do tempo de ida e volta do som."
          ],
          "glossary": [
            [
              "VCC",
              "Pino de alimentação positiva."
            ],
            [
              "TRIG",
              "Pino que dispara o pulso."
            ],
            [
              "ECHO",
              "Pino que recebe o sinal de retorno."
            ],
            [
              "Eco",
              "Retorno da onda sonora."
            ],
            [
              "Distância",
              "Medida calculada pelo tempo do som."
            ]
          ],
          "concepts": [
            "sensor ultrassônico",
            "VCC",
            "GND",
            "TRIG",
            "ECHO",
            "distância",
            "eco",
            "onda sonora",
            "Arduino",
            "tempo"
          ],
          "facts": [
            "TRIG dispara",
            "ECHO recebe",
            "VCC alimenta",
            "GND fecha referência",
            "inverter TRIG e ECHO é erro comum"
          ]
        },
        {
          "id": "circuitos-transistores",
          "title": "Módulo 5",
          "subtitle": "Transistores",
          "summary": "Transistores funcionam como chaves eletrônicas, controlando a passagem de corrente. Em circuitos maiores, sinais pequenos podem controlar cargas maiores. A lógica digital usa estados ligado/desligado, verdadeiro/falso, 0 e 1.",
          "keyPoints": [
            "Transistor pode atuar como chave.",
            "Sinal pequeno pode controlar corrente maior.",
            "Ligado e desligado representam estados digitais.",
            "Processadores têm muitos transistores microscópicos.",
            "A lógica binária depende desses estados."
          ],
          "glossary": [
            [
              "Transistor",
              "Componente semicondutor que controla corrente."
            ],
            [
              "Chave eletrônica",
              "Controle liga/desliga por sinal elétrico."
            ],
            [
              "Binário",
              "Sistema baseado em 0 e 1."
            ],
            [
              "Sinal",
              "Informação elétrica de controle."
            ],
            [
              "Carga",
              "Elemento controlado no circuito."
            ]
          ],
          "concepts": [
            "transistor",
            "chave eletrônica",
            "corrente",
            "sinal",
            "carga",
            "0 e 1",
            "lógica digital",
            "ligado",
            "desligado",
            "processador"
          ],
          "facts": [
            "transistores controlam passagem de corrente",
            "processadores têm bilhões de transistores",
            "0 e 1 representam estados",
            "sinal pequeno controla carga maior",
            "lógica digital usa verdadeiro e falso"
          ]
        },
        {
          "id": "circuitos-processadores",
          "title": "Módulo 6",
          "subtitle": "Processadores",
          "summary": "Processadores são fabricados principalmente a partir do silício, material semicondutor. O silício é purificado, transformado em wafers e recebe camadas de circuitos microscópicos por processos como fotolitografia. Miniaturização aumenta capacidade e eficiência.",
          "keyPoints": [
            "Silício é material base dos chips.",
            "Wafers são discos usados na fabricação.",
            "Fotolitografia cria padrões microscópicos.",
            "Camadas formam circuitos complexos.",
            "Transistores menores ajudam desempenho e consumo."
          ],
          "glossary": [
            [
              "Silício",
              "Semicondutor usado em chips."
            ],
            [
              "Wafer",
              "Disco de silício usado como base."
            ],
            [
              "Fotolitografia",
              "Processo de gravação de padrões microscópicos."
            ],
            [
              "Miniaturização",
              "Redução do tamanho dos componentes."
            ],
            [
              "Chip",
              "Circuito integrado."
            ]
          ],
          "concepts": [
            "silício",
            "wafer",
            "fotolitografia",
            "camadas",
            "chip",
            "processador",
            "miniaturização",
            "transistores",
            "semicondutor",
            "eficiência"
          ],
          "facts": [
            "silício vem da areia após purificação",
            "wafer é base do chip",
            "fotolitografia cria circuitos",
            "miniaturização reduz consumo",
            "mais transistores podem aumentar processamento"
          ]
        }
      ]
    },
    {
      "id": "calculadoras",
      "title": "Calculadoras Contábeis",
      "icon": "🧾",
      "theme": "violet",
      "description": "Projeto integrador com HTML, CSS, JavaScript, DOM, eventos, funções e cálculos de INSS/IR.",
      "modules": [
        {
          "id": "calc-estrutura",
          "title": "Módulo 1",
          "subtitle": "Estrutura do app",
          "summary": "O app de cálculos contábeis possui tela inicial, calculadora, campos de entrada, botões, área de resultado e funções para organizar cálculos. HTML estrutura, CSS estiliza e JavaScript dá funcionamento.",
          "keyPoints": [
            "HTML organiza menu, telas, formulário e resultados.",
            "CSS define layout, cores e alinhamento.",
            "JavaScript troca telas, lê campos e calcula.",
            "Funções separam responsabilidades.",
            "IDs conectam HTML e JavaScript."
          ],
          "glossary": [
            [
              "HTML",
              "Estrutura da página."
            ],
            [
              "CSS",
              "Aparência e layout."
            ],
            [
              "JavaScript",
              "Funcionamento e lógica."
            ],
            [
              "Função",
              "Bloco nomeado de código."
            ],
            [
              "Tela",
              "Parte exibida da aplicação."
            ]
          ],
          "concepts": [
            "HTML",
            "CSS",
            "JavaScript",
            "tela inicial",
            "calculadora",
            "campos",
            "botões",
            "resultados",
            "funções",
            "layout"
          ],
          "facts": [
            "HTML cria estrutura",
            "CSS organiza visual",
            "JS calcula e atualiza",
            "funções separam tarefas",
            "ID permite localizar elemento"
          ]
        },
        {
          "id": "calc-html",
          "title": "Módulo 2",
          "subtitle": "HTML e IDs",
          "summary": "A prova pode pedir interpretação de elementos como div.app, div.menu, div#home, div#calculadora, input#salario, select#dependentes, select#pensao, span#valorIr e button#button. O id é essencial para o JavaScript encontrar o elemento.",
          "keyPoints": [
            "input recebe valores digitados.",
            "select permite escolher opções.",
            "span exibe resultado.",
            "button dispara ação.",
            "id precisa bater exatamente com o usado no JS."
          ],
          "glossary": [
            [
              "input",
              "Campo de entrada."
            ],
            [
              "select",
              "Lista de seleção."
            ],
            [
              "span",
              "Elemento inline usado para texto ou resultado."
            ],
            [
              "button",
              "Botão clicável."
            ],
            [
              "id",
              "Identificador único."
            ]
          ],
          "concepts": [
            "input",
            "select",
            "span",
            "button",
            "id",
            "salario",
            "dependentes",
            "pensao",
            "valorIr",
            "formulário"
          ],
          "facts": [
            "id conecta HTML ao JS",
            "input#salario recebe salário bruto",
            "select#dependentes guarda quantidade",
            "span#valorIr exibe IR",
            "button pode acionar cálculo"
          ]
        },
        {
          "id": "calc-css",
          "title": "Módulo 3",
          "subtitle": "CSS e layout",
          "summary": "CSS controla o visual: .app, .menu, .home, .calc, .box, .resultado e #campo-pensao. A classe .calc pode começar com display none e virar flex pelo JavaScript. #campo-pensao fica oculto até a opção de pensão ser escolhida.",
          "keyPoints": [
            "display none esconde um elemento.",
            "display flex ajuda a organizar layout.",
            "Classes são reutilizáveis; ids são únicos.",
            "Padding, largura e cores definem cartões.",
            "JS pode alterar style.display."
          ],
          "glossary": [
            [
              "display",
              "Propriedade que controla exibição."
            ],
            [
              "flex",
              "Modo de layout flexível."
            ],
            [
              "classe",
              "Seletor CSS reutilizável."
            ],
            [
              "seletor",
              "Forma de escolher elementos no CSS."
            ],
            [
              "padding",
              "Espaço interno."
            ]
          ],
          "concepts": [
            "CSS",
            "display none",
            "display flex",
            "classe",
            "id",
            "layout",
            "menu",
            "box",
            "resultado",
            "campo-pensao"
          ],
          "facts": [
            ".calc pode ficar oculta",
            "#campo-pensao começa oculto",
            "flex centraliza e distribui",
            "classe começa com ponto",
            "id começa com cerquilha"
          ]
        },
        {
          "id": "calc-dom",
          "title": "Módulo 4",
          "subtitle": "DOM e valores",
          "summary": "DOM é a representação da página que o JavaScript acessa. getElementById localiza elementos, value lê campos, Number converte texto em número, innerHTML altera conteúdo e toFixed(2) formata com duas casas decimais.",
          "keyPoints": [
            "document.getElementById busca pelo id.",
            "value lê o valor de input/select.",
            "Number evita cálculo como texto.",
            "innerHTML troca conteúdo exibido.",
            "toFixed(2) padroniza valores monetários."
          ],
          "glossary": [
            [
              "DOM",
              "Representação manipulável da página."
            ],
            [
              "value",
              "Valor atual de um campo."
            ],
            [
              "innerHTML",
              "Conteúdo interno de um elemento."
            ],
            [
              "Number",
              "Conversão para número."
            ],
            [
              "toFixed",
              "Formatação de casas decimais."
            ]
          ],
          "concepts": [
            "DOM",
            "getElementById",
            "value",
            "innerHTML",
            "Number",
            "toFixed",
            "salario.value",
            "valorInss",
            "resultado",
            "conversão"
          ],
          "facts": [
            "input.value vem como texto",
            "Number converte para cálculo",
            "innerHTML mostra resultado",
            "toFixed(2) mostra duas casas",
            "DOM permite atualizar página"
          ]
        },
        {
          "id": "calc-eventos",
          "title": "Módulo 5",
          "subtitle": "Eventos",
          "summary": "Eventos fazem a página responder ao usuário. click executa ações ao clicar, change responde a mudança de campo e keydown responde a teclas. O botão calcular precisa estar conectado a um evento de click.",
          "keyPoints": [
            "addEventListener conecta elemento e ação.",
            "click é usado em botões.",
            "change pode mostrar ou esconder campo de pensão.",
            "keydown pode reagir ao Enter.",
            "Sem evento, o botão não chama a função."
          ],
          "glossary": [
            [
              "Evento",
              "Acontecimento capturado pelo JS."
            ],
            [
              "click",
              "Clique do usuário."
            ],
            [
              "change",
              "Mudança de valor."
            ],
            [
              "keydown",
              "Tecla pressionada."
            ],
            [
              "callback",
              "Função executada pelo evento."
            ]
          ],
          "concepts": [
            "evento",
            "addEventListener",
            "click",
            "change",
            "keydown",
            "botão",
            "calcular",
            "pensao",
            "campo-pensao",
            "função"
          ],
          "facts": [
            "click executa cálculo",
            "change mostra campo de pensão",
            "keydown pode usar Enter",
            "sem evento nada acontece",
            "callback roda quando evento ocorre"
          ]
        },
        {
          "id": "calc-funcoes",
          "title": "Módulo 6",
          "subtitle": "Funções e cálculos",
          "summary": "Funções como abrirHome, abrirCalculadora, calcularINSS, calcularIr(base) e calcular organizam o projeto. A base do IR usa salário bruto menos INSS, dependentes e pensão. O salário líquido desconta INSS, IR e pensão.",
          "keyPoints": [
            "Função evita repetição e organiza código.",
            "calcularINSS usa faixas e condicionais.",
            "calcularIr recebe base como parâmetro.",
            "Dependentes reduzem base do IR, mas não saem diretamente do líquido.",
            "return devolve o valor calculado."
          ],
          "glossary": [
            [
              "Parâmetro",
              "Valor recebido pela função."
            ],
            [
              "return",
              "Valor devolvido pela função."
            ],
            [
              "Base do IR",
              "Valor usado para calcular imposto."
            ],
            [
              "Líquido",
              "Salário após descontos efetivos."
            ],
            [
              "INSS",
              "Desconto previdenciário."
            ]
          ],
          "concepts": [
            "função",
            "parâmetro",
            "return",
            "calcularINSS",
            "calcularIr",
            "base IR",
            "salário líquido",
            "dependentes",
            "pensão",
            "desconto"
          ],
          "facts": [
            "base IR desconta INSS dependentes pensão",
            "líquido desconta INSS IR pensão",
            "dependente não sai direto do líquido",
            "return é necessário",
            "funções separam cálculo"
          ]
        },
        {
          "id": "calc-condicionais",
          "title": "Módulo 7",
          "subtitle": "Condicionais",
          "summary": "if, else if e else permitem que o programa escolha blocos conforme condições. Em cálculos de INSS e IR, a ordem importa porque o programa executa apenas o primeiro bloco verdadeiro.",
          "keyPoints": [
            "if testa uma condição.",
            "else if testa outra condição se a anterior falhar.",
            "else cobre os demais casos.",
            "A ordem das faixas altera o resultado.",
            "Operadores como >= e <= aparecem em faixas."
          ],
          "glossary": [
            [
              "if",
              "Se uma condição for verdadeira."
            ],
            [
              "else if",
              "Nova condição alternativa."
            ],
            [
              "else",
              "Caso contrário."
            ],
            [
              "Condição",
              "Expressão que resulta em verdadeiro ou falso."
            ],
            [
              "Faixa",
              "Intervalo de valores."
            ]
          ],
          "concepts": [
            "if",
            "else if",
            "else",
            "condição",
            "faixa",
            "operadores",
            "maior igual",
            "menor igual",
            "IR",
            "INSS"
          ],
          "facts": [
            "ordem das condições importa",
            "só um bloco é executado",
            "else cobre resto",
            ">= inclui limite",
            "condicional decide cálculo"
          ]
        },
        {
          "id": "calc-erros",
          "title": "Módulo 8",
          "subtitle": "Erros comuns",
          "summary": "Erros comuns incluem esquecer Number, digitar id diferente no HTML e JS, usar innerHTML no elemento errado, não chamar função no evento, confundir base do IR com salário bruto e esquecer return em função de cálculo.",
          "keyPoints": [
            "IDs devem ser iguais no HTML e no JS.",
            "Sem Number, soma pode virar concatenação.",
            "Sem return, a função devolve undefined.",
            "Evento mal ligado impede o botão de funcionar.",
            "Base do IR não é igual ao salário bruto."
          ],
          "glossary": [
            [
              "Bug",
              "Erro de funcionamento."
            ],
            [
              "undefined",
              "Valor indefinido no JavaScript."
            ],
            [
              "concatenação",
              "Junção de textos."
            ],
            [
              "chamada de função",
              "Uso de nomeDaFuncao()."
            ],
            [
              "debug",
              "Investigação e correção de erros."
            ]
          ],
          "concepts": [
            "bug",
            "Number",
            "id errado",
            "innerHTML",
            "evento",
            "return",
            "undefined",
            "base IR",
            "salário bruto",
            "correção"
          ],
          "facts": [
            "id errado quebra captura",
            "sem return resultado vira undefined",
            "sem parênteses função não chama",
            "Number evita texto",
            "innerHTML errado mostra no lugar errado"
          ]
        }
      ]
    },
    {
      "id": "logica",
      "title": "Lógica de Programação",
      "icon": "💻",
      "theme": "dark",
      "description": "Funções, parâmetros, retorno, if/else, operadores, while e análise de bugs.",
      "modules": [
        {
          "id": "logica-condicional",
          "title": "Módulo 1",
          "subtitle": "if/else",
          "summary": "Estrutura condicional é usada quando o programa precisa tomar decisão. Se a condição for verdadeira, executa um bloco; caso contrário, executa outro bloco opcional.",
          "keyPoints": [
            "if testa uma condição.",
            "else executa quando o if falha.",
            "Condições retornam verdadeiro ou falso.",
            "A indentação ajuda leitura.",
            "Blocos usam chaves em JavaScript."
          ],
          "glossary": [
            [
              "Condição",
              "Expressão booleana."
            ],
            [
              "if",
              "Estrutura se."
            ],
            [
              "else",
              "Caso contrário."
            ],
            [
              "Bloco",
              "Código entre chaves."
            ],
            [
              "Booleano",
              "Verdadeiro ou falso."
            ]
          ],
          "concepts": [
            "if",
            "else",
            "condição",
            "verdadeiro",
            "falso",
            "bloco",
            "decisão",
            "nota",
            "aprovado",
            "recuperação"
          ],
          "facts": [
            "nota 6 com nota >= 7 cai no else",
            "if decide fluxo",
            "else é opcional",
            "condição usa comparação",
            "bloco executado depende do teste"
          ]
        },
        {
          "id": "logica-operadores",
          "title": "Módulo 2",
          "subtitle": "Operadores",
          "summary": "Operadores de comparação como >, <, >=, <=, ==, != e === ajudam o programa a comparar valores antes de decidir. É importante não confundir atribuição = com comparação == ou ===.",
          "keyPoints": [
            "> e < comparam maior e menor.",
            ">= e <= incluem o limite.",
            "== compara valor com conversão.",
            "=== compara valor e tipo.",
            "= atribui valor, não compara."
          ],
          "glossary": [
            [
              ">",
              "Maior que."
            ],
            [
              "<",
              "Menor que."
            ],
            [
              ">=",
              "Maior ou igual."
            ],
            [
              "==",
              "Igualdade com conversão."
            ],
            [
              "===",
              "Igualdade estrita."
            ]
          ],
          "concepts": [
            ">",
            "<",
            ">=",
            "<=",
            "==",
            "!=",
            "===",
            "=",
            "comparação",
            "atribuição"
          ],
          "facts": [
            "= não compara",
            "=== é mais estrito",
            ">= inclui limite",
            "!= significa diferente",
            "operadores formam condições"
          ]
        },
        {
          "id": "logica-funcoes",
          "title": "Módulo 3",
          "subtitle": "Funções",
          "summary": "Funções são blocos de código com nome, criados para organizar o programa e evitar repetição. Uma função pode receber parâmetros e devolver resultado com return.",
          "keyPoints": [
            "function declara uma função.",
            "Parâmetros recebem valores de entrada.",
            "return devolve um resultado.",
            "Chamar função exige parênteses.",
            "Funções ajudam reaproveitamento."
          ],
          "glossary": [
            [
              "Função",
              "Bloco de código reutilizável."
            ],
            [
              "Parâmetro",
              "Entrada da função."
            ],
            [
              "Argumento",
              "Valor passado na chamada."
            ],
            [
              "return",
              "Saída da função."
            ],
            [
              "Chamada",
              "Execução da função."
            ]
          ],
          "concepts": [
            "função",
            "function",
            "parâmetro",
            "argumento",
            "return",
            "chamada",
            "dobro",
            "calcularMedia",
            "resultado",
            "reutilização"
          ],
          "facts": [
            "dobro(8) retorna 16",
            "return devolve valor",
            "parâmetro recebe entrada",
            "função sem chamada não executa",
            "calcularMedia pode receber duas notas"
          ]
        },
        {
          "id": "logica-while",
          "title": "Módulo 4",
          "subtitle": "while",
          "summary": "while executa um bloco enquanto uma condição for verdadeira. É essencial atualizar a variável de controle dentro do laço para evitar loop infinito.",
          "keyPoints": [
            "while verifica a condição antes de cada repetição.",
            "Contador controla quantas vezes repete.",
            "contador++ aumenta uma unidade.",
            "Sem atualização, o laço pode nunca terminar.",
            "Use while para contagens e repetições condicionais."
          ],
          "glossary": [
            [
              "while",
              "Enquanto."
            ],
            [
              "Loop",
              "Repetição."
            ],
            [
              "Contador",
              "Variável de controle."
            ],
            [
              "Incremento",
              "Aumento do valor."
            ],
            [
              "Loop infinito",
              "Repetição sem fim."
            ]
          ],
          "concepts": [
            "while",
            "loop",
            "contador",
            "incremento",
            "contador++",
            "condição",
            "repetição",
            "loop infinito",
            "console.log",
            "controle"
          ],
          "facts": [
            "contador controla repetição",
            "sem contador++ pode travar",
            "while(contador <= 3) repete até 3",
            "contador de 1 a 5 mostra cinco valores",
            "condição falsa encerra laço"
          ]
        },
        {
          "id": "logica-bugs",
          "title": "Módulo 5",
          "subtitle": "Análise de bugs",
          "summary": "Erros comuns incluem esquecer chaves, esquecer return, usar = no lugar de comparação, não chamar função com parênteses e criar while sem atualizar a variável.",
          "keyPoints": [
            "Leia o erro e localize a linha provável.",
            "Confira chaves e parênteses.",
            "Diferencie = de comparação.",
            "Verifique se a função foi chamada.",
            "Em while, procure atualização da variável."
          ],
          "glossary": [
            [
              "Bug",
              "Erro no programa."
            ],
            [
              "Sintaxe",
              "Forma correta da linguagem."
            ],
            [
              "Lógica",
              "Raciocínio do código."
            ],
            [
              "Parênteses",
              "Usados em chamadas e condições."
            ],
            [
              "Chaves",
              "Delimitam blocos."
            ]
          ],
          "concepts": [
            "bug",
            "erro",
            "chaves",
            "return",
            "=",
            "===",
            "parênteses",
            "while",
            "contador",
            "debug"
          ],
          "facts": [
            "função sem parênteses não é chamada",
            "return esquecido perde resultado",
            "while sem incremento é infinito",
            "chave faltando quebra sintaxe",
            "usar = em if é bug comum"
          ]
        },
        {
          "id": "logica-pratica",
          "title": "Módulo 6",
          "subtitle": "Prática de código",
          "summary": "Para responder questões de código, leia variáveis iniciais, simule a execução linha por linha, observe condições, acompanhe alterações de contador e verifique o valor retornado por funções.",
          "keyPoints": [
            "Simule valores em uma tabela mental.",
            "Acompanhe cada mudança de variável.",
            "Veja onde console.log é chamado.",
            "Em funções, siga até o return.",
            "Em provas, explique o raciocínio, não apenas o resultado."
          ],
          "glossary": [
            [
              "Simulação",
              "Execução mental do código."
            ],
            [
              "Variável",
              "Espaço que guarda valor."
            ],
            [
              "console.log",
              "Comando que exibe no console."
            ],
            [
              "Raciocínio",
              "Explicação passo a passo."
            ],
            [
              "Resultado",
              "Valor final produzido."
            ]
          ],
          "concepts": [
            "simulação",
            "variável",
            "console.log",
            "passo a passo",
            "resultado",
            "return",
            "contador",
            "média",
            "notas",
            "execução"
          ],
          "facts": [
            "explicar passo a passo ajuda nas dissertativas",
            "console.log mostra valor",
            "return pode ser usado em outra variável",
            "variáveis mudam ao longo do código",
            "média de 6 e 8 é 7"
          ]
        }
      ]
    },
    {
      "id": "ingles",
      "title": "Inglês",
      "icon": "🇬🇧",
      "theme": "blue",
      "description": "Sinonímia, situações de emergência, desastres naturais, past tenses, plural of nouns e countable/uncountable nouns.",
      "modules": [
        {
          "id": "ingles-sinonimia",
          "title": "Módulo 1",
          "subtitle": "Synonyms",
          "summary": "Sinonímia em Inglês envolve reconhecer palavras com sentido semelhante dentro de um contexto. Nem sempre dois sinônimos podem ser trocados em qualquer frase: é preciso observar formalidade, colocação, intensidade e situação de uso.",
          "keyPoints": [
            "Synonyms são palavras de sentido parecido.",
            "Contexto decide qual sinônimo fica natural.",
            "Big, large e huge não têm a mesma intensidade.",
            "Begin e start são parecidos, mas podem variar em formalidade.",
            "Em prova, leia a frase inteira antes de escolher o sinônimo."
          ],
          "glossary": [
            [
              "Synonym",
              "Palavra com significado semelhante."
            ],
            [
              "Meaning",
              "Sentido de uma palavra."
            ],
            [
              "Context",
              "Situação em que a palavra aparece."
            ],
            [
              "Formal",
              "Mais adequado a situações formais."
            ],
            [
              "Informal",
              "Mais comum em conversa cotidiana."
            ]
          ],
          "concepts": [
            "synonym",
            "meaning",
            "context",
            "formal",
            "informal",
            "big",
            "large",
            "huge",
            "begin",
            "start"
          ],
          "facts": [
            "synonym means similar meaning",
            "context changes word choice",
            "huge is stronger than big",
            "begin can sound more formal than start",
            "choose the word that fits the sentence"
          ]
        },
        {
          "id": "ingles-emergencias",
          "title": "Módulo 2",
          "subtitle": "Emergencies and disasters",
          "summary": "Este módulo reúne vocabulário para situações de emergência e desastres naturais. É importante reconhecer palavras como earthquake, flood, fire, storm, landslide, drought, rescue, help, shelter e emergency call.",
          "keyPoints": [
            "Emergency é uma situação de risco que exige ação rápida.",
            "Natural disasters incluem earthquake, flood, storm, drought e landslide.",
            "Rescue significa resgate.",
            "Shelter é abrigo.",
            "Call for help é uma expressão útil em emergências."
          ],
          "glossary": [
            [
              "Earthquake",
              "Terremoto."
            ],
            [
              "Flood",
              "Enchente/inundação."
            ],
            [
              "Fire",
              "Incêndio."
            ],
            [
              "Storm",
              "Tempestade."
            ],
            [
              "Shelter",
              "Abrigo."
            ]
          ],
          "concepts": [
            "emergency",
            "earthquake",
            "flood",
            "fire",
            "storm",
            "drought",
            "landslide",
            "rescue",
            "shelter",
            "help"
          ],
          "facts": [
            "earthquake means terremoto",
            "flood means enchente",
            "shelter means abrigo",
            "rescue means resgate",
            "call for help is used in emergencies"
          ]
        },
        {
          "id": "ingles-past-tenses",
          "title": "Módulo 3",
          "subtitle": "Past tenses",
          "summary": "Past tenses expressam ações no passado. Simple Past descreve ações concluídas; Past Continuous descreve ações em progresso no passado; Past Perfect indica uma ação anterior a outra também passada.",
          "keyPoints": [
            "Simple Past usa verbos regulares com -ed ou formas irregulares.",
            "Did aparece em perguntas e negativas no Simple Past.",
            "Past Continuous usa was/were + verbo com -ing.",
            "Past Perfect usa had + past participle.",
            "Use marcadores como yesterday, last week, while e before para entender o tempo verbal."
          ],
          "glossary": [
            [
              "Simple Past",
              "Ação concluída no passado."
            ],
            [
              "Past Continuous",
              "Ação em andamento no passado."
            ],
            [
              "Past Perfect",
              "Ação anterior a outra ação passada."
            ],
            [
              "Regular verb",
              "Verbo que forma passado com -ed."
            ],
            [
              "Irregular verb",
              "Verbo com forma própria no passado."
            ]
          ],
          "concepts": [
            "simple past",
            "past continuous",
            "past perfect",
            "did",
            "was",
            "were",
            "had",
            "regular verbs",
            "irregular verbs",
            "past participle"
          ],
          "facts": [
            "simple past shows finished actions",
            "past continuous uses was or were plus ing",
            "past perfect uses had plus past participle",
            "did is used in questions and negatives",
            "yesterday often indicates past"
          ]
        },
        {
          "id": "ingles-plural-nouns",
          "title": "Módulo 4",
          "subtitle": "Plural of nouns",
          "summary": "O plural dos substantivos em Inglês costuma receber -s, mas há regras especiais. Palavras terminadas em -s, -x, -ch, -sh recebem -es; consoante + y vira -ies; alguns substantivos são irregulares, como child/children e man/men.",
          "keyPoints": [
            "A regra geral do plural é adicionar -s.",
            "Bus vira buses; box vira boxes.",
            "City vira cities quando há consoante + y.",
            "Boy vira boys porque há vogal + y.",
            "Irregular plurals precisam ser memorizados."
          ],
          "glossary": [
            [
              "Noun",
              "Substantivo."
            ],
            [
              "Plural",
              "Forma para mais de um."
            ],
            [
              "Regular plural",
              "Plural formado por regra padrão."
            ],
            [
              "Irregular plural",
              "Plural com forma própria."
            ],
            [
              "Ending",
              "Final da palavra."
            ]
          ],
          "concepts": [
            "plural",
            "noun",
            "s",
            "es",
            "ies",
            "irregular plural",
            "child children",
            "man men",
            "city cities",
            "box boxes"
          ],
          "facts": [
            "most nouns add s",
            "box becomes boxes",
            "city becomes cities",
            "child becomes children",
            "man becomes men"
          ]
        },
        {
          "id": "ingles-countable",
          "title": "Módulo 5",
          "subtitle": "Countable and uncountable nouns",
          "summary": "Countable nouns podem ser contados e têm singular/plural, como apple/apples. Uncountable nouns indicam massa, líquido, ideia ou categoria geral e normalmente não usam plural direto, como water, rice, money e information.",
          "keyPoints": [
            "Countable nouns usam a/an no singular.",
            "Uncountable nouns não usam a/an diretamente.",
            "Use much com uncountable e many com countable.",
            "Use some/any com ambos, dependendo da frase.",
            "Para contar uncountable, use expressões como a bottle of water ou a piece of information."
          ],
          "glossary": [
            [
              "Countable",
              "Substantivo contável."
            ],
            [
              "Uncountable",
              "Substantivo incontável."
            ],
            [
              "Many",
              "Muitos/muitas para contáveis."
            ],
            [
              "Much",
              "Muito/muita para incontáveis."
            ],
            [
              "Piece of",
              "Expressão para contar uma unidade de algo incontável."
            ]
          ],
          "concepts": [
            "countable",
            "uncountable",
            "many",
            "much",
            "some",
            "any",
            "a bottle of",
            "a piece of",
            "water",
            "information"
          ],
          "facts": [
            "apple is countable",
            "water is uncountable",
            "many is used with countable nouns",
            "much is used with uncountable nouns",
            "information is usually uncountable"
          ]
        }
      ]
    },
    {
      "id": "matematica-a",
      "title": "Matemática A",
      "icon": "✖️",
      "theme": "blue",
      "description": "Estudo completo de equações do 2º grau, relações de Girard e equações redutíveis.",
      "modules": [
        {
          "id": "mat-a-eq2",
          "title": "Módulo 1",
          "subtitle": "Equações do 2º Grau",
          "summary": "Toda equação da forma ax² + bx + c = 0 (com a ≠ 0) é resolvida pela fórmula resolutiva. O discriminante, ou delta, define o número de raízes reais, e as relações de Girard conectam essas raízes aos coeficientes da equação.",
          "keyPoints": [
            "Se delta > 0: duas raízes reais e distintas.",
            "Se delta = 0: duas raízes reais e iguais.",
            "Se delta < 0: não possui raízes reais.",
            "Soma das raízes por Girard: -b/a.",
            "Produto das raízes por Girard: c/a."
          ],
          "glossary": [
            [
              "Discriminante",
              "Representado por delta (b² - 4ac), define a quantidade de raízes reais."
            ],
            [
              "Relações de Girard",
              "Fórmulas que relacionam a soma e o produto das raízes com os coeficientes da equação."
            ],
            [
              "Forma Fatorada",
              "A expressão a(x - x1)(x - x2) = 0, onde x1 e x2 são as raízes da equação."
            ],
            [
              "Equação Biquadrada",
              "Equação escrita na forma ax^4 + bx² + c = 0."
            ],
            [
              "Equação Irracional",
              "Equação cuja incógnita aparece dentro de um radical."
            ]
          ],
          "concepts": [
            "equação do 2º grau",
            "fórmula resolutiva",
            "discriminante",
            "raízes reais",
            "soma",
            "produto",
            "equação biquadrada",
            "equação racional",
            "equação irracional"
          ],
          "facts": [
            "O valor do discriminante indica o número de raízes reais de uma equação.",
            "A soma das raízes de uma equação do 2º grau é obtida por -b/a.",
            "O produto das raízes de uma equação do 2º grau é obtido por c/a.",
            "Uma equação irracional possui a incógnita dentro do radicando.",
            "A forma fatorada de um trinômio do 2º grau depende do conhecimento prévio de suas raízes."
          ]
        }
      ]
    },
    {
      "id": "matematica-b",
      "title": "Matemática B",
      "icon": "📐",
      "theme": "green",
      "description": "Estudo da geometria plana: ângulos geométricos, triângulos, polígonos convexos e circunferência.",
      "modules": [
        {
          "id": "mat-b-angulos",
          "title": "Módulo 1",
          "subtitle": "Ângulos e Triângulos",
          "summary": "Estudo das classificações dos ângulos e suas relações, como complementares, suplementares e opostos pelo vértice. Nos triângulos, analisa-se a soma dos ângulos internos e o teorema do ângulo externo.",
          "keyPoints": [
            "Ângulo reto mede 90º, agudo é menor que 90º e obtuso é maior que 90º.",
            "Ângulos complementares somam 90º; suplementares somam 180º.",
            "Ângulos opostos pelo vértice possuem a mesma medida.",
            "A soma dos ângulos internos de um triângulo é sempre 180º.",
            "A medida do ângulo externo é igual à soma dos dois internos não adjacentes a ele."
          ],
          "glossary": [
            [
              "Ângulo raso",
              "Ângulo obtido por duas semirretas opostas; mede 180º."
            ],
            [
              "Bissetriz",
              "Semirreta que divide um ângulo em outros dois congruentes."
            ],
            [
              "Triângulo isósceles",
              "Triângulo que possui dois lados iguais e ângulos da base congruentes."
            ],
            [
              "Ângulos alternos internos",
              "Em retas paralelas cortadas por transversal, são ângulos congruentes em lados opostos da transversal."
            ],
            [
              "Retas Concorrentes",
              "Retas que se cruzam em um único ponto, formando ângulos opostos pelo vértice."
            ]
          ],
          "concepts": [
            "ângulo agudo",
            "ângulo obtuso",
            "ângulos complementares",
            "ângulos suplementares",
            "teorema angular de tales",
            "retas paralelas",
            "triângulo equilátero"
          ],
          "facts": [
            "Dois ângulos adjacentes podem ser consecutivos e suplementares.",
            "Em um triângulo equilátero, cada ângulo interno mede exatamente 60º.",
            "Em um triângulo retângulo, a soma dos dois ângulos agudos é sempre 90º.",
            "Ângulos colaterais internos em retas paralelas são sempre suplementares.",
            "Ângulos correspondentes em retas paralelas têm a mesma medida."
          ]
        },
        {
          "id": "mat-b-poligonos",
          "title": "Módulo 2",
          "subtitle": "Polígonos e Circunferência",
          "summary": "Propriedades dos polígonos convexos e regulares, incluindo cálculo de diagonais e ângulos. O módulo também trata de relações entre arcos e ângulos na circunferência.",
          "keyPoints": [
            "Soma dos ângulos internos: (n - 2) * 180º.",
            "Soma dos ângulos externos de um polígono convexo é sempre 360º.",
            "Número de diagonais: d = n(n - 3) / 2.",
            "O ângulo inscrito na circunferência vale metade do arco correspondente.",
            "Polígono regular é equilátero e equiângulo."
          ],
          "glossary": [
            [
              "Polígono Convexo",
              "Polígono onde qualquer segmento ligando dois de seus pontos internos fica inteiramente dentro da figura."
            ],
            [
              "Ângulo Central",
              "Ângulo cujo vértice está no centro da circunferência."
            ],
            [
              "Ângulo Inscrito",
              "Ângulo cujo vértice é um ponto pertencente à circunferência."
            ],
            [
              "Ângulo de Segmento",
              "Ângulo formado por uma reta secante e uma reta tangente à circunferência."
            ],
            [
              "Polígono Regular",
              "Polígono que possui todos os lados congruentes e todos os ângulos congruentes."
            ]
          ],
          "concepts": [
            "polígono regular",
            "soma dos ângulos internos",
            "soma dos ângulos externos",
            "diagonais",
            "circunferência",
            "ângulo inscrito",
            "arco de circunferência"
          ],
          "facts": [
            "O número de diagonais de um polígono depende diretamente do seu número de lados.",
            "A soma dos ângulos externos de qualquer polígono convexo é sempre 360º.",
            "Para calcular a medida de um ângulo interno em um polígono regular, divide-se a soma dos internos pelo número de lados.",
            "A medida do arco correspondente a um ângulo central é idêntica à do próprio ângulo.",
            "Um ângulo de segmento mede a metade da medida do arco correspondente."
          ]
        }
      ]
    },
    {
      "id": "arte",
      "title": "Arte",
      "icon": "🎨",
      "theme": "yellow",
      "description": "Estudo comparativo dos movimentos artísticos Renascimento e Barroco.",
      "modules": [
        {
          "id": "arte-renascimento-barroco",
          "title": "Módulo 1",
          "subtitle": "Renascentismo e Barroco",
          "summary": "Uma análise de dois dos maiores movimentos da história da arte. O Renascimento foca no antropocentrismo, na simetria e na razão. O Barroco foca na emoção, no exagero, no conflito espiritual e na iluminação dramática.",
          "keyPoints": [
            "O Renascimento valoriza a razão, a proporção exata e o resgate da cultura greco-romana.",
            "Perspectiva linear foi uma das grandes inovações técnicas renascentistas.",
            "O Barroco surgiu no contexto da Contrarreforma para atrair fiéis pelas emoções.",
            "Técnica do chiaroscuro, contraste intenso entre luz e sombra, é marca do Barroco.",
            "Enquanto o Renascimento é estático e equilibrado, o Barroco é dinâmico e dramático."
          ],
          "glossary": [
            [
              "Antropocentrismo",
              "Visão de mundo renascentista que coloca o homem como o centro de tudo."
            ],
            [
              "Chiaroscuro",
              "Técnica de pintura focada no contraste drástico entre claro e escuro, criando ilusão de volume."
            ],
            [
              "Contrarreforma",
              "Movimento católico que impulsionou o Barroco como ferramenta de persuasão religiosa."
            ],
            [
              "Perspectiva Linear",
              "Método matemático utilizado no Renascimento para criar a ilusão de profundidade em superfícies planas."
            ],
            [
              "Teocentrismo",
              "A ideia de Deus no centro de tudo, que o Renascimento contrapôs e o Barroco tentou resgatar de forma emocional."
            ]
          ],
          "concepts": [
            "renascimento",
            "barroco",
            "antropocentrismo",
            "chiaroscuro",
            "emoção e drama",
            "harmonia e proporção",
            "contrarreforma"
          ],
          "facts": [
            "Leonardo da Vinci e Michelangelo são representantes icônicos do Renascimento.",
            "Caravaggio é considerado um dos maiores mestres do chiaroscuro no Barroco.",
            "A arte renascentista buscava o equilíbrio perfeito e formas geométricas limpas.",
            "O Barroco utiliza composições diagonais para gerar sensação de movimento e tensão.",
            "A Igreja Católica foi a principal financiadora da arte barroca na Europa."
          ]
        }
      ]
    },
    {
      "id": "biologia",
      "title": "Biologia",
      "icon": "🧬",
      "theme": "green",
      "description": "Interações ecológicas, taxonomia, sistemática filogenética, Reino Monera, vírus e doenças virais.",
      "modules": [
        {
          "id": "bio-interacoes",
          "title": "Módulo 1",
          "subtitle": "Interações ecológicas",
          "summary": "Interações ecológicas são relações entre seres vivos. Podem ocorrer entre indivíduos da mesma espécie ou de espécies diferentes, e podem ser harmônicas, quando ninguém é prejudicado, ou desarmônicas, quando pelo menos um organismo sofre prejuízo.",
          "keyPoints": [
            "Relações intraespecíficas ocorrem na mesma espécie.",
            "Relações interespecíficas ocorrem entre espécies diferentes.",
            "Mutualismo beneficia os dois organismos.",
            "Predatismo beneficia o predador e prejudica a presa.",
            "Competição pode ocorrer por alimento, território, luz ou parceiros."
          ],
          "glossary": [
            [
              "Mutualismo",
              "Relação em que ambos se beneficiam."
            ],
            [
              "Comensalismo",
              "Um se beneficia e o outro não é prejudicado."
            ],
            [
              "Predatismo",
              "Um organismo captura e consome outro."
            ],
            [
              "Parasitismo",
              "Parasita se beneficia prejudicando o hospedeiro."
            ],
            [
              "Competição",
              "Disputa por recursos."
            ]
          ],
          "concepts": [
            "interações ecológicas",
            "intraespecífica",
            "interespecífica",
            "mutualismo",
            "comensalismo",
            "predatismo",
            "parasitismo",
            "competição",
            "harmônica",
            "desarmônica"
          ],
          "facts": [
            "mutualismo beneficia ambos",
            "predatismo envolve presa e predador",
            "parasitismo prejudica hospedeiro",
            "competição disputa recursos",
            "comensalismo não prejudica o outro organismo"
          ]
        },
        {
          "id": "bio-taxonomia",
          "title": "Módulo 2",
          "subtitle": "Taxonomia e filogenética",
          "summary": "Taxonomia classifica os seres vivos em categorias hierárquicas. Sistemática filogenética busca entender relações evolutivas e parentesco entre organismos, usando características compartilhadas e ancestralidade comum.",
          "keyPoints": [
            "Categorias principais: domínio, reino, filo, classe, ordem, família, gênero e espécie.",
            "Espécie é a unidade básica de classificação.",
            "Nome científico usa gênero e espécie.",
            "Filogenia representa parentesco evolutivo.",
            "Cladogramas mostram hipóteses de ancestralidade comum."
          ],
          "glossary": [
            [
              "Taxonomia",
              "Área que identifica, nomeia e classifica seres vivos."
            ],
            [
              "Sistemática",
              "Estudo da diversidade e das relações evolutivas."
            ],
            [
              "Filogenia",
              "História evolutiva de um grupo."
            ],
            [
              "Cladograma",
              "Diagrama de parentesco evolutivo."
            ],
            [
              "Espécie",
              "Unidade básica de classificação biológica."
            ]
          ],
          "concepts": [
            "taxonomia",
            "sistemática",
            "filogenética",
            "domínio",
            "reino",
            "espécie",
            "gênero",
            "nome científico",
            "cladograma",
            "ancestral comum"
          ],
          "facts": [
            "espécie é unidade básica",
            "nome científico usa gênero e espécie",
            "cladograma mostra parentesco",
            "filogenia estuda história evolutiva",
            "taxonomia organiza seres vivos"
          ]
        },
        {
          "id": "bio-monera",
          "title": "Módulo 3",
          "subtitle": "Reino Monera",
          "summary": "O Reino Monera inclui organismos procariontes, como bactérias e cianobactérias. Eles não possuem núcleo verdadeiro nem organelas membranosas e podem ter grande diversidade metabólica e ecológica.",
          "keyPoints": [
            "Procariontes não possuem núcleo delimitado por membrana.",
            "Bactérias têm DNA no nucleoide.",
            "Parede celular bacteriana geralmente contém peptidoglicano.",
            "Podem ser autotróficas ou heterotróficas.",
            "Algumas causam doenças, mas muitas são importantes para decomposição, produção de alimentos e ciclos biogeoquímicos."
          ],
          "glossary": [
            [
              "Procarionte",
              "Célula sem núcleo verdadeiro."
            ],
            [
              "Nucleoide",
              "Região onde fica o DNA bacteriano."
            ],
            [
              "Bactéria",
              "Organismo unicelular procarionte."
            ],
            [
              "Cianobactéria",
              "Procarionte fotossintetizante."
            ],
            [
              "Peptidoglicano",
              "Componente comum da parede bacteriana."
            ]
          ],
          "concepts": [
            "Monera",
            "bactéria",
            "cianobactéria",
            "procarionte",
            "nucleoide",
            "parede celular",
            "peptidoglicano",
            "autotrófico",
            "heterotrófico",
            "decomposição"
          ],
          "facts": [
            "bactérias são procariontes",
            "procariontes não têm núcleo verdadeiro",
            "cianobactérias fazem fotossíntese",
            "nucleoide contém DNA",
            "muitas bactérias são úteis"
          ]
        },
        {
          "id": "bio-virus",
          "title": "Módulo 4",
          "subtitle": "Vírus",
          "summary": "Vírus são entidades acelulares formadas por material genético envolto por cápside, podendo ter envelope. Eles não possuem metabolismo próprio e dependem de células hospedeiras para se replicar.",
          "keyPoints": [
            "Vírus são acelulares.",
            "Possuem DNA ou RNA como material genético.",
            "Cápside é a estrutura proteica que protege o material genético.",
            "São parasitas intracelulares obrigatórios.",
            "Só se replicam dentro de células hospedeiras."
          ],
          "glossary": [
            [
              "Acelular",
              "Não formado por célula."
            ],
            [
              "Cápside",
              "Camada proteica do vírus."
            ],
            [
              "Envelope",
              "Membrana externa presente em alguns vírus."
            ],
            [
              "Hospedeiro",
              "Organismo ou célula infectada."
            ],
            [
              "Replicação",
              "Produção de novas partículas virais."
            ]
          ],
          "concepts": [
            "vírus",
            "acelular",
            "DNA",
            "RNA",
            "cápside",
            "envelope",
            "hospedeiro",
            "parasita intracelular obrigatório",
            "replicação",
            "infecção"
          ],
          "facts": [
            "vírus não têm metabolismo próprio",
            "vírus precisam de célula hospedeira",
            "cápside protege material genético",
            "vírus podem ter DNA ou RNA",
            "alguns vírus possuem envelope"
          ]
        },
        {
          "id": "bio-doencas-virais",
          "title": "Módulo 5",
          "subtitle": "Doenças virais",
          "summary": "Doenças causadas por vírus dependem da entrada do vírus no organismo e da infecção de células hospedeiras. Prevenção pode envolver vacinação, higiene, controle de vetores, isolamento e uso de medidas de proteção conforme a transmissão.",
          "keyPoints": [
            "Vacinas estimulam resposta imunológica preventiva.",
            "Algumas viroses são transmitidas por gotículas respiratórias.",
            "Outras dependem de vetores, como mosquitos.",
            "Antibióticos não tratam vírus; eles agem contra bactérias.",
            "Prevenção depende do modo de transmissão."
          ],
          "glossary": [
            [
              "Virose",
              "Doença causada por vírus."
            ],
            [
              "Vacina",
              "Método preventivo que estimula imunidade."
            ],
            [
              "Vetor",
              "Organismo que transmite agente infeccioso."
            ],
            [
              "Imunidade",
              "Capacidade de defesa do organismo."
            ],
            [
              "Transmissão",
              "Forma de passagem do agente infeccioso."
            ]
          ],
          "concepts": [
            "doença viral",
            "virose",
            "vacina",
            "imunidade",
            "vetor",
            "transmissão",
            "gotículas",
            "higiene",
            "prevenção",
            "antibiótico"
          ],
          "facts": [
            "antibióticos não combatem vírus",
            "vacinas ajudam na prevenção",
            "mosquitos podem ser vetores",
            "higiene reduz transmissão",
            "prevenção depende da forma de transmissão"
          ]
        }
      ]
    },
    {
      "id": "geografia",
      "title": "Geografia",
      "icon": "🌎",
      "theme": "violet",
      "description": "Estrutura interna da Terra, formação do relevo brasileiro, solos e recursos minerais.",
      "modules": [
        {
          "id": "geo-interior-terra",
          "title": "Módulo 5",
          "subtitle": "Interior da Terra",
          "summary": "O planeta é organizado em camadas concêntricas que vão da crosta terrestre, mais externa e fina, até o núcleo interno, no centro do planeta, passando pelo manto superior, manto inferior e núcleo externo. Paralelamente, a história geológica da Terra é dividida em eras (Pré-Cambriana, Paleozoica, Mesozoica e Cenozoica), cada uma marcada por eventos como a formação de cadeias de montanhas, o surgimento de novos grupos de seres vivos e mudanças na configuração dos continentes.",
          "keyPoints": [
            "A estrutura interna da Terra é dividida em crosta, manto superior, manto inferior, núcleo externo e núcleo interno.",
            "As eras geológicas (Pré-Cambriana, Paleozoica, Mesozoica e Cenozoica) organizam a história da Terra em grandes intervalos de tempo.",
            "Eventos como o surgimento de dinossauros, aves e do Homo sapiens marcam a transição entre diferentes períodos geológicos.",
            "A fragmentação de um supercontinente original deu origem à configuração atual dos continentes.",
            "Processos vulcânicos e movimentos da crosta terrestre estão associados à formação de cadeias de montanhas em diferentes eras."
          ],
          "glossary": [
            [
              "Crosta terrestre",
              "Camada mais externa e fina da estrutura interna da Terra."
            ],
            [
              "Manto",
              "Camada interna situada entre a crosta e o núcleo, dividida em superior e inferior."
            ],
            [
              "Núcleo",
              "Camada mais interna da Terra, dividida em núcleo externo e núcleo interno."
            ],
            [
              "Era geológica",
              "Grande intervalo de tempo usado para organizar a história da Terra."
            ],
            [
              "Pangeia",
              "Massa continental única que reunia os continentes atuais antes de sua fragmentação."
            ]
          ],
          "concepts": [
            "crosta terrestre",
            "manto superior",
            "manto inferior",
            "núcleo externo",
            "núcleo interno",
            "era geológica",
            "Pangeia",
            "vulcanismo",
            "dobramento",
            "Cenozoico"
          ],
          "facts": [
            "a Terra é dividida em camadas concêntricas, da crosta ao núcleo interno",
            "as eras geológicas vão do Pré-Cambriano ao Cenozoico",
            "o Homo sapiens surge na era Cenozoica",
            "os continentes atuais resultam da fragmentação de uma massa continental única",
            "atividade vulcânica e movimentos da crosta formam cadeias de montanhas"
          ]
        },
        {
          "id": "geo-relevo-solos",
          "title": "Módulo 8",
          "subtitle": "Relevo e solos do Brasil",
          "summary": "O relevo brasileiro varia por região: o Norte tem predomínio de depressões e planaltos de baixa altitude; o Nordeste combina planaltos cristalinos e sedimentares com planícies e tabuleiros litorâneos; Sudeste e Centro-Oeste apresentam planaltos, chapadas e a planície do Pantanal; o Sul tem planaltos com depressões periféricas e a planície da lagoa dos Patos. Já o solo se forma a partir de meteorização, erosão, transporte e sedimentação, sendo constituído por partes minerais, água, ar e matéria orgânica, organizadas em horizontes (O, A, B e C) que vão da camada mais orgânica e escura até a rocha matriz.",
          "keyPoints": [
            "O relevo de cada região brasileira combina, em proporções diferentes, planaltos, planícies e depressões.",
            "O Pantanal é descrito como a planície mais típica e homogênea do território brasileiro.",
            "A formação do solo depende de meteorização, erosão, transporte e sedimentação de materiais rochosos.",
            "O solo é constituído por partes sólidas minerais, matéria orgânica, água e ar, distribuídos entre poros e partículas.",
            "Os horizontes do solo (O, A, B e C) representam camadas com composição e função diferentes, da superfície até a rocha matriz."
          ],
          "glossary": [
            [
              "Planalto",
              "Forma de relevo elevada e relativamente plana, geralmente delimitada por bordas mais altas."
            ],
            [
              "Depressão",
              "Área de relevo rebaixada em relação ao entorno."
            ],
            [
              "Meteorização",
              "Processo de desagregação e alteração das rochas em contato com o ambiente."
            ],
            [
              "Horizonte do solo",
              "Camada do solo com características próprias de composição e cor."
            ],
            [
              "Sedimentação",
              "Depósito de partículas transportadas por água, vento ou gelo."
            ]
          ],
          "concepts": [
            "planalto",
            "planície",
            "depressão",
            "Pantanal",
            "meteorização",
            "erosão",
            "sedimentação",
            "horizonte do solo",
            "matéria orgânica",
            "relevo regional"
          ],
          "facts": [
            "o relevo brasileiro varia de região para região, combinando planaltos, planícies e depressões",
            "o Pantanal é a planície mais típica e homogênea do Brasil",
            "o solo resulta de meteorização, erosão, transporte e sedimentação de rochas",
            "o horizonte O é o mais superficial e rico em matéria orgânica em decomposição",
            "os horizontes do solo se organizam em camadas até alcançar a rocha matriz"
          ]
        },
        {
          "id": "geo-recursos-minerais",
          "title": "Módulo 9",
          "subtitle": "Recursos minerais do Brasil",
          "summary": "Os recursos minerais não energéticos se dividem em minerais metálicos (como ferro, alumínio, cobre e zinco) e minerais não metálicos (como fosfato, potássio e sal marinho). O Quadrilátero Ferrífero, em Minas Gerais, é uma das principais áreas de concentração de jazidas minerais do país, com destaque para o minério de ferro. A produção desse polo é escoada principalmente pela Estrada de Ferro Vitória a Minas até o Complexo Portuário de Tubarão, no Espírito Santo, o que conecta a extração mineral do interior à exportação pelo litoral.",
          "keyPoints": [
            "Minerais metálicos incluem ferro, alumínio, cobre, zinco, manganês e estanho, entre outros.",
            "Minerais não metálicos incluem fosfato, potássio e sal marinho, usados sobretudo na indústria e na agricultura.",
            "O Quadrilátero Ferrífero, em Minas Gerais, concentra importantes jazidas de minério de ferro e outros minerais metálicos.",
            "A Estrada de Ferro Vitória a Minas conecta a área de extração mineral ao Complexo Portuário de Tubarão, no Espírito Santo.",
            "A infraestrutura ferroviária e portuária é decisiva para viabilizar a exportação dos minérios extraídos no interior do país."
          ],
          "glossary": [
            [
              "Mineral metálico",
              "Recurso mineral do qual se extraem metais, como ferro e alumínio."
            ],
            [
              "Mineral não metálico",
              "Recurso mineral sem caráter metálico, como fosfato e potássio."
            ],
            [
              "Quadrilátero Ferrífero",
              "Região de Minas Gerais com grande concentração de jazidas de minério de ferro."
            ],
            [
              "Jazida",
              "Concentração natural de um recurso mineral em quantidade economicamente aproveitável."
            ],
            [
              "Escoamento da produção",
              "Transporte do recurso extraído até os portos ou centros de consumo."
            ]
          ],
          "concepts": [
            "mineral metálico",
            "mineral não metálico",
            "Quadrilátero Ferrífero",
            "minério de ferro",
            "jazida",
            "Estrada de Ferro Vitória a Minas",
            "Complexo Portuário de Tubarão",
            "exportação mineral"
          ],
          "facts": [
            "ferro, alumínio, cobre e zinco são exemplos de minerais metálicos",
            "fosfato, potássio e sal marinho são exemplos de minerais não metálicos",
            "o Quadrilátero Ferrífero está localizado em Minas Gerais",
            "a Estrada de Ferro Vitória a Minas liga a área de mineração ao litoral do Espírito Santo",
            "o Complexo Portuário de Tubarão é um dos destinos do minério extraído em Minas Gerais"
          ]
        }
      ]
    },
    {
      "id": "historia",
      "title": "História",
      "icon": "🏛️",
      "theme": "dark",
      "description": "Barroco colonial brasileiro e o mundo diante da expansão marítima europeia.",
      "modules": [
        {
          "id": "historia-5",
          "title": "Módulo 5",
          "subtitle": "Barroco no Brasil colonial",
          "summary": "O Barroco se divide em duas grandes tendências: o cultismo, marcado por jogos de palavras, linguagem rebuscada e temática amorosa, e o conceptismo, marcado por jogos de ideias, raciocínios elaborados e temática religiosa. No Brasil colonial, essa estética aparece nos sermões do padre Antônio Vieira, que atua como intérprete de sinais divinos ligado à ideologia da Contrarreforma e discute religião, política e sociedade, e na poesia de Gregório de Matos, conhecido como 'Boca do Inferno', que combina poesia lírica e erótica (amor carnal e malícia), poesia religiosa (busca de perdão), poesia satírica (crítica social) e poesia reflexiva (consciência da efemeridade das coisas).",
          "keyPoints": [
            "Cultismo valoriza o jogo de palavras, a linguagem rebuscada e a temática amorosa.",
            "Conceptismo valoriza o jogo de ideias, o raciocínio elaborado e a temática religiosa.",
            "Antônio Vieira usa o sermão para interpretar sinais divinos e discutir religião, política e sociedade, alinhado à Contrarreforma.",
            "Gregório de Matos, apelidado 'Boca do Inferno', escreve poesia lírica, erótica, religiosa, satírica e reflexiva.",
            "A poesia satírica de Gregório de Matos funciona como instrumento de crítica social na sociedade colonial baiana."
          ],
          "glossary": [
            [
              "Cultismo",
              "Tendência barroca centrada no jogo de palavras e na linguagem rebuscada."
            ],
            [
              "Conceptismo",
              "Tendência barroca centrada no jogo de ideias e no raciocínio elaborado."
            ],
            [
              "Contrarreforma",
              "Reação católica à Reforma Protestante, marcada por forte apelo religioso e persuasivo na arte."
            ],
            [
              "Sermão",
              "Gênero textual religioso usado por Antônio Vieira para interpretar e ensinar."
            ],
            [
              "Poesia satírica",
              "Poesia que critica costumes e comportamentos da sociedade."
            ]
          ],
          "concepts": [
            "cultismo",
            "conceptismo",
            "Barroco",
            "Antônio Vieira",
            "sermão",
            "Contrarreforma",
            "Gregório de Matos",
            "poesia satírica",
            "poesia religiosa",
            "Boca do Inferno"
          ],
          "facts": [
            "cultismo prioriza jogo de palavras e conceptismo prioriza jogo de ideias",
            "Antônio Vieira é autor de sermões ligados à Contrarreforma",
            "Gregório de Matos ficou conhecido como 'Boca do Inferno'",
            "a poesia de Gregório de Matos inclui vertentes lírica, erótica, religiosa, satírica e reflexiva",
            "o Barroco no Brasil colonial combina temas religiosos e temas profanos"
          ]
        },
        {
          "id": "historia-6",
          "title": "Módulo 6",
          "subtitle": "Expansão europeia e conquista da América",
          "summary": "A expansão marítima europeia dos séculos XV e XVI conectou partes do mundo que antes não se relacionavam diretamente, colocando em contato sociedades africanas, americanas e europeias. No território que hoje é o Brasil, viviam diferentes culturas indígenas (como tupi-guarani, jê, aruak e karib) antes de 1500. Na América espanhola, os impérios Inca e Asteca tinham estruturas políticas complexas, sendo o Inca mais centralizado e o Asteca organizado como uma federação que subordinava outros grupos, como os tlaxcalas e totonacas. A conquista espanhola, liderada por Hernán Cortés contra os astecas e por Francisco Pizarro contra os incas, combinou armas de fogo, cavalos, alianças com povos indígenas rivais e doenças trazidas pelos europeus, resultando em grande mortalidade indígena, exploração do trabalho e imposição de valores e da língua europeia.",
          "keyPoints": [
            "A expansão marítima dos séculos XV e XVI aproximou regiões do mundo que antes tinham pouco ou nenhum contato direto.",
            "Antes de 1500, o território brasileiro já era ocupado por diferentes culturas indígenas, como tupi-guarani, jê, aruak e karib.",
            "O Império Inca tinha estrutura política centralizada, enquanto o Império Asteca era organizado de forma federativa, subordinando outros povos.",
            "Hernán Cortés conquistou o Império Asteca e Francisco Pizarro conquistou o Império Inca, usando armas, cavalos e alianças com grupos indígenas rivais.",
            "As doenças trazidas pelos europeus, como varíola e sarampo, tiveram papel central na altíssima mortalidade das populações indígenas."
          ],
          "glossary": [
            [
              "Expansão marítima",
              "Processo de exploração e domínio de novas rotas e territórios pelos europeus a partir do século XV."
            ],
            [
              "Império Asteca",
              "Império mesoamericano de estrutura federativa, conquistado por Hernán Cortés."
            ],
            [
              "Império Inca",
              "Império andino de estrutura política centralizada, conquistado por Francisco Pizarro."
            ],
            [
              "Genocídio indígena",
              "Extermínio em massa de populações indígenas durante a conquista europeia."
            ],
            [
              "Sincretismo cultural",
              "Mistura de elementos culturais europeus e indígenas ou africanos originada do contato entre os povos."
            ]
          ],
          "concepts": [
            "expansão marítima",
            "povos indígenas",
            "tupi-guarani",
            "Império Inca",
            "Império Asteca",
            "Hernán Cortés",
            "Francisco Pizarro",
            "conquista espanhola",
            "doenças europeias",
            "contato luso-africano"
          ],
          "facts": [
            "a expansão europeia dos séculos XV e XVI ligou partes do mundo antes desconectadas",
            "tupi-guarani, jê, aruak e karib são exemplos de troncos linguísticos indígenas no Brasil pré-1500",
            "Hernán Cortés submeteu o Império Asteca e seu imperador Montezuma",
            "Francisco Pizarro submeteu o Império Inca e seu imperador Atahualpa",
            "doenças como varíola e sarampo contribuíram fortemente para a mortalidade indígena durante a conquista"
          ]
        }
      ]
    }
  ];

  // Ícones por matéria pertencem AO APP (o Core não conhece matérias).
  var SUBJECT_ICONS = {
    quimica: '<svg viewBox="0 0 64 64"><path d="M25 14h14M29 14v13L17 48a5 5 0 0 0 4 8h22a5 5 0 0 0 4-8L35 27V14"/><path d="M22 45h20"/></svg>',
    portugues: '<svg viewBox="0 0 64 64"><path d="M16 16h20a8 8 0 0 1 8 8v26H24a8 8 0 0 1-8-8V16Z"/><path d="M26 28h15M26 36h12"/></svg>',
    fisica: '<svg viewBox="0 0 64 64"><path d="M32 12v40M18 22c9 8 19 8 28 0M18 42c9-8 19-8 28 0"/><circle cx="32" cy="32" r="5"/></svg>',
    circuitos: '<svg viewBox="0 0 64 64"><path d="M18 18h28v28H18V18Z"/><path d="M26 10v8M38 10v8M26 46v8M38 46v8M10 26h8M10 38h8M46 26h8M46 38h8"/><path d="M27 35h10l-4-7h8"/></svg>',
    calculadoras: '<svg viewBox="0 0 64 64"><path d="M20 12h24a4 4 0 0 1 4 4v32a4 4 0 0 1-4 4H20a4 4 0 0 1-4-4V16a4 4 0 0 1 4-4Z"/><path d="M23 20h18M24 31h.1M32 31h.1M40 31h.1M24 39h.1M32 39h.1M40 39h.1"/></svg>',
    logica: '<svg viewBox="0 0 64 64"><path d="M18 20h16a10 10 0 0 1 0 20H18V20Z"/><path d="M34 30h13M47 22v16M18 44h28"/></svg>',
    ingles: '<svg viewBox="0 0 64 64"><path d="M15 18h34v24H29L18 51v-9h-3V18Z"/><path d="M23 28h18M23 36h11"/></svg>',
    biologia: '<svg viewBox="0 0 64 64"><path d="M22 14c17 9 23 27 20 36M42 14c-17 9-23 27-20 36"/><path d="M25 23h14M22 32h20M25 41h14"/></svg>',
    "matematica-a": '<svg viewBox="0 0 64 64"><path d="M18 18 46 46M46 18 18 46"/><path d="M17 50h30"/></svg>',
    "matematica-b": '<svg viewBox="0 0 64 64"><path d="M16 48 48 16v32H16Z"/><path d="M25 48c0-6 4-10 10-10"/></svg>',
    arte: '<svg viewBox="0 0 64 64"><path d="M32 13c-11 0-19 7-19 17 0 8 6 15 15 15h3c2 0 3 1 3 3 0 3 3 5 7 3 7-3 10-9 10-17 0-12-8-21-19-21Z"/><circle cx="24" cy="27" r="2"/><circle cx="32" cy="22" r="2"/><circle cx="40" cy="28" r="2"/></svg>',
    geografia: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="19"/><path d="M13 32h38M32 13c6 5 9 12 9 19s-3 14-9 19c-6-5-9-12-9-19s3-14 9-19Z"/><path d="M17 22c5 3 10 3 15 0s10-3 15 0M17 42c5-3 10-3 15 0s10 3 15 0"/></svg>',
    historia: '<svg viewBox="0 0 64 64"><path d="M11 22 32 12l21 10-21 8-21-8Z"/><path d="M18 27v14M26 27v14M38 27v14M46 27v14"/><path d="M14 49h36"/></svg>'
  };
  var DEFAULT_ICON = '<svg viewBox="0 0 64 64"><path d="M18 14h21l7 7v29H18V14Z"/><path d="M39 14v8h7M24 30h16M24 38h16M24 46h10"/></svg>';

  function iconFor(id) { return SUBJECT_ICONS[id] || DEFAULT_ICON; }

  /* ----------------------------------------------------------------- *
   * 1b) PONTE COM A NUVEM (KickHub.db) — sem que a VIEW saiba dela.    *
   * ---------------------------------------------------------------------
   * As matérias acima (SUBJECTS) viram o SEED offline. No banco elas são
   * relacionais (subjects + modules), então registramos as duas coleções
   * achatadas e recompomos a estrutura aninhada na leitura. Se o db não
   * estiver carregado, caímos direto no SUBJECTS local (resiliência).   */
  var SUBJECTS_FLAT = SUBJECTS.map(function (s, i) {
    return { id: s.id, title: s.title, description: s.description, theme: s.theme, order_index: i * 10 };
  });
  var MODULES_FLAT = [];
  SUBJECTS.forEach(function (s) {
    (s.modules || []).forEach(function (m, j) {
      MODULES_FLAT.push({
        id: m.id, subject_id: s.id, title: m.title, subtitle: m.subtitle, summary: m.summary,
        key_points: m.keyPoints, glossary: m.glossary, concepts: m.concepts, facts: m.facts, order_index: j * 10
      });
    });
  });
  if (KickHub.db) {
    KickHub.db.seed("subjects", SUBJECTS_FLAT);
    KickHub.db.seed("modules", MODULES_FLAT);
  }

  function byOrder(a, b) { return (a.order_index || 0) - (b.order_index || 0); }

  // Recompõe subjects + modules (achatados) na árvore que a view consome.
  function compose(subjectsFlat, modulesFlat) {
    var byId = {};
    subjectsFlat.forEach(function (s) {
      byId[s.id] = { id: s.id, title: s.title, description: s.description, theme: s.theme, modules: [] };
    });
    modulesFlat.slice().sort(byOrder).forEach(function (m) {
      var s = byId[m.subject_id];
      if (!s) return;
      s.modules.push({
        id: m.id, title: m.title, subtitle: m.subtitle, summary: m.summary,
        keyPoints: m.key_points || [], glossary: m.glossary || [], concepts: m.concepts || [], facts: m.facts || []
      });
    });
    return subjectsFlat.slice().sort(byOrder).map(function (s) { return byId[s.id]; })
      .filter(function (s) { return s && s.modules.length; });
  }

  // Leitura offline-first: cache/seed instantâneo + revalidação na nuvem.
  function loadDataset(ctx) {
    if (!ctx.db) return Promise.resolve(SUBJECTS);
    return Promise.all([
      ctx.db.collection("subjects").list(),
      ctx.db.collection("modules").list()
    ]).then(function (res) {
      var composed = compose(res[0], res[1]);
      return composed.length ? composed : SUBJECTS;
    }).catch(function () { return SUBJECTS; });
  }

  function findSubject(dataset, id) {
    for (var i = 0; i < dataset.length; i++) if (dataset[i].id === id) return dataset[i];
    return null;
  }
  function findModule(subject, moduleId) {
    if (!subject) return null;
    for (var i = 0; i < subject.modules.length; i++) {
      if (subject.modules[i].id === moduleId) return subject.modules[i];
    }
    return subject.modules[0];
  }

  /* ----------------------------------------------------------------- *
   * 2) VIEW — só desenha; os dados chegam prontos da camada acima.    *
   * ----------------------------------------------------------------- */
  function render(host, ctx) {
    // Estado local da navegação INTERNA do app.
    var view = { subjectId: ctx.params.subjectId || null, current: null };
    var dataset = SUBJECTS; // começa no seed; é atualizado pela nuvem abaixo

    // O Core pergunta antes de subir um nível: tratamos o "voltar" interno.
    ctx.onBack(function () {
      if (view.subjectId) { showPicker(); return true; }
      return false; // deixa o Core voltar para a Escola
    });

    draw(); // desenho imediato (offline/seed)

    // Revalida com cache/nuvem e redesenha a tela atual se algo mudou.
    loadDataset(ctx).then(function (data) {
      dataset = data;
      draw();
    });

    function draw() {
      if (view.subjectId && findSubject(dataset, view.subjectId)) showSubject(view.subjectId, view.moduleId);
      else showPicker();
    }

    /* ---- Tela 1: seletor de matérias ---- */
    function showPicker() {
      view.subjectId = null;
      view.current = "picker";
      ctx.setBreadcrumb();
      var row = el("div", { class: "kh-card-row" });
      dataset.forEach(function (subject) {
        var card = KickHub.ui.card(
          { title: subject.title, subtitle: subject.description, theme: subject.theme, icon: iconFor(subject.id) },
          function () { showSubject(subject.id); }
        );
        row.appendChild(card);
      });
      host.replaceChildren(el("div", { class: "kh-view--menu" }, row));
    }

    /* ---- Tela 2: matéria com lista de módulos + resumo ---- */
    function showSubject(subjectId, moduleId) {
      var subject = findSubject(dataset, subjectId);
      if (!subject) { showPicker(); return; }
      view.subjectId = subjectId;
      view.moduleId = moduleId;
      view.current = "subject";
      var activeModule = findModule(subject, moduleId);
      ctx.setBreadcrumb(subject.title);

      var list = el("aside", { class: "kh-panel kh-module-list" });
      subject.modules.forEach(function (mod) {
        var btn = el("button", {
          class: "kh-module-btn" + (mod.id === activeModule.id ? " is-active" : ""),
          type: "button"
        }, [
          el("span", { text: mod.title }),
          el("small", { text: mod.subtitle })
        ]);
        ctx.on(btn, "click", function () { showSubject(subjectId, mod.id); });
        list.appendChild(btn);
      });

      var article = el("article", { class: "kh-panel kh-summary" });
      article.innerHTML =
        "<h3>" + esc(activeModule.title) + ": " + esc(activeModule.subtitle) + "</h3>" +
        "<p>" + esc(activeModule.summary) + "</p>" +
        "<h3>Pontos principais</h3>" +
        "<ul class=\"kh-summary__list\">" +
          activeModule.keyPoints.map(function (p) { return "<li>" + esc(p) + "</li>"; }).join("") +
        "</ul>" +
        "<div class=\"kh-term-grid\">" +
          activeModule.glossary.map(function (pair) {
            return "<div class=\"kh-term\"><strong>" + esc(pair[0]) + "</strong><span>" + esc(pair[1]) + "</span></div>";
          }).join("") +
        "</div>";

      var header = el("div", { class: "kh-screen-head" }, [
        el("h1", { class: "kh-screen-title", text: subject.title }),
        el("p", { class: "kh-screen-lead", text: subject.description })
      ]);
      var grid = el("div", { class: "kh-subject-grid" }, [list, article]);
      host.replaceChildren(el("div", null, [header, grid]));
    }
  }

  // Escape mínimo para conteúdo textual injetado via innerHTML.
  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ----------------------------------------------------------------- *
   * 3) REGISTRO — único ponto de acoplamento ao Core.                 *
   * ----------------------------------------------------------------- */
  KickHub.registerApp({
    id: "resumos",
    parent: "escola",
    title: "Resumos",
    subtitle: SUBJECTS.length + " matérias",
    theme: "green",
    order: 20,
    icon: '<svg viewBox="0 0 64 64"><path d="M18 14h21l7 7v29H18V14Z"/><path d="M39 14v8h7M24 30h16M24 38h16M24 46h10"/></svg>',
    mount: render
  });
})();
