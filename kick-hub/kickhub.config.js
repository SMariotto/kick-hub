/* =====================================================================
   Kick Hub — Configuração de ambiente (kickhub.config.js)
   ---------------------------------------------------------------------
   👉 É AQUI QUE VOCÊ COLOCA AS CHAVES DO SUPABASE.

   Onde encontrar (painel do Supabase):
     Project Settings → API
       • Project URL   →  supabaseUrl
       • Project API keys → "anon public"  →  supabaseAnonKey

   IMPORTANTE:
   - A "anon key" é PÚBLICA por design (protegida pelas políticas RLS no
     banco). Pode ir para o front sem problema.
   - NUNCA coloque aqui a chave "service_role" (ela ignora o RLS).

   Se deixar os dois campos VAZIOS, o Kick Hub funciona 100% OFFLINE:
   usa o cache local (IndexedDB) + os dados-semente dos plugins, e o gate
   da "Escola" cai no modo de senha local (fallback). Assim você testa o
   app antes mesmo de criar o projeto no Supabase.
   ===================================================================== */
window.KICKHUB_CONFIG = {
  // Cole entre as aspas:
  supabaseUrl: "",        // ex: "https://abcdxyz.supabase.co"
  supabaseAnonKey: "",    // ex: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."

  // Tabelas no Postgres (não precisa mexer).
  tables: {
    subjects: "subjects",
    modules: "modules",
    works: "works",
    calendar_events: "calendar_events"
  }
};

/* -------------------------------------------------------------------
   OPCIONAL — chaves fora do Git:
   Se preferir NÃO versionar as chaves, crie um arquivo
   "kickhub.config.local.js" (já está no .gitignore), inclua o
   <script> dele logo após este no index.html, e defina:

     window.KICKHUB_CONFIG_OVERRIDE = {
       supabaseUrl: "https://...supabase.co",
       supabaseAnonKey: "eyJ..."
     };

   O override abaixo é aplicado automaticamente quando esse arquivo existe.
   ------------------------------------------------------------------- */
if (window.KICKHUB_CONFIG_OVERRIDE) {
  Object.assign(window.KICKHUB_CONFIG, window.KICKHUB_CONFIG_OVERRIDE);
}
