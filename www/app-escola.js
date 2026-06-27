/* =====================================================================
   Plugin: Escola (app-escola.js)
   ---------------------------------------------------------------------
   App RAIZ e protegido. Não tem "mount" próprio: por ser um hub (tem
   filhos — Trabalhos, Resumos, Calendário), o Core renderiza a grade
   dos filhos automaticamente.

   A proteção é 100% genérica do Core: basta declarar locked + password.
   Uma única senha destrava todo o subtree (Trabalhos, Resumos, etc.),
   exatamente como no comportamento original. O Core nunca sabe que este
   app se chama "Escola".
   ===================================================================== */
(function () {
  "use strict";
  if (!window.KickHub) return;

  KickHub.registerApp({
    id: "escola",
    parent: null,            // app de nível raiz (aparece na home)
    title: "Escola",
    subtitle: "Protegido por senha",
    theme: "red",
    order: 10,
    locked: true,
    // Gate de ENTRADA = passcode LOCAL (sem forçar login na nuvem aqui).
    // O login/conta Supabase fica no clique da foto de perfil (canto sup. esq.).
    password: "info2026",
    icon: '<svg viewBox="0 0 64 64"><path d="M11 28 32 16l21 12-21 12L11 28Z"/><path d="M18 34v10c6.8 5.1 21.2 5.1 28 0V34"/><path d="M52 30v13"/></svg>'
    // sem mount: o Core mostra a grade dos filhos (hub).
  });
})();
