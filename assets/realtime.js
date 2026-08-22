// realtime.js — capa de persistencia con Supabase Realtime y fallback localStorage.
//
// Por qué necesitamos esto: Live Share (o cualquier servidor de dev local)
// NO comparte los datos del navegador de tu pareja con el tuyo. localStorage
// vive dentro de cada navegador, así que sin un backend común las pujas
// nunca se ven en tiempo real entre los dos.
//
// Solución: conectamos a Supabase Realtime (plan gratuito, 500 MB y hasta
// 200 conexiones simultáneas). Si no configuras SUPABASE_URL/ANON_KEY
// en config.js, el script cae a localStorage y los datos solo viven
// en tu navegador.

(function () {
  const STORAGE_KEY = 'ranklol.bids.v1';
  const ROUND_START_KEY = 'ranklol.roundStart';
  const VOTE_KEY = 'ranklol.myVotes'; // ids de pujas creadas por este cliente en el server

  function cfg() { return (window.RANKLOL_CONFIG || {}); }
  function ready() {
    return new Promise((resolve) => {
      window.addEventListener('DOMContentLoaded', resolve);
    });
  }

  // -------- local fallback --------
  const localStore = {
    list() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
      catch (e) { return []; }
    },
    add(b) {
      const arr = localStore.list();
      arr.push({ ...b, id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6), origin: 'local' });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
      return arr[arr.length - 1];
    },
    subscribe(cb) {
      // El modo local no recibe eventos remotos; emite lo que ya existe.
      setTimeout(() => cb(localStore.list()), 0);
      return () => {};
    }
  };

  // -------- supabase (carga dinámica via CDN) --------
  let supabaseClient = null;
  function loadSupabase() {
    return new Promise((resolve, reject) => {
      const c = cfg();
      if (!c.SUPABASE_URL || !c.SUPABASE_ANON_KEY || /\[|\]/.test(c.SUPABASE_URL) || /\[|\]/.test(c.SUPABASE_ANON_KEY)) {
        return resolve(null);
      }
      if (window.supabase && window.supabase.createClient) return resolve(window.supabase);
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      s.onload = () => resolve(window.supabase);
      s.onerror = () => reject(new Error('No se pudo cargar Supabase JS.'));
      document.head.appendChild(s);
    });
  }

  const remoteStore = {
    list: null, add: null, subscribe: null, ready: false, error: null
  };

  async function init() {
    await ready();
    const c = cfg();
    let supa = null;
    try {
      supa = await loadSupabase();
    } catch (e) { remoteStore.error = e.message; }
    if (!supa) {
      return { mode: 'local', store: localStore };
    }
    supabaseClient = supa.createClient(c.SUPABASE_URL, c.SUPABASE_ANON_KEY);
    remoteStore.ready = true;

    remoteStore.list = async function () {
      const { data, error } = await supabaseClient
        .from('bids')
        .select('*')
        .order('bid', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map(normalizeRow);
    };

    remoteStore.add = async function (b) {
      const { data, error } = await supabaseClient
        .from('bids')
        .insert({ name: b.name, url: b.url, description: b.description || '', bid: b.bid })
        .select()
        .single();
      if (error) throw error;
      return normalizeRow(data);
    };

    remoteStore.subscribe = function (cb) {
      const ch = supabaseClient
        .channel('bids-realtime')
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'bids' },
          payload => cb([normalizeRow(payload.new)]));
      ch.subscribe();
      return () => { supabaseClient.removeChannel(ch); };
    };

    return { mode: 'supabase', store: remoteStore };
  }

  function normalizeRow(r) {
    return {
      id: r.id,
      name: r.name,
      url: r.url,
      description: r.description || '',
      bid: Number(r.bid),
      created_at: r.created_at || new Date().toISOString(),
      ts: r.created_at ? Date.parse(r.created_at) : Date.now(),
      origin: 'remote'
    };
  }

  window.RANKLOL_BACKEND = {
    init,
    localStore,
    remoteStore
  };
})();
