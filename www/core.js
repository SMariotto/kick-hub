/* =====================================================================
   Kick Hub — Core (core.js)
   ---------------------------------------------------------------------
   O "sistema operacional" do Kick Hub. É deliberadamente AGNÓSTICO:
   não conhece nenhum app concreto (Escola, Resumos, etc.). Ele só
   fornece APIs e o contêiner central onde os plugins se renderizam.

   Responsabilidades:
     1. Registro dinâmico de apps        -> KickHub.registerApp(config)
     2. Roteamento e navegação           -> navigate / back / home
     3. Estado global + persistência      -> KickHub.store / KickHub.storage
     4. UI base (header, footer, modal, blur de fundo, cadeado genérico)
     5. Ciclo de vida sem vazamentos      -> ctx.on / ctx.cleanup

   Carregado como script clássico (sem ES modules) para funcionar
   inclusive sob file:// sem build nem dependências externas.
   ===================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------- *
   * Util: criação de DOM enxuta (mantém a camada de UI declarativa)   *
   * ----------------------------------------------------------------- */
  function el(tag, props, children) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        var value = props[key];
        if (key === "class") node.className = value;
        else if (key === "html") node.innerHTML = value;
        else if (key === "text") node.textContent = value;
        else if (key === "dataset") {
          Object.keys(value).forEach(function (d) { node.dataset[d] = value[d]; });
        } else if (key.slice(0, 2) === "on" && typeof value === "function") {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (value !== null && value !== undefined && value !== false) {
          node.setAttribute(key, value === true ? "" : value);
        }
      });
    }
    appendChildren(node, children);
    return node;
  }

  function appendChildren(node, children) {
    if (children === null || children === undefined) return;
    if (Array.isArray(children)) {
      children.forEach(function (child) { appendChildren(node, child); });
    } else if (children instanceof Node) {
      node.appendChild(children);
    } else {
      node.appendChild(document.createTextNode(String(children)));
    }
  }

  /* SVGs de UI genérica do PRÓPRIO Core (nada de ícones de apps aqui). */
  var ICONS = {
    home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8M5 10v10h14V10"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    gear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    appDefault: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M18 18h28v28H18z"/><path d="M32 14v36M14 32h36"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg>',
    battery: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="6" width="18" height="12" rx="2"/><line x1="23" y1="10" x2="23" y2="14"/></svg>'
  };

  /* ----------------------------------------------------------------- *
   * Estado global (KickHub.store) — get/set/subscribe em memória.     *
   * ----------------------------------------------------------------- */
  function createStore() {
    var state = {};
    var subs = [];
    return {
      get: function (key) { return state[key]; },
      set: function (key, value) {
        state[key] = value;
        subs.forEach(function (fn) { try { fn(key, value, state); } catch (e) {} });
      },
      subscribe: function (fn) {
        subs.push(fn);
        return function () { subs = subs.filter(function (s) { return s !== fn; }); };
      }
    };
  }

  /* Persistência tolerante a falhas (modo privado / file:// restrito). */
  function safeStorage(backing) {
    return {
      get: function (key, fallback) {
        try { var v = backing.getItem(key); return v === null ? fallback : v; }
        catch (e) { return fallback; }
      },
      set: function (key, value) { try { backing.setItem(key, value); } catch (e) {} },
      remove: function (key) { try { backing.removeItem(key); } catch (e) {} }
    };
  }

  /* ----------------------------------------------------------------- *
   * Registro de apps + montagem da árvore (parent => filhos).         *
   * ----------------------------------------------------------------- */
  var registry = {};        // id -> config
  var order = [];           // ordem de registro (desempate estável)

  function registerApp(config) {
    if (!config || !config.id) {
      console.warn("[KickHub] registerApp ignorado: faltou 'id'.", config);
      return;
    }
    if (registry[config.id]) {
      console.warn("[KickHub] app duplicado ignorado:", config.id);
      return;
    }
    registry[config.id] = config;
    order.push(config.id);
    if (booted) scheduleHomeRefresh();
  }

  function childrenOf(parentId) {
    return order
      .map(function (id) { return registry[id]; })
      .filter(function (app) { return (app.parent || null) === (parentId || null); })
      .sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }

  function buildPath(appId) {
    var path = [];
    var cursor = registry[appId];
    var guard = 0;
    while (cursor && guard++ < 50) {
      path.unshift(cursor.id);
      cursor = cursor.parent ? registry[cursor.parent] : null;
    }
    return path;
  }

  /* ----------------------------------------------------------------- *
   * Cadeado genérico: qualquer app pode declarar locked + password.   *
   * O Core gerencia sem saber QUAL app está protegido.                *
   * ----------------------------------------------------------------- */
  var session = safeStorage(window.sessionStorage);

  function unlockKey(appId) { return "kickhub.unlock." + appId; }

  /* Um app pode exigir AUTENTICAÇÃO real (authRequired) ou apenas uma
     senha local (password). Quando há provedor de auth configurado, ele
     manda; caso contrário, cai no flag de sessão local (fallback). */
  function usesAuth(app) {
    return !!(app.authRequired && KickHub.auth && KickHub.auth.isConfigured());
  }
  function isUnlocked(app) {
    if (usesAuth(app)) return KickHub.auth.isAuthenticated();
    return session.get(unlockKey(app.id)) === "true";
  }
  function setUnlocked(app, value) {
    if (value) session.set(unlockKey(app.id), "true");
    else session.remove(unlockKey(app.id));
  }

  /* Acha o app bloqueado mais raso ainda trancado no caminho. */
  function firstLockedInPath(path) {
    for (var i = 0; i < path.length; i++) {
      var app = registry[path[i]];
      if (app && app.locked && !isUnlocked(app)) return app;
    }
    return null;
  }

  /* ----------------------------------------------------------------- *
   * Ciclo de vida do app ativo (cleanup automático => sem vazamentos) *
   * ----------------------------------------------------------------- */
  var active = null; // { app, ctx, cleanups: [], footerEls: [], backHandler }

  function teardownActive() {
    if (!active) return;
    // remove listeners/timers registrados via ctx
    active.cleanups.forEach(function (fn) { try { fn(); } catch (e) {} });
    // remove botões de footer contribuídos pelo app
    active.footerEls.forEach(function (node) {
      if (node && node.parentNode) node.parentNode.removeChild(node);
    });
    // hook de limpeza próprio do app
    if (active.app && typeof active.app.unmount === "function") {
      try { active.app.unmount(); } catch (e) { console.error("[KickHub] erro no unmount:", e); }
    }
    active = null;
  }

  function makeContext(app, params) {
    var cleanups = [];
    var footerEls = [];
    var ctx = {
      app: app,
      params: params || {},
      /* listener que se auto-remove no unmount (previne memory leaks) */
      on: function (target, type, handler, options) {
        target.addEventListener(type, handler, options);
        cleanups.push(function () { target.removeEventListener(type, handler, options); });
        return ctx;
      },
      /* registra qualquer função de limpeza (timers, observers, etc.) */
      cleanup: function (fn) { if (typeof fn === "function") cleanups.push(fn); return ctx; },
      navigate: function (idOrPath, p) { KickHub.navigate(idOrPath, p); },
      back: function () { KickHub.back(); },
      home: function () { KickHub.home(); },
      /* breadcrumb extra para a navegação INTERNA do app */
      setBreadcrumb: function (suffix) { renderBreadcrumb(suffix); },
      /* intercepta o botão Voltar global (retorne true se tratou) */
      onBack: function (handler) { if (active) active.backHandler = handler; },
      /* contribui um botão no footer enquanto o app está ativo */
      addFooterAction: function (opts) {
        var btn = buildFooterButton(opts);
        footerRefs.actions.appendChild(btn);
        footerEls.push(btn);
        return function () {
          if (btn.parentNode) btn.parentNode.removeChild(btn);
          footerEls = footerEls.filter(function (n) { return n !== btn; });
        };
      },
      ui: KickHub.ui,
      store: KickHub.store,
      storage: KickHub.storage,
      /* acesso aos dados (offline-first) — anexado por db.js, se carregado */
      db: KickHub.db || null,
      auth: KickHub.auth || null
    };
    // referência interna para teardown
    pendingCleanups = cleanups;
    pendingFooterEls = footerEls;
    return ctx;
  }

  var pendingCleanups = [];
  var pendingFooterEls = [];

  /* ----------------------------------------------------------------- *
   * Roteamento. Rota = array de ids do root até o app atual + params. *
   * ----------------------------------------------------------------- */
  var routePath = [];   // ex: ["escola","resumos"]
  var routeParams = {};

  function navigate(idOrPath, params) {
    var path;
    if (Array.isArray(idOrPath)) path = idOrPath.slice();
    else if (typeof idOrPath === "string" && idOrPath.indexOf("/") !== -1) path = idOrPath.split("/");
    else path = buildPath(idOrPath);

    if (!path.length || !registry[path[path.length - 1]]) {
      console.warn("[KickHub] navigate para destino inexistente:", idOrPath);
      return;
    }

    // Cadeado: se há um ancestral trancado, pede a senha antes de entrar.
    var locked = firstLockedInPath(path);
    if (locked) {
      requestUnlock(locked).then(function (ok) {
        if (ok) navigate(path, params);
      });
      return;
    }

    routePath = path;
    routeParams = params || {};
    renderRoute();
  }

  function back() {
    // 1) o app ativo tem prioridade para tratar o "voltar" internamente
    if (active && typeof active.backHandler === "function") {
      var handled = active.backHandler();
      if (handled) return;
    }
    // 2) caso contrário, sobe um nível na árvore
    if (routePath.length > 0) {
      routePath = routePath.slice(0, -1);
      routeParams = {};
      renderRoute();
    }
  }

  function home() {
    routePath = [];
    routeParams = {};
    renderRoute();
  }

  function currentApp() {
    return routePath.length ? registry[routePath[routePath.length - 1]] : null;
  }

  /* ----------------------------------------------------------------- *
   * Renderização da rota atual no contêiner central (#kh-app).        *
   * ----------------------------------------------------------------- */
  function renderRoute() {
    teardownActive();
    appRoot.scrollTop = 0;

    var app = currentApp();

    // Home: grade dos apps raiz.
    if (!app) {
      renderBreadcrumb();
      renderAppGrid(childrenOf(null), false);
      syncFooterLock();
      return;
    }

    renderBreadcrumb();

    // App "hub" (tem filhos e não define mount próprio): grade dos filhos.
    var kids = childrenOf(app.id);
    if (kids.length && typeof app.mount !== "function") {
      renderAppGrid(kids, true);
      syncFooterLock();
      return;
    }

    // App folha: monta dentro do host, isolado e com cleanup automático.
    var host = el("section", { class: "kh-view" });
    appRoot.replaceChildren(host);
    var ctx = makeContext(app, routeParams);
    active = { app: app, ctx: ctx, cleanups: pendingCleanups, footerEls: pendingFooterEls, backHandler: null };

    if (typeof app.mount === "function") {
      try {
        app.mount(host, ctx);
      } catch (e) {
        console.error("[KickHub] erro ao montar '" + app.id + "':", e);
        host.replaceChildren(renderErrorCard(app, e));
      }
    } else {
      // app sem filhos e sem mount: placeholder amigável
      host.replaceChildren(el("p", { class: "kh-empty", text: "Este app não tem conteúdo." }));
    }
    syncFooterLock();
  }

  function renderErrorCard(app, error) {
    return el("div", { class: "kh-empty" }, [
      el("strong", { text: "Não foi possível abrir “" + (app.title || app.id) + "”." }),
      el("span", { text: String(error && error.message ? error.message : error) })
    ]);
  }

  function renderAppGrid(apps, featured) {
    var view = el("section", { class: "kh-view kh-view--menu" });
    var row = el("div", { class: "kh-card-row" + (featured ? " kh-card-row--featured" : "") });
    apps.forEach(function (app) {
      row.appendChild(KickHub.ui.card(app, function () { navigate(app.id); }));
    });
    view.appendChild(row);
    appRoot.replaceChildren(view);
  }

  /* ----------------------------------------------------------------- *
   * UI base: header e footer.                                         *
   * ----------------------------------------------------------------- */
  var appRoot, topbarRefs = {}, footerRefs = {};

  function buildChrome() {
    /* ---- Header ---- */
    var topbar = document.getElementById("kh-topbar");
    topbarRefs.home = el("button", {
      class: "kh-profile", type: "button", "aria-label": "Voltar ao início",
      onClick: home
    }, el("img", { class: "kh-profile__img", id: "kh-profile-img", alt: "Perfil",
      onError: function () { this.style.visibility = "hidden"; } }));

    topbarRefs.back = el("button", {
      class: "kh-chip", type: "button", hidden: true, onClick: back
    }, [el("span", { class: "kh-chip__icon", html: ICONS.back }), "Voltar"]);
    topbarRefs.crumb = el("span", { class: "kh-topbar__crumb", id: "kh-breadcrumb", text: "Kick Hub" });

    topbarRefs.clock = el("span", { class: "kh-clock", text: "00:00" });

    topbar.replaceChildren(
      topbarRefs.home,
      el("div", { class: "kh-topbar__center" }, [topbarRefs.back, topbarRefs.crumb]),
      el("div", { class: "kh-topbar__right" }, [
        topbarRefs.clock,
        el("span", { class: "kh-topbar__icon", html: ICONS.wifi }),
        el("span", { class: "kh-topbar__icon", html: ICONS.battery })
      ])
    );

    /* ---- Footer ---- */
    var footer = document.getElementById("kh-footer");
    footerRefs.actions = el("div", { class: "kh-footer__actions" });

    // Cadeado genérico (re-bloqueia o subtree trancado atual).
    footerRefs.lock = buildFooterButton({
      icon: ICONS.lock, label: "Bloquear",
      onActivate: relockCurrent
    });
    footerRefs.lock.hidden = true;

    // Configurações: UI base do Core (tema + foto de perfil).
    footerRefs.settings = buildFooterButton({
      icon: ICONS.gear, label: "Configurações",
      onActivate: openSettings
    });

    footer.replaceChildren(footerRefs.actions, footerRefs.settings, footerRefs.lock);
  }

  function buildFooterButton(opts) {
    return el("button", {
      class: "kh-fab", type: "button", "aria-label": opts.label || "",
      title: opts.label || "", onClick: opts.onActivate
    }, el("span", { class: "kh-fab__icon", html: opts.icon || ICONS.appDefault }));
  }

  function renderBreadcrumb(suffix) {
    var titles = routePath.map(function (id) {
      return registry[id] ? registry[id].title : id;
    });
    var base = ["Kick Hub"].concat(titles);
    var text = base.join(" / ");
    if (suffix) text += " / " + suffix;
    topbarRefs.crumb.textContent = text;
    topbarRefs.back.hidden = routePath.length === 0;
  }

  /* Mostra/esconde o cadeado conforme o subtree atual esteja trancável. */
  function syncFooterLock() {
    var unlockable = null;
    routePath.forEach(function (id) {
      var app = registry[id];
      if (app && app.locked && isUnlocked(app)) unlockable = app;
    });
    footerRefs.lock.hidden = !unlockable;
    footerRefs.lock._target = unlockable;
  }

  function relockCurrent() {
    var target = footerRefs.lock._target;
    if (!target) return;
    // App com login real: re-bloquear = SAIR da conta (signOut).
    if (usesAuth(target)) {
      KickHub.auth.signOut().then(home);
      return;
    }
    setUnlocked(target, false);
    home();
  }

  /* ----------------------------------------------------------------- *
   * Sistema de modais genérico (overlay + blur de fundo) + pilha.     *
   * ----------------------------------------------------------------- */
  var modalRoot, modalStack = [];

  function openModal(options) {
    options = options || {};
    var overlay = el("div", { class: "kh-modal-overlay" + (options.overlayClass ? " " + options.overlayClass : "") });
    var dialog = el("div", {
      class: "kh-modal " + (options.className || ""),
      role: "dialog", "aria-modal": "true"
    });

    var handle = {
      el: dialog, overlay: overlay,
      close: function () { closeModal(handle); }
    };

    if (options.closable !== false) {
      dialog.appendChild(el("button", {
        class: "kh-modal__close", type: "button", "aria-label": "Fechar",
        html: ICONS.close, onClick: handle.close
      }));
    }

    var body = el("div", { class: "kh-modal__body" });
    if (typeof options.render === "function") options.render(body, handle);
    else if (options.html) body.innerHTML = options.html;
    dialog.appendChild(body);

    overlay.appendChild(dialog);
    overlay.addEventListener("click", function (ev) {
      if (ev.target === overlay && options.dismissable !== false) handle.close();
    });

    handle._onClose = options.onClose;
    modalRoot.appendChild(overlay);
    modalStack.push(handle);
    document.body.classList.add("kh-modal-open");
    // dispara a transição no próximo frame (entrada suave)
    requestAnimationFrame(function () { overlay.classList.add("is-active"); });
    return handle;
  }

  function closeModal(handle) {
    var idx = modalStack.indexOf(handle);
    if (idx === -1) return;
    modalStack.splice(idx, 1);
    handle.overlay.classList.remove("is-active");
    if (typeof handle._onClose === "function") { try { handle._onClose(); } catch (e) {} }
    window.setTimeout(function () {
      if (handle.overlay.parentNode) handle.overlay.parentNode.removeChild(handle.overlay);
    }, 280);
    if (!modalStack.length) document.body.classList.remove("kh-modal-open");
  }

  /* Gate genérico — devolve Promise<boolean>. Decide entre LOGIN real
     (Supabase) e SENHA local conforme o app e o ambiente. */
  function requestUnlock(app) {
    if (usesAuth(app)) return requestLogin(app);
    return requestPassword(app);
  }

  /* Gate por senha local (fallback / apps sem auth). */
  function requestPassword(app) {
    return new Promise(function (resolve) {
      var resolved = false;
      function done(value) { if (!resolved) { resolved = true; resolve(value); } }
      openModal({
        className: "kh-modal--glass kh-modal--center",
        onClose: function () { done(false); },
        render: function (body, handle) {
          var input = el("input", {
            class: "kh-input", type: "password", placeholder: "••••••••",
            autocomplete: "current-password", inputmode: "text"
          });
          var error = el("p", { class: "kh-input-error", text: "Senha incorreta. Tente novamente." });
          var form = el("form", { class: "kh-form", autocomplete: "off" }, [
            input, error,
            el("button", { class: "kh-btn kh-btn--primary", type: "submit", text: "Confirmar" })
          ]);
          form.addEventListener("submit", function (ev) {
            ev.preventDefault();
            if (input.value === app.password) {
              setUnlocked(app, true);
              done(true);
              handle.close();
            } else {
              error.classList.add("is-visible");
              input.value = "";
              input.focus();
            }
          });
          body.appendChild(el("div", { class: "kh-modal__icon", text: "🔒" }));
          body.appendChild(el("p", { class: "kh-eyebrow", text: "Acesso protegido" }));
          body.appendChild(el("h2", { class: "kh-modal__title", text: app.title || "Protegido" }));
          body.appendChild(el("p", { class: "kh-modal__hint", text: "Digite a senha para continuar" }));
          body.appendChild(form);
          window.setTimeout(function () { input.focus(); }, 180);
        }
      });
    });
  }

  /* Gate por LOGIN real (Supabase Auth): e-mail + senha, com opção de
     criar conta. O Core não conhece o provedor — fala com KickHub.auth. */
  function requestLogin(app) {
    return new Promise(function (resolve) {
      var resolved = false;
      function done(value) { if (!resolved) { resolved = true; resolve(value); } }
      var mode = "in"; // "in" = entrar | "up" = criar conta

      openModal({
        className: "kh-modal--glass kh-modal--center",
        onClose: function () { done(KickHub.auth.isAuthenticated()); },
        render: function (body, handle) {
          var email = el("input", { class: "kh-input", type: "email", placeholder: "seu@email.com", autocomplete: "username", inputmode: "email" });
          var pass = el("input", { class: "kh-input", type: "password", placeholder: "••••••••", autocomplete: "current-password" });
          var error = el("p", { class: "kh-input-error" });
          var submit = el("button", { class: "kh-btn kh-btn--primary", type: "submit", text: "Entrar" });
          var toggle = el("button", { class: "kh-link-btn", type: "button", text: "Criar uma conta" });
          var hint = el("p", { class: "kh-modal__hint", text: "Entre com seu e-mail e senha" });

          function showError(msg) { error.textContent = msg; error.classList.add("is-visible"); }
          function clearError() { error.classList.remove("is-visible"); }
          function setMode(m) {
            mode = m;
            submit.textContent = m === "in" ? "Entrar" : "Criar conta";
            toggle.textContent = m === "in" ? "Criar uma conta" : "Já tenho conta";
            hint.textContent = m === "in" ? "Entre com seu e-mail e senha" : "Crie sua conta com e-mail e senha";
            clearError();
          }
          toggle.addEventListener("click", function () { setMode(mode === "in" ? "up" : "in"); });

          var form = el("form", { class: "kh-form", autocomplete: "off" }, [email, pass, error, submit, toggle]);
          form.addEventListener("submit", function (ev) {
            ev.preventDefault();
            clearError();
            submit.disabled = true; submit.textContent = "Aguarde…";
            var op = mode === "in"
              ? KickHub.auth.signIn(email.value.trim(), pass.value)
              : KickHub.auth.signUp(email.value.trim(), pass.value);
            op.then(function (res) {
              submit.disabled = false;
              setMode(mode); // restaura label
              if (res.ok && res.needsConfirm) {
                showError("Conta criada! Confirme o e-mail e depois entre.");
                setMode("in");
              } else if (res.ok) {
                done(true);
                handle.close();
              } else {
                showError(res.error || "Não foi possível autenticar.");
                pass.value = ""; pass.focus();
              }
            }).catch(function () {
              submit.disabled = false; setMode(mode);
              showError("Erro de conexão. Verifique sua internet.");
            });
          });

          body.appendChild(el("div", { class: "kh-modal__icon", text: "🔐" }));
          body.appendChild(el("p", { class: "kh-eyebrow", text: "Acesso protegido" }));
          body.appendChild(el("h2", { class: "kh-modal__title", text: app.title || "Entrar" }));
          body.appendChild(hint);
          body.appendChild(form);
          window.setTimeout(function () { email.focus(); }, 180);
        }
      });
    });
  }

  /* ----------------------------------------------------------------- *
   * Card reutilizável estilo Switch (a UI base que os apps reaproveitam) *
   * ----------------------------------------------------------------- */
  function makeCard(item, onActivate, options) {
    options = options || {};
    var theme = item.theme || "white";
    var iconHtml = typeof item.icon === "function" ? item.icon(item) : (item.icon || ICONS.appDefault);
    var card = el("button", {
      class: "kh-card kh-card--" + theme, type: "button",
      "aria-label": "Abrir " + (item.title || ""),
      disabled: options.disabled || false
    }, [
      el("span", { class: "kh-card__art", html: iconHtml }),
      el("span", { class: "kh-card__label", text: item.title || "" }),
      el("span", { class: "kh-card__meta", text: item.subtitle || item.description || "" })
    ]);
    if (onActivate && !options.disabled) card.addEventListener("click", onActivate);
    return card;
  }

  /* ----------------------------------------------------------------- *
   * Configurações (UI base do Core): tema escuro + foto de perfil.    *
   * ----------------------------------------------------------------- */
  var local = safeStorage(window.localStorage);
  var PROFILE_OPTIONS = [
    "assets/pfp.png", "assets/pfp1.png", "assets/pfp2.png",
    "assets/pfp3.png", "assets/pfp4.png", "assets/pfp5.png"
  ];

  function applyTheme() {
    var dark = local.get("kickhub.darkMode") === "true";
    document.body.classList.toggle("kh-dark", dark);
  }

  function applyProfile() {
    var src = local.get("kickhub.profile", "assets/pfp.png");
    var img = document.getElementById("kh-profile-img");
    if (img) { img.style.visibility = ""; img.src = src; }
  }

  function openSettings() {
    openModal({
      className: "kh-modal--glass",
      render: function (body) {
        body.appendChild(el("h2", { class: "kh-modal__title", text: "Configurações" }));

        var dark = local.get("kickhub.darkMode") === "true";
        var toggle = el("button", {
          class: "kh-toggle", type: "button", "aria-pressed": String(dark),
          text: dark ? "On" : "Off"
        });
        toggle.addEventListener("click", function () {
          dark = !dark;
          local.set("kickhub.darkMode", String(dark));
          toggle.textContent = dark ? "On" : "Off";
          toggle.setAttribute("aria-pressed", String(dark));
          applyTheme();
        });

        var themeRow = el("div", { class: "kh-setting-row" }, [
          el("div", null, [
            el("strong", { text: "Modo escuro" }),
            el("span", { text: "Alterna a aparência do Kick Hub." })
          ]),
          toggle
        ]);

        var picker = el("div", { class: "kh-profile-picker" });
        var current = local.get("kickhub.profile", "assets/pfp.png");
        PROFILE_OPTIONS.forEach(function (src) {
          var opt = el("button", {
            class: "kh-profile-option" + (src === current ? " is-active" : ""),
            type: "button", "aria-label": "Usar " + src
          }, el("img", { src: src, alt: "", onError: function () { this.style.visibility = "hidden"; } }));
          opt.addEventListener("click", function () {
            local.set("kickhub.profile", src);
            applyProfile();
            picker.querySelectorAll(".kh-profile-option").forEach(function (b) {
              b.classList.toggle("is-active", b === opt);
            });
          });
          picker.appendChild(opt);
        });

        var profileSection = el("div", { class: "kh-setting-section" }, [
          el("strong", { text: "Foto de perfil" }),
          el("span", { text: "Coloque imagens com estes nomes dentro de assets." }),
          picker
        ]);

        body.appendChild(el("div", { class: "kh-setting-stack" }, [themeRow, profileSection]));
      }
    });
  }

  /* ----------------------------------------------------------------- *
   * Relógio (instância única; sem timers órfãos).                     *
   * ----------------------------------------------------------------- */
  var clockTimer = null;
  function startClock() {
    function tick() {
      var now = new Date();
      var h = String(now.getHours()).padStart(2, "0");
      var m = String(now.getMinutes()).padStart(2, "0");
      if (topbarRefs.clock) topbarRefs.clock.textContent = h + ":" + m;
    }
    tick();
    if (clockTimer) window.clearInterval(clockTimer);
    clockTimer = window.setInterval(tick, 10000);
  }

  /* ----------------------------------------------------------------- *
   * Boot.                                                             *
   * ----------------------------------------------------------------- */
  var booted = false;
  var homeRefreshQueued = false;

  function scheduleHomeRefresh() {
    if (homeRefreshQueued) return;
    homeRefreshQueued = true;
    requestAnimationFrame(function () {
      homeRefreshQueued = false;
      if (routePath.length === 0) renderRoute(); // mantém a home em dia
    });
  }

  /* ----------------------------------------------------------------- *
   * Ponte nativa (Capacitor) — botão físico "voltar" do Android.       *
   * Sem dependência de import: usa window.Capacitor injetado pela       *
   * WebView. No navegador comum, window.Capacitor não existe → no-op.   *
   * ----------------------------------------------------------------- */
  function setupNativeBridge() {
    var Cap = window.Capacitor;
    if (!Cap || !Cap.Plugins || !Cap.Plugins.App) return;
    var App = Cap.Plugins.App;
    App.addListener("backButton", function () {
      // 1) há modal aberto? fecha o do topo.
      if (modalStack.length) { closeModal(modalStack[modalStack.length - 1]); return; }
      // 2) dá para voltar (inclui o "voltar" interno do app ativo)? volta.
      if (routePath.length > 0 || (active && typeof active.backHandler === "function")) {
        back();
        return;
      }
      // 3) já na home: sai do app (comportamento nativo esperado).
      App.exitApp();
    });
  }

  function boot() {
    appRoot = document.getElementById("kh-app");
    modalRoot = document.getElementById("kh-modal-root");
    buildChrome();
    applyTheme();
    applyProfile();
    startClock();
    setupNativeBridge();
    booted = true;
    renderRoute();

    // Reage à restauração/expiração da sessão Supabase: se o usuário for
    // deslogado (token expira/signOut em outra aba), volta para a home.
    if (KickHub.auth && typeof KickHub.auth.onChange === "function") {
      KickHub.auth.onChange(function () {
        // Procura o app autenticado no caminho atual.
        var authApp = null;
        routePath.forEach(function (id) {
          var a = registry[id];
          if (a && a.authRequired) authApp = a;
        });
        if (authApp && !isUnlocked(authApp)) home(); // sessão caiu → sai
        else if (routePath.length === 0) renderRoute();
        else syncFooterLock();
      });
    }
  }

  // ESC fecha o modal do topo.
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape" && modalStack.length) {
      closeModal(modalStack[modalStack.length - 1]);
    }
  });

  /* ----------------------------------------------------------------- *
   * API pública.                                                      *
   * ----------------------------------------------------------------- */
  var KickHub = {
    registerApp: registerApp,
    navigate: navigate,
    back: back,
    home: home,
    store: createStore(),
    storage: { local: local, session: session },
    ui: {
      card: makeCard,
      modal: openModal,
      el: el,
      icons: ICONS
    },
    getApp: function (id) { return registry[id]; },
    isUnlocked: isUnlocked
  };

  window.KickHub = KickHub;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
