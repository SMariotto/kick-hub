# Kick Hub — Guia de Arquitetura e Manutenção

> Mapa oficial do projeto. Leia isto antes de criar uma ferramenta nova.

O Kick Hub é um **ecossistema de apps** com interface estilo Nintendo Switch.
A arquitetura é **modular baseada em plugins**: um **Core** agnóstico fornece as
APIs e o contêiner, e cada ferramenta é um **plugin independente e deletável**.
Os dados são **offline-first** (IndexedDB local + Supabase na nuvem), e o mesmo
código roda na Web (Netlify) e como app Android (Capacitor).

---

## 1. Estrutura de pastas

```
kick-hub/  (raiz do repositório — só infra/config/docs)
├── www/                      ← TUDO que é servido e empacotado
│   ├── index.html            ← shell mínimo + <script> do core e plugins
│   ├── core.js               ← o "SO": APIs + contêiner (NÃO conhece apps)
│   ├── db.js                 ← KickHub.db (offline-first: IndexedDB + Supabase)
│   ├── auth.js               ← KickHub.auth (login real por e-mail/senha)
│   ├── kickhub.config.js     ← onde vão a URL e a anon key do Supabase
│   ├── style.css             ← BEM (kh-), mobile-first, touch
│   ├── app-escola.js         ← plugin raiz (protegido por login)
│   ├── app-resumos.js        ← plugin (REFERÊNCIA: dados relacionais via db)
│   ├── app-trabalhos.js      ← plugin (REFERÊNCIA: dados simples via db)
│   ├── app-calendario.js     ← plugin (agenda + link cruzado entre apps)
│   ├── vendor/supabase.js    ← lib do Supabase vendorada (funciona offline/APK)
│   └── assets/ espanhol/ portugues/
├── db/
│   ├── schema.sql            ← tabelas + RLS (rodar no SQL Editor do Supabase)
│   └── seed.sql              ← dados iniciais (rodar depois do schema)
├── capacitor.config.json     ← webDir = "www"
├── netlify.toml              ← publish = "www"
├── package.json              ← dependências do Capacitor (build Android)
└── guide.md
```

Regra de ouro: **só entra em `www/` o que o navegador carrega.** SQL, configs e
docs ficam na raiz, fora do deploy e do APK.

---

## 2. Como rodar localmente

O app usa `fetch`/IndexedDB/Supabase, então **não** abra o `index.html` por
`file://`. Use um servidor estático apontando para `www/`:

```bash
npx serve www
# ou qualquer servidor estático na pasta www/
```

Sem chaves do Supabase preenchidas, o app funciona **100% offline** (cache local
+ dados-semente dos plugins) e o login da Escola cai no modo de senha local.

---

## 3. O Core (`core.js`) — o que ele oferece

O Core **não conhece nenhum app específico**. Ele só fornece:

- **Registro dinâmico:** `KickHub.registerApp(config)`.
- **Roteamento:** `KickHub.navigate(idOuCaminho, params)`, `back()`, `home()`.
  Apps com `parent` formam uma árvore; um app "hub" (com filhos e sem `mount`)
  mostra automaticamente a grade dos filhos.
- **UI base:** header, footer, **modal genérico com blur** e **cadeado genérico**.
- **Estado/persistência:** `KickHub.store` e `KickHub.storage` (local/session).
- **Dados:** `KickHub.db` (ver seção 6). **Auth:** `KickHub.auth` (ver seção 7).
- **Ciclo de vida sem vazamentos:** tudo que o app registra via `ctx` é
  limpo automaticamente quando ele é desmontado.

### O objeto `ctx` (entregue ao `mount(host, ctx)`)

| Membro | Para que serve |
|---|---|
| `ctx.params` | Parâmetros da navegação (ex.: `{ subjectId }`). |
| `ctx.db` | Acesso a dados offline-first (seção 6). `null` se `db.js` não carregou. |
| `ctx.auth` | Estado de autenticação (seção 7). |
| `ctx.on(el, tipo, fn)` | Listener que se **auto-remove** no unmount (sem leaks). |
| `ctx.cleanup(fn)` | Registra limpeza (timers, observers...). |
| `ctx.navigate / back / home` | Navegação. |
| `ctx.setBreadcrumb(sufixo)` | Acrescenta um trecho ao breadcrumb (nav interna). |
| `ctx.onBack(fn)` | Intercepta o "voltar" (retorne `true` se tratou internamente). |
| `ctx.addFooterAction({icon,label,onActivate})` | Botão no footer enquanto o app está ativo. |
| `ctx.ui` | `card()`, `modal()`, `el()`, `icons` (UI reutilizável). |

---

## 4. Anatomia de um plugin (o padrão a seguir SEMPRE)

