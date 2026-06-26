# Kick Hub - Guia de Manutenção

## Visão geral

O Kick Hub é um site estático. Para publicar, basta enviar estes arquivos e pastas para a hospedagem:

- `index.html`
- `style.css`
- `script.js`
- `data.js`
- `assets/`
- `espanhol/`
- `portugues/`
- `guide.md` se quiser manter a documentação online no repositório

Não precisa de backend, banco de dados, build, npm ou servidor especial. Abrir `index.html` já carrega o site.

## Senha atual

O único app protegido é `Escola`.

Senha atual:

```txt
info2026
```

Para trocar a senha, edite em `data.js`:

```js
schoolPassword: "info2026"
```

Observação importante: como o site é estático, essa senha é uma proteção simples de interface. Quem souber inspecionar o código do navegador consegue ver a senha. Para segurança real, seria necessário backend/autenticação.

## Estrutura dos arquivos

### `index.html`

Contém a estrutura base:

- topo com perfil, relógio e breadcrumb
- área principal onde o JavaScript renderiza os menus e telas
- rodapé com botões de configuração e bloqueio
- modal de senha
- modal de informação
- modal de calendário
- template de card estilo Switch
- importação de `data.js` e `script.js`

Normalmente você não precisa mexer nele para adicionar matéria nova.

### `style.css`

Define o visual do Kick Hub:

- menu estilo Nintendo Switch
- cards coloridos com efeitos de hover e glow
- modais com efeito de vidro (backdrop-filter)
- telas de resumo
- responsividade para celular

Para criar uma cor nova de card, adicione uma classe parecida com:

```css
.sw-card.theme-nova { background: linear-gradient(150deg, #cor1, #cor2); color: var(--white); }
```

Depois use `theme: "nova"` no item em `data.js`.

### `script.js`

Controla o funcionamento:

- senha única do app Escola
- navegação entre menus
- botão voltar
- renderização de Trabalhos e Resumos
- calendário escolar com eventos e detalhes do dia

Evite editar `script.js` para conteúdo. Conteúdo entra em `data.js`.

### `data.js`

É o arquivo principal de conteúdo.

Ele contém:

- `schoolPassword`
- lista de trabalhos em `works`
- eventos do calendário escolar em `calendarEvents`
- lista de matérias em `subjects`
- módulos de cada matéria
- resumos
- pontos principais
- glossário
- conceitos e fatos de cada módulo

## Como funciona a hierarquia

```txt
Kick Hub
└── Escola
    ├── Trabalhos
    │   ├── Espanhol
    │   └── Português
    └── Resumos
        ├── Química A
        ├── Análise Linguística
        ├── Física
        ├── Circuitos de Programação
        ├── Calculadoras Contábeis
        ├── Lógica de Programação
        ├── Inglês
        ├── Matemática A
        ├── Matemática B
        ├── Arte
        ├── Biologia
        ├── Geografia
        └── História
```

Português e Espanhol continuam existindo como trabalhos antigos, mas agora ficam dentro de `Escola > Trabalhos` e não possuem senha própria.

## Como adicionar um trabalho novo

1. Crie uma pasta para o trabalho, por exemplo:

```txt
historia/
```

2. Dentro dela, crie a página:

```txt
historia/revolucao-francesa.html
```

3. Adicione o trabalho em `data.js`, dentro de `works`:

```js
{
  id: "historia-revolucao-francesa",
  title: "História",
  subtitle: "Revolução Francesa",
  icon: "🏛️",
  theme: "blue",
  url: "historia/revolucao-francesa.html"
}
```

4. O trabalho aparecerá em `Escola > Trabalhos`.

## Como adicionar uma matéria nova

Em `data.js`, adicione um novo objeto dentro de `subjects`.

Modelo:

```js
{
  id: "historia",
  title: "História",
  icon: "🏛️",
  theme: "blue",
  description: "Resumo geral da matéria.",
  modules: [
    {
      id: "historia-1",
      title: "Módulo 1",
      subtitle: "Tema do módulo",
      summary: "Resumo em um parágrafo.",
      keyPoints: [
        "Ponto principal 1.",
        "Ponto principal 2.",
        "Ponto principal 3."
      ],
      glossary: [
        ["Termo", "Explicação curta."],
        ["Outro termo", "Outra explicação curta."]
      ],
      concepts: ["conceito 1", "conceito 2", "conceito 3"],
      facts: ["fato importante 1", "fato importante 2", "fato importante 3"]
    }
  ]
}
```

Depois de salvar, a matéria entra automaticamente em `Resumos`.

## Tutorial para uma IA adicionar matéria nova

Use este procedimento quando receber novos PDFs, apostilas ou anotações.

1. Leia o material e identifique a matéria.

2. Separe o conteúdo em módulos. Se o material já tiver módulos, preserve a divisão original. Se não tiver, agrupe por temas.

3. Para cada módulo, produza:

- `subtitle`: nome curto do tema
- `summary`: um parágrafo com o essencial
- `keyPoints`: 5 pontos de revisão
- `glossary`: 5 termos com explicações curtas
- `concepts`: 8 a 12 palavras-chave
- `facts`: 5 a 8 afirmações corretas e relevantes sobre o tema

4. Não edite `script.js` para adicionar conteúdo.

5. Insira a matéria em `subjects`, dentro de `data.js`.

6. Garanta que cada `id` seja único, sem espaço e sem acento. Exemplos bons:

```txt
historia
historia-1
biologia-celulas
matematica-funcoes
```

7. Escolha um `theme` já existente:

```txt
red
blue
green
yellow
violet
dark
white
```

8. Teste no navegador:

- abrir `index.html`
- entrar em `Escola`
- digitar a senha
- abrir `Resumos`
- conferir a matéria nova
- abrir um módulo e revisar resumo, pontos principais e glossário

9. Se algo não aparecer, verifique:

- vírgulas no `data.js`
- aspas fechadas
- `id` repetido
- arrays com `[` e `]`
- objetos com `{` e `}`
- se `concepts` e `facts` não estão vazios

## Assets

O site já usa os assets atuais:

- `assets/pfp.png`
- `assets/capa-album.jpg`
- `assets/gregorio-matos-retrato.jpg`
- `assets/manu-chao-perfil.jpg`
- `assets/disco-vinil.png`
- `assets/me-gustas-tu-audio.mp3`
- `assets/mapa-mundi-vintage.png`

Nenhum asset novo é obrigatório para os menus e resumos. Se quiser melhorar visualmente no futuro, pode adicionar capas por matéria e adaptar o card no `script.js`, mas a versão atual funciona sem isso.

## Checklist antes de publicar

- Abrir `index.html` localmente.
- Testar senha `info2026`.
- Conferir `Escola > Trabalhos`.
- Conferir `Escola > Resumos`.
- Verificar se a hospedagem mantém a estrutura de pastas.
- Enviar tudo com codificação UTF-8.
