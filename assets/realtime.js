// realtime.js — capa de persistencia con Supabase Realtime.
// Las claves se leen de assets/settings.js (que las lee a su vez de localStorage).
// GitHub Pages es estático, así que NO usamos keys hardcodeadas en el repo:
//   las ingresa el visitante desde el panel "Ajustes" (ver assets/settings.js).
//
// Sin claves configuradas → fallback a localStorage del navegador.

(function () {
  const STORAGE_KEY = 'ranklol.bids.local';
  const ROUND_START_KEY = 'ranklol.roundStart';

  function tsFromRow(r) {
    const v = r.created_at || r.ts || Date.now();
    if (typeof v === 'string') return Date.parse(v);
    return Number(v);
  }

  function normalize(row, fallbackId) {
    return {
      id: row.id || fallbackId || ('local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6)),
      name: String(row.name || '').trim(),
      url: String(row.url || '').trim(),
      description: String(row.description || '').trim(),
      bid: Number(row.bid) || 0,
      clicks: Number(row.clicks) || 0,
      created_at: row.created_at || new Date().toISOString(),
      ts: tsFromRow(row),
      origin: row.origin || 'local'
    };
  }

  const localStore = {
    list() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]').map(r => normalize(r)); }
      catch (e) { return []; }
    },
    add(b) {
      const arr = localStore.list();
      const row = normalize({ ...b, ts: Date.now(), origin: 'local' });
      arr.push(row);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      return row;
    },
    clear() { localStorage.removeItem(STORAGE_KEY); },
    subscribe() { return () => {}; }
  };

  async function loadSupabaseSdk() {
    if (window.supabase && window.supabase.createClient) return window.supabase;
    return await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = () => resolve(window.supabase);
      s.onerror = () => reject(new Error('No se pudo cargar el SDK de Supabase.'));
      document.head.appendChild(s);
    });
  }

  function makeRemoteStore(supabase, cfg) {
    const client = supabase.createClient(cfg.url, cfg.key, { auth: { persistSession: false } });
    return {
      async list() {
        const { data, error } = await client.from('bids').select('*').order('bid', { ascending: false }).limit(50);
        if (error) throw error;
        // Ordena de nuevo en cliente por si la columna indexada cambia
        const rows = (data || []).map(r => normalize(r));
        rows.sort((a, b) => b.bid - a.bid);
        return rows;
      },
      async add(b) {
        const { data, error } = await client.from('bids').insert({
          name: b.name, url: b.url, description: b.description || '', bid: b.bid
        }).select().single();
        if (error) throw error;
        return normalize(data);
      },
      subscribe(onInsert) {
        const ch = client.channel('bids-realtime')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' },
            payload => onInsert([normalize(payload.new)]))
          .subscribe();
        return () => client.removeChannel(ch);
      },
      raw: client
    };
  }

  let _instance = { mode: 'local', store: localStore, error: null };

  async function init() {
    const cfg = (window.RANKLOL_SETTINGS && window.RANKLOL_SETTINGS.get && window.RANKLOL_SETTINGS.get()) || {};
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      _instance = { mode: 'local', store: localStore, error: null };
      return _instance;
    }
    try {
      const supa = await loadSupabaseSdk();
      const remote = makeRemoteStore(supa, { url: cfg.supabaseUrl, key: cfg.supabaseAnonKey });
      // Probar la conexión con una SELECT ligera
      await remote.list();
      _instance = { mode: 'supabase', store: remote, error: null };
      return _instance;
    } catch (e) {
      _instance = { mode: 'local', store: localStore, error: e.message || String(e) };
      return _instance;
    }
  }

  window.RANKLOL_BACKEND = { init, localStore, get instance() { return _instance; } };
})();