Todo `app-*.js` é um IIFE com **três camadas**, nesta ordem:

```js
(function () {
  "use strict";
  if (!window.KickHub) return;          // sem Core, o plugin não ativa
  var el = KickHub.ui.el;

  /* 1) DADOS / REGRA — sem DOM. É o "seed" offline do app. */
  var ITENS = [ /* ... */ ];
  if (KickHub.db) KickHub.db.seed("minha_colecao", ITENS);

  /* 2) VIEW — recebe (host, ctx) e só desenha. */
  function render(host, ctx) {
    var dados = ITENS;
    draw();
    // offline-first: cache/seed instantâneo + revalida na nuvem
    (ctx.db ? ctx.db.collection("minha_colecao").list()
            : Promise.resolve(ITENS)).then(function (d) { dados = d; draw(); });

    function draw() {
      var row = el("div", { class: "kh-card-row" });
      dados.forEach(function (item) {
        row.appendChild(KickHub.ui.card(item, function () { /* ação */ }));
      });
      host.replaceChildren(el("div", { class: "kh-view--menu" }, row));
    }
  }

  /* 3) REGISTRO — único ponto de acoplamento ao Core. */
  KickHub.registerApp({
    id: "meu-app",
    parent: "escola",          // ou null para aparecer direto na home
    title: "Meu App",
    subtitle: "Descrição curta",
    theme: "blue",             // red|blue|green|yellow|violet|dark|white
    order: 40,
    icon: '<svg viewBox="0 0 64 64">...</svg>',  // o ícone pertence AO APP
    mount: render
  });
})();
```

Por fim, **plugue no Core** adicionando uma linha no `www/index.html`:

```html
<script src="app-meu-app.js"></script>
```

Se você apagar o arquivo (ou remover o `<script>`), o app some do hub e **nada
quebra** — o Core descobre tudo pelo registro.

### Campos de `registerApp(config)`

| Campo | Descrição |
|---|---|
| `id` | Único, sem espaço/acento. |
| `parent` | `id` do app pai, ou `null` (raiz, aparece na home). |
| `title`, `subtitle`, `theme`, `order` | Aparência/ordem do card. |
| `icon` | SVG (string) ou `function(item)` — **vem do app**, não do Core. |
| `mount(host, ctx)` | Renderiza dentro de `host`. Omita em apps "hub". |
| `unmount()` | Limpeza extra (opcional; listeners de `ctx.on` já são limpos). |
| `locked`, `authRequired`, `password` | Proteção (seção 7). |

---

## 5. Referências vivas: Resumos e Trabalhos

- **`app-trabalhos.js` — o caso simples.** Uma coleção (`works`), uma tela de
  cards. Mostra o padrão mínimo: `seed` + `collection("works").list()` com
  fallback offline, e ação que abre páginas externas. **Comece por ele** ao criar
  um app de listagem.

- **`app-resumos.js` — o caso relacional + navegação interna.** Mostra:
  - **Duas coleções** (`subjects` + `modules`) recompostas no cliente (a nuvem é
    relacional; o app monta a árvore aninhada na leitura).
  - **Navegação interna** (picker → matéria) com `ctx.onBack()` retornando `true`
    e `ctx.setBreadcrumb(subject.title)`.
  - **Seed achatado em snake_case** (`subject_id`, `key_points`...) batendo com as
    colunas do Postgres. Use-o como molde quando o dado tiver relações.

- **`app-calendario.js` — link cruzado entre apps.** O botão "Ir para Resumo"
  chama `ctx.navigate("resumos", { subjectId })`. Apps se conversam **por id**,
  sem um conhecer o código do outro.

---

## 6. Persistência offline-first (`KickHub.db`)

O plugin **nunca** fala com o Supabase direto. Fala com `ctx.db`, que decide a
origem dos dados:

1. responde já com o **cache local** (IndexedDB);
2. se vazio, usa o **seed** registrado pelo plugin (funciona sem rede);
3. **revalida na nuvem** em segundo plano (quando logado + online);
4. escritas são **otimistas** (grava local na hora) e entram numa **outbox**
   drenada quando há conexão.

### API

```js
var repo = KickHub.db.collection("nome");
repo.list({ includeDeleted: false });  // Promise<array>  (cache-first)
repo.get(id);                          // Promise<registro|null>
repo.upsert(registro);                 // grava local + enfileira p/ nuvem
repo.remove(id);                       // soft-delete (tombstone)
repo.subscribe(cb);                    // notifica em mudanças

KickHub.db.seed("nome", registros);    // seed offline (chame no topo do plugin)
KickHub.db.sync(["nome"]);             // força revalidação
KickHub.db.isConfigured();             // há chaves do Supabase?
KickHub.db.isCloud();                  // configurado E online?
```

