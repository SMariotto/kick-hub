/* =====================================================================
   Kick Hub — Camada de dados (db.js)  →  KickHub.db
   ---------------------------------------------------------------------
   Abstração de persistência OFFLINE-FIRST e AGNÓSTICA. Os plugins falam
   só com KickHub.db (via ctx.db) e NUNCA com o Supabase diretamente —
   exatamente como o Core não conhece nenhum app.

   Fluxo de leitura (stale-while-revalidate):
     1) responde JÁ com o cache local (IndexedDB)
     2) se vazio, usa o SEED empacotado pelo plugin (funciona sem rede)
     3) revalida na nuvem em segundo plano (quando logado + online)

   Fluxo de escrita (otimista + fila):
     - grava no cache na hora  →  enfileira na OUTBOX  →  drena quando
       houver conexão (e usuário autenticado).

   Carrega DEPOIS de: vendor/supabase.js, kickhub.config.js, core.js.
   ===================================================================== */
(function () {
  "use strict";
  if (!window.KickHub) return;

  var cfg = window.KICKHUB_CONFIG || {};
  var SEED_TS = "1970-01-01T00:00:00.000Z"; // semente é sempre a versão "mais antiga"

  /* ----------------------------------------------------------------- *
   * Cliente Supabase (compartilhado com auth.js via KickHub.supabase) *
   * ----------------------------------------------------------------- */
  var configured = !!(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  var client = null;
  if (configured) {
    try {
      client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      });
    } catch (e) {
      console.error("[KickHub.db] Falha ao criar cliente Supabase:", e);
      configured = false;
    }
  }
  KickHub.supabase = client;
  function tableOf(name) { return (cfg.tables && cfg.tables[name]) || name; }
  function online() { return typeof navigator === "undefined" || navigator.onLine !== false; }
  function cloudReady() { return !!client && online(); }

  /* ----------------------------------------------------------------- *
   * IndexedDB mínimo (sem dependência externa; funciona no APK).      *
   * Stores: "kv" (cache por coleção) e "outbox" (fila de escrita).    *
   * ----------------------------------------------------------------- */
  var DB_NAME = "kickhub", DB_VERSION = 1, dbPromise = null;
  function idb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("IndexedDB indisponível")); return; }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function () {
        var d = req.result;
        if (!d.objectStoreNames.contains("kv")) d.createObjectStore("kv");
        if (!d.objectStoreNames.contains("outbox")) d.createObjectStore("outbox", { keyPath: "opId" });
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
    return dbPromise;
  }
  function tx(store, mode, fn) {
    return idb().then(function (d) {
      return new Promise(function (resolve, reject) {
        var t = d.transaction(store, mode);
        var s = t.objectStore(store);
        var out = fn(s);
        t.oncomplete = function () { resolve(out && out.result !== undefined ? out.result : out); };
        t.onerror = function () { reject(t.error); };
        t.onabort = function () { reject(t.error); };
      });
    });
  }
  var idbGet = function (store, key) { return tx(store, "readonly", function (s) { return s.get(key); }); };
  var idbSet = function (store, key, val) { return tx(store, "readwrite", function (s) { return s.put(val, key); }); };
  var idbDel = function (store, key) { return tx(store, "readwrite", function (s) { return s.delete(key); }); };
  var idbAll = function (store) { return tx(store, "readonly", function (s) { return s.getAll(); }); };

  // Em ambientes sem IndexedDB, cai para um cache em memória (degradação suave).
  var mem = {};
  function cacheGet(name) {
    return idbGet("kv", "coll:" + name).catch(function () { return mem[name]; });
  }
  function cacheSet(name, arr) {
    mem[name] = arr;
    return idbSet("kv", "coll:" + name, arr).catch(function () { return null; });
  }

  /* ----------------------------------------------------------------- *
   * Helpers de registro / merge.                                      *
   * ----------------------------------------------------------------- */
  var seeds = {};        // name -> array (fallback offline registrado pelo plugin)
  var listeners = {};    // name -> [cb]
  function notify(name, records) {
    (listeners[name] || []).forEach(function (cb) { try { cb(records); } catch (e) {} });
  }
  function stamp(rec) {
    if (!rec.updated_at) rec.updated_at = SEED_TS;
    if (rec.deleted_at === undefined) rec.deleted_at = null;
    return rec;
  }
  function indexById(arr) {
    var map = {};
    (arr || []).forEach(function (r) { map[r.id] = r; });
    return map;
  }
  // Mescla por id usando "last-write-wins" via updated_at.
  function mergeById(base, incoming) {
    var map = indexById(base);
    (incoming || []).forEach(function (r) {
      var cur = map[r.id];
      if (!cur || String(r.updated_at || "") >= String(cur.updated_at || "")) map[r.id] = r;
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }
  function visible(arr) { return (arr || []).filter(function (r) { return !r.deleted_at; }); }

  /* ----------------------------------------------------------------- *
   * OUTBOX — fila de escritas pendentes.                              *
   * ----------------------------------------------------------------- */
  // a store "outbox" usa keyPath:"opId", então o put não recebe key separada
  function rawOutboxPut(op) { return tx("outbox", "readwrite", function (s) { return s.put(op); }); }
  function enqueue(op) {
    op.opId = (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
    return rawOutboxPut(op).catch(function () { return null; })
      .then(function () { return flushOutbox(); });
  }

  function flushOutbox() {
    if (!cloudReady()) return Promise.resolve(false);
    return idbAll("outbox").then(function (ops) {
      var chain = Promise.resolve();
      (ops || []).forEach(function (op) {
        chain = chain.then(function () {
          var table = tableOf(op.name);
          var q;
          if (op.type === "remove") {
            // soft-delete: marca deleted_at
            q = client.from(table).update({ deleted_at: op.payload.deleted_at, updated_at: op.payload.updated_at }).eq("id", op.payload.id);
          } else {
            q = client.from(table).upsert(op.payload, { onConflict: "id" });
          }
          return q.then(function (res) {
            if (!res.error) return idbDel("outbox", op.opId);
            // erro de auth/RLS: mantém na fila p/ tentar depois
            return null;
          });
        });
      });
      return chain.then(function () { return true; });
    }).catch(function () { return false; });
  }

  /* ----------------------------------------------------------------- *
   * Pull da nuvem para uma coleção (revalidação).                     *
   * ----------------------------------------------------------------- */
  function pull(name) {
    if (!cloudReady()) return Promise.resolve(null);
    return client.from(tableOf(name)).select("*").then(function (res) {
      if (res.error || !res.data) return null; // sem sessão/RLS → mantém cache
      var remote = res.data.map(stamp);
      return cacheGet(name).then(function (local) {
        var merged = mergeById(local || [], remote);
        return cacheSet(name, merged).then(function () {
          notify(name, visible(merged));
          return merged;
        });
      });
    }).catch(function () { return null; });
  }

  /* ----------------------------------------------------------------- *
   * Repositório por coleção (o que o plugin consome).                 *
   * ----------------------------------------------------------------- */
  function collection(name) {
    return {
      /* leitura cache-first + revalidação em segundo plano */
      list: function (opts) {
        opts = opts || {};
        return cacheGet(name).then(function (cache) {
          if (!cache || !cache.length) {
            cache = (seeds[name] || []).map(function (r) { return stamp(Object.assign({}, r)); });
            if (cache.length) cacheSet(name, cache);
          }
          // revalida sem bloquear a resposta
          pull(name);
          return opts.includeDeleted ? cache.slice() : visible(cache);
        });
      },
      get: function (id) {
        return this.list({ includeDeleted: true }).then(function (arr) {
          return arr.filter(function (r) { return r.id === id && !r.deleted_at; })[0] || null;
        });
      },
      upsert: function (record) {
        var rec = stamp(Object.assign({}, record));
        rec.updated_at = new Date().toISOString();
        return cacheGet(name).then(function (cache) {
          var merged = mergeById(cache || [], [rec]);
          return cacheSet(name, merged).then(function () {
            notify(name, visible(merged));
            return enqueue({ name: name, type: "upsert", payload: rec }).then(function () { return rec; });
          });
        });
      },
      remove: function (id) {
        var when = new Date().toISOString();
        return cacheGet(name).then(function (cache) {
          var rec = (cache || []).filter(function (r) { return r.id === id; })[0];
          if (!rec) return null;
          rec = Object.assign({}, rec, { deleted_at: when, updated_at: when });
          var merged = mergeById(cache || [], [rec]);
          return cacheSet(name, merged).then(function () {
            notify(name, visible(merged));
            return enqueue({ name: name, type: "remove", payload: { id: id, deleted_at: when, updated_at: when } });
          });
        });
      },
      subscribe: function (cb) {
        (listeners[name] = listeners[name] || []).push(cb);
        return function () { listeners[name] = (listeners[name] || []).filter(function (f) { return f !== cb; }); };
      }
    };
  }

  /* ----------------------------------------------------------------- *
   * API pública: KickHub.db                                           *
   * ----------------------------------------------------------------- */
  KickHub.db = {
    collection: collection,
    /* o plugin registra seus dados-semente (fallback offline) */
    seed: function (name, records) { seeds[name] = records || []; return this; },
    /* força revalidação de uma ou todas as coleções conhecidas */
    sync: function (name) {
      if (name) return pull(name);
      return Promise.all(Object.keys(seeds).map(pull));
    },
    flush: flushOutbox,
    isConfigured: function () { return configured; },
    isCloud: cloudReady,
    isOnline: online
  };

  /* Quando a conexão volta: drena a fila e ressincroniza. */
  if (typeof window.addEventListener === "function") {
    window.addEventListener("online", function () {
      flushOutbox().then(function () { KickHub.db.sync(); });
    });
  }
})();
