/* =====================================================================
   Kick Hub — Autenticação (auth.js)  →  KickHub.auth
   ---------------------------------------------------------------------
   Login REAL por e-mail + senha via Supabase Auth. Substitui a senha
   mockada no front. O Core consome esta API genericamente no gate
   `locked` (um app com authRequired:true exige login de verdade).

   Quando o Supabase NÃO está configurado (sem chaves), isConfigured()
   retorna false e o Core cai no fallback de senha local — assim dá para
   testar o app offline antes de criar o projeto na nuvem.

   Carrega DEPOIS de db.js (reaproveita KickHub.supabase).
   ===================================================================== */
(function () {
  "use strict";
  if (!window.KickHub) return;

  var client = KickHub.supabase || null;
  var session = null;
  var listeners = [];
  var ready;

  function emit() {
    listeners.forEach(function (cb) { try { cb(KickHub.auth.getUser()); } catch (e) {} });
  }

  if (client) {
    // restaura a sessão persistida (não precisa de rede se o token é válido)
    ready = client.auth.getSession().then(function (res) {
      session = (res && res.data && res.data.session) || null;
    }).catch(function () { session = null; });

    client.auth.onAuthStateChange(function (_event, newSession) {
      session = newSession || null;
      emit();
    });
  } else {
    ready = Promise.resolve();
  }

  KickHub.auth = {
    isConfigured: function () { return !!client; },
    isAuthenticated: function () { return !!session; },
    getUser: function () { return session ? session.user : null; },
    ready: function () { return ready; },

    /* entra com e-mail + senha; resolve { ok, error } */
    signIn: function (email, password) {
      if (!client) return Promise.resolve({ ok: false, error: "Supabase não configurado." });
      return client.auth.signInWithPassword({ email: email, password: password })
        .then(function (res) {
          if (res.error) return { ok: false, error: traduzir(res.error.message) };
          session = res.data.session;
          return { ok: true };
        });
    },

    /* cria conta (pode exigir confirmação de e-mail, conforme o painel) */
    signUp: function (email, password) {
      if (!client) return Promise.resolve({ ok: false, error: "Supabase não configurado." });
      return client.auth.signUp({ email: email, password: password })
        .then(function (res) {
          if (res.error) return { ok: false, error: traduzir(res.error.message) };
          var needsConfirm = res.data && res.data.user && !res.data.session;
          return { ok: true, needsConfirm: needsConfirm };
        });
    },

    /* entra com TELEFONE + senha (requer provedor de SMS no painel). */
    signInPhone: function (phone, password) {
      if (!client) return Promise.resolve({ ok: false, error: "Supabase não configurado." });
      return client.auth.signInWithPassword({ phone: phone, password: password })
        .then(function (res) {
          if (res.error) return { ok: false, error: traduzir(res.error.message) };
          session = res.data.session;
          return { ok: true };
        });
    },

    /* cria conta por TELEFONE (pode exigir confirmação por SMS). */
    signUpPhone: function (phone, password) {
      if (!client) return Promise.resolve({ ok: false, error: "Supabase não configurado." });
      return client.auth.signUp({ phone: phone, password: password })
        .then(function (res) {
          if (res.error) return { ok: false, error: traduzir(res.error.message) };
          var needsConfirm = res.data && res.data.user && !res.data.session;
          return { ok: true, needsConfirm: needsConfirm };
        });
    },

    /* entra/cadastra com Google (OAuth — redireciona e volta logado). */
    signInWithGoogle: function () {
      if (!client) return Promise.resolve({ ok: false, error: "Supabase não configurado." });
      return client.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname }
      }).then(function (res) {
        if (res.error) return { ok: false, error: traduzir(res.error.message) };
        return { ok: true, redirecting: true };
      });
    },

    /* vincula uma conta Google ao usuário já logado. */
    linkGoogle: function () {
      if (!client || !client.auth.linkIdentity) return Promise.resolve({ ok: false, error: "Recurso indisponível." });
      return client.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: window.location.origin + window.location.pathname }
      }).then(function (res) {
        if (res.error) return { ok: false, error: traduzir(res.error.message) };
        return { ok: true, redirecting: true };
      });
    },

    /* atualiza dados do usuário logado: { email | phone | password }. */
    updateUser: function (changes) {
      if (!client) return Promise.resolve({ ok: false, error: "Supabase não configurado." });
      return client.auth.updateUser(changes).then(function (res) {
        if (res.error) return { ok: false, error: traduzir(res.error.message) };
        return { ok: true };
      });
    },

    signOut: function () {
      if (!client) { session = null; emit(); return Promise.resolve(); }
      return client.auth.signOut().then(function () { session = null; });
    },

    onChange: function (cb) {
      listeners.push(cb);
      return function () { listeners = listeners.filter(function (f) { return f !== cb; }); };
    }
  };

  // Mensagens de erro mais amigáveis (PT-BR) para os casos comuns.
  function traduzir(msg) {
    msg = String(msg || "");
    if (/Invalid login credentials/i.test(msg)) return "E-mail ou senha incorretos.";
    if (/Email not confirmed/i.test(msg)) return "Confirme seu e-mail antes de entrar.";
    if (/already registered/i.test(msg)) return "Este e-mail já tem conta. Faça login.";
    if (/Password should be at least/i.test(msg)) return "A senha é curta demais (mín. 6).";
    if (/rate limit/i.test(msg)) return "Muitas tentativas. Aguarde um momento.";
    if (/provider is not enabled|not enabled/i.test(msg)) return "Este método não está habilitado no painel do Supabase.";
    if (/sms|phone/i.test(msg)) return "Falha no telefone — verifique o número e o provedor de SMS no Supabase.";
    return msg;
  }
})();