### Mapeando dados do plugin ↔ tabela do Supabase

- Registros são **achatados** e usam **snake_case** (mesmos nomes das colunas).
- O `db` cuida de `updated_at`/`deleted_at` (merge "last-write-wins").
- Todo registro precisa de **`id` estável**. Para dados sem id natural (ex.:
  eventos), gere um id determinístico **igual ao do `seed.sql`**
  (ex.: `evt-2026-06-24-1`) para o merge cache↔nuvem casar.

### Dado novo na nuvem? Faça os 3 passos juntos

1. **`db/schema.sql`** — crie a tabela com `updated_at`, `deleted_at` e **RLS**
   habilitado (copie o bloco de uma tabela existente).
2. **`db/seed.sql`** — popular com `insert ... on conflict (id) do update`
   (idempotente).
3. **No plugin** — `KickHub.db.seed("sua_tabela", SEED)` e leia via
   `ctx.db.collection("sua_tabela")`.

> O `kickhub.config.js` tem um mapa `tables` — só mexa se o nome da coleção no
> código for diferente do nome da tabela no banco.

---

## 7. Proteção: login real + cadeado genérico

O Core trata proteção de forma **genérica** — não sabe que existe "Escola".
Um app declara no registro:

```js
locked: true,            // exige desbloqueio para entrar (e nos filhos)
authRequired: true,      // usa LOGIN real (Supabase) quando há chaves
password: "info2026"     // fallback local, usado só se o Supabase NÃO estiver configurado
```

- Com chaves configuradas → o gate abre o **login por e-mail/senha**
  (`KickHub.auth`), e "desbloqueado" = autenticado. O cadeado no footer faz
  **logout**.
- Sem chaves → cai no **modal de senha local** (`password`), para testes offline.

`KickHub.auth`: `isConfigured()`, `isAuthenticated()`, `getUser()`, `signIn`,
`signUp`, `signOut`, `onChange(cb)`.

Para colocar um app novo atrás do login, basta dar a ele `parent: "escola"`
(herda a proteção) — ou declarar `locked/authRequired` no próprio app.

---

## 8. Chaves do Supabase

Em `www/kickhub.config.js`:

```js
window.KICKHUB_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabaseAnonKey: "eyJ..."     // anon PÚBLICA (protegida por RLS). Nunca a service_role!
};
```

Onde achar: painel do Supabase → **Project Settings → API**. Para não versionar a
chave, crie `www/kickhub.config.local.js` (já no `.gitignore`) definindo
`window.KICKHUB_CONFIG_OVERRIDE = { ... }` e inclua o `<script>` dele após o config.

---

## 9. Deploy (Web) e empacotamento (Android)

**Netlify (CI/CD):** `netlify.toml` já define `publish = "www"` e sem build.
Conecte o repo no painel da Netlify; cada push na `main` publica, cada PR gera
preview.

**Android (Capacitor):** `capacitor.config.json` usa `webDir = "www"`, então o
`sync` empacota só a pasta web (APK enxuto, offline-first via bundle local).

```bash
npm install
npx cap add android
npx cap sync android      # a cada mudança no www/
npx cap open android      # build/run no Android Studio
```

O botão físico "voltar" do Android já está ligado ao roteamento do Core
(`core.js` → `setupNativeBridge`): fecha modal → `KickHub.back()` → sai do app.

---

## 10. Checklist para adicionar CONTEÚDO (IA ou humano)

Conteúdo de matéria/trabalho/evento agora vive em **dois lugares espelhados**: o
**seed** dentro do plugin (offline) e a **tabela** no Supabase (nuvem).

1. Identifique a coleção (`subjects`/`modules`/`works`/`calendar_events` ou uma
   nova — seção 6).
2. Acrescente os itens ao **seed** no plugin correspondente, mantendo o formato
   (snake_case, `id` único, sem acento no id).
3. Acrescente os mesmos itens ao **`db/seed.sql`** (e a tabela ao `schema.sql` se
   for nova) e rode no SQL Editor.
4. Teste por um servidor estático (`npx serve www`): destrave a Escola, confira a
   ferramenta e a navegação. Console deve ficar **limpo**.

---

## 11. Resumo mental

- **Core** = sistema operacional agnóstico. Não cite apps nele.
- **Plugin** = 1 arquivo, 3 camadas (dados → view → registro), deletável.
- **Dados** = sempre por `ctx.db` (seed offline + Supabase). Nunca leia rede direto.
- **Proteção** = declarativa (`locked`/`authRequired`/`password`).
- **www/** = web. **raiz** = infra/config. Não misture.
