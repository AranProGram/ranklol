// settings.js — gestiona las claves de Supabase y los datos del operador
// en localStorage. Como GitHub Pages es estático, NUNCA se suben al repo.
// Todo se inyecta al cargar la página.

(function () {
  const KEYS = {
    supabaseUrl: 'ranklol.cfg.supabaseUrl',
    supabaseAnonKey: 'ranklol.cfg.supabaseAnonKey',
    operatorName: 'ranklol.cfg.operatorName',
    operatorEmail: 'ranklol.cfg.operatorEmail',
    siteOrigin: 'ranklol.cfg.siteOrigin'
  };

  function get() {
    return {
      supabaseUrl: localStorage.getItem(KEYS.supabaseUrl) || '',
      supabaseAnonKey: localStorage.getItem(KEYS.supabaseAnonKey) || '',
      operatorName: localStorage.getItem(KEYS.operatorName) || '',
      operatorEmail: localStorage.getItem(KEYS.operatorEmail) || '',
      siteOrigin: localStorage.getItem(KEYS.siteOrigin) || ''
    };
  }

  function save(values) {
    Object.entries(KEYS).forEach(([k, storageKey]) => {
      const v = (values[k] || '').trim();
      if (v) localStorage.setItem(storageKey, v);
      else localStorage.removeItem(storageKey);
    });
  }

  function clear() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
  }

  // Render de campos en cualquier página que abra #settings
  function hydrate() {
    const u = document.getElementById('cfgUrl');   if (u) u.value = get().supabaseUrl;
    const k = document.getElementById('cfgKey');   if (k) k.value = get().supabaseAnonKey;
    const o = document.getElementById('cfgName');  if (o) o.value = get().operatorName;
    const e = document.getElementById('cfgEmail'); if (e) e.value = get().operatorEmail;
    const oo = document.getElementById('cfgOrigin'); if (oo) oo.value = get().siteOrigin || defaultOrigin();
  }

  function defaultOrigin() {
    if (typeof location === 'undefined') return '';
    return location.origin + location.pathname.replace(/\/[^\/]*$/, '/');
  }

  window.RANKLOL_SETTINGS = { get, save, clear, hydrate, defaultOrigin };
})();

// Botones #settings sólo existen en index.html, pero los declaramos globales.
window.openSettings = function () {
  const m = document.getElementById('settings');
  if (!m) return;
  if (window.RANKLOL_SETTINGS && window.RANKLOL_SETTINGS.hydrate) window.RANKLOL_SETTINGS.hydrate();
  m.classList.add('open');
  m.setAttribute('aria-hidden', 'false');
};
window.closeSettings = function () {
  const m = document.getElementById('settings');
  if (!m) return;
  m.classList.remove('open');
  m.setAttribute('aria-hidden', 'true');
};
window.saveSettings = async function () {
  const url = (document.getElementById('cfgUrl')?.value || '').trim();
  const key = (document.getElementById('cfgKey')?.value || '').trim();
  const name = (document.getElementById('cfgName')?.value || '').trim();
  const email = (document.getElementById('cfgEmail')?.value || '').trim();
  const origin = (document.getElementById('cfgOrigin')?.value || '').trim();
  window.RANKLOL_SETTINGS.save({
    supabaseUrl: url, supabaseAnonKey: key, operatorName: name, operatorEmail: email, siteOrigin: origin
  });
  showCfg('Guardado. Pulsa "Probar conexión" para verificar.', false);
  if (window.__refreshBackend) window.__refreshBackend();
};
window.testSettings = async function () {
  const status = document.getElementById('statusLine');
  if (status) { status.className = 'status-line'; status.textContent = 'Probando…'; }
  if (window.__refreshBackend) await window.__refreshBackend();
};
window.clearSettings = function () {
  if (!confirm('¿Seguro que quieres borrar las claves y los datos del operador guardados en este navegador?')) return;
  window.RANKLOL_SETTINGS.clear();
  if (window.RANKLOL_SETTINGS.hydrate) window.RANKLOL_SETTINGS.hydrate();
  showCfg('Datos borrados de este navegador. La web volverá al modo local.', false);
  if (window.__refreshBackend) window.__refreshBackend();
};

function showCfg(msg, isError) {
  const el = document.getElementById('cfgStatus');
  if (!el) return;
  el.style.display = 'block';
  el.style.color = isError ? '#ff6c6c' : 'var(--green)';
  el.textContent = msg;
}
