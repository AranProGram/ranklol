// app.js — ranking, reloj, modal, actividad y refresco del backend.

(function () {
  const STATE = {
    backend: null,
    mode: 'local',
    rows: [],
    feed: [],
    selectedPreset: 10,
    resetDays: 30
  };

  const PRESETS = [2, 5, 10, 25, 50, 100, 250, 500];
  const MY_LOCAL_IDS_KEY = 'ranklol.myLocal';
  const ROUND_START_KEY = 'ranklol.roundStart';
  const RESET_MS = () => (STATE.resetDays || 30) * 86400000;

  function t(k) { return (window.I18N[localStorage.getItem('ranklol.lang') || 'es'] || {})[k] || k; }
  function esc(s) { return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
  function pad(n) { return String(n).padStart(2, '0'); }

  function relativeTime(ts) {
    const lang = localStorage.getItem('ranklol.lang') || 'es';
    const dt = Date.now() - ts;
    if (dt < 0) return lang === 'en' ? 'in a moment' : 'en un momento';
    const s = Math.floor(dt / 1000);
    if (s < 60) return lang === 'en' ? 'just now' : 'hace un momento';
    const m = Math.floor(s / 60);
    if (m < 60) return lang === 'en' ? `${m} min ago` : `hace ${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return lang === 'en' ? `${h} h ago` : `hace ${h} h`;
    const d = Math.floor(h / 24);
    if (d < 30) return lang === 'en' ? `${d} d ago` : `hace ${d} d`;
    const months = Math.floor(d / 30);
    return lang === 'en' ? `${months} mo ago` : `hace ${months} mes`;
  }

  function getRoundStart() {
    let v = parseInt(localStorage.getItem(ROUND_START_KEY) || '0', 10);
    if (!v) { v = Date.now(); localStorage.setItem(ROUND_START_KEY, String(v)); }
    return v;
  }
  function bumpRound() {
    if (Date.now() - getRoundStart() >= RESET_MS()) {
      try {
        if (STATE.mode === 'local' && window.RANKLOL_BACKEND?.localStore?.clear) {
          window.RANKLOL_BACKEND.localStore.clear();
        }
      } catch (e) {}
      localStorage.setItem(ROUND_START_KEY, String(Date.now()));
    }
  }
  function tick() {
    bumpRound();
    const left = Math.max(0, RESET_MS() - (Date.now() - getRoundStart()));
    const d = Math.floor(left / 86400000);
    const h = Math.floor(left % 86400000 / 3600000);
    const m = Math.floor(left % 3600000 / 60000);
    const s = Math.floor(left % 60000 / 1000);
    const lang = localStorage.getItem('ranklol.lang') || 'es';
    const c = document.getElementById('countdown');
    const dEl = document.getElementById('bDays');
    if (c) c.textContent = lang === 'en' ? `Resets in ${d}d ${pad(h)}:${pad(m)}:${pad(s)}` : `Reset en ${d} d ${pad(h)}:${pad(m)}:${pad(s)}`;
    if (dEl) dEl.textContent = d;
  }

  function getMyIds() {
    try { return JSON.parse(localStorage.getItem(MY_LOCAL_IDS_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function setMyId(id) {
    const arr = getMyIds();
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem(MY_LOCAL_IDS_KEY, JSON.stringify(arr));
    }
  }

  async function refreshRows() {
    try {
      const rows = await STATE.backend.list();
      const seed = (window.SEED || []).map(s => ({ ...s, origin: 'seed', ts: s.ts || Date.parse(s.created_at) || Date.now() }));
      const merged = [...rows, ...seed].sort((a, b) => b.bid - a.bid);
      STATE.rows = merged.slice(0, 25);
      renderRows();
      renderSidebar();
    } catch (e) {
      const seed = (window.SEED || []).map(s => ({ ...s, origin: 'seed', ts: s.ts || Date.parse(s.created_at) || Date.now() }));
      STATE.rows = seed.slice(0, 25);
      renderRows();
      renderSidebar();
    }
  }

  function renderRows() {
    const rs = document.getElementById('rows');
    if (!rs) return;
    const lang = localStorage.getItem('ranklol.lang') || 'es';
    const myIds = new Set(getMyIds());
    rs.innerHTML = STATE.rows.map((d, i) => {
      const isMine = myIds.has(d.id) || (d.origin === 'local');
      const youTag = isMine ? `<span class="badge-you">${lang === 'en' ? 'YOU' : 'TÚ'}</span>` : '';
      const isNew = STATE.justInserted && STATE.justInserted.includes(d.id);
      const crown = i < 3 ? 'crown' : '';
      const rankCls = i < 3 ? 'top' : '';
      return `<div class="row ${isMine ? 'you' : ''} ${isNew ? 'newInsert' : ''}">
        <div class="rank ${crown} ${rankCls}">${i + 1}</div>
        <div class="info">
          <a class="nm" href="${esc(d.url)}" target="_blank" rel="noopener nofollow ugc">${esc(d.name)}</a>${youTag}
          <div class="ds">${esc(d.description || '')}</div>
        </div>
        <div class="meta">
          <span class="bid mono">$${Number(d.bid).toLocaleString()}</span>
          <span class="clk">${(d.clicks || 0).toLocaleString()} clicks</span>
        </div>
      </div>`;
    }).join('');

    const total = STATE.rows.reduce((a, b) => a + b.bid, 0);
    const bTotal = document.getElementById('bTotal');
    if (bTotal) bTotal.textContent = '$' + total.toLocaleString();

    STATE.justInserted = null;
  }

  function renderSidebar() {
    const trend = [...STATE.rows].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);
    const tEl = document.getElementById('trend');
    if (tEl) tEl.innerHTML = trend.length
      ? trend.map(d => `<li><span>${esc(d.name)}</span><span class="n">${(d.clicks || 0).toLocaleString()} clicks/h</span></li>`).join('')
      : `<li style="border:none;color:var(--muted)">—</li>`;

    const act = [...STATE.rows].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 6);
    const aEl = document.getElementById('act');
    if (aEl) aEl.innerHTML = act.length
      ? act.map(d => `<li><span>${esc(d.name)} · $${Number(d.bid).toLocaleString()}</span><span class="ago">${relativeTime(d.ts || 0)}</span></li>`).join('')
      : `<li style="border:none;color:var(--muted)">—</li>`;
  }

  function renderFeed() {
    const feedEl = document.getElementById('actFeed');
    if (!feedEl) return;
    if (!STATE.feed.length) {
      feedEl.innerHTML = `<li style="border:none;color:var(--muted)">${esc(t('feed.empty'))}</li>`;
      return;
    }
    feedEl.innerHTML = STATE.feed.map(item => `
      <li>
        <span><b>${esc(item.name)}</b> subió al ranking · $${Number(item.bid).toLocaleString()}</span>
        <span class="ago">${relativeTime(item.ts)}</span>
      </li>
    `).join('');
  }

  function pushFeed(item) {
    STATE.feed.unshift(item);
    STATE.feed = STATE.feed.slice(0, 30);
    renderFeed();
  }

  function renderStatus() {
    const sl = document.getElementById('statusLine');
    if (!sl) return;
    const cfg = (window.RANKLOL_SETTINGS && window.RANKLOL_SETTINGS.get) ? window.RANKLOL_SETTINGS.get() : {};
    if (STATE.mode === 'supabase') {
      sl.className = 'status-line ok';
      const host = (cfg.supabaseUrl || '').replace('https://', '');
      sl.textContent = `✓ Backend conectado · ${host}`;
    } else if (window.RANKLOL_BACKEND?.instance?.error) {
      sl.className = 'status-line err';
      sl.textContent = `× Backend no disponible · ${window.RANKLOL_BACKEND.instance.error}`;
    } else {
      sl.className = 'status-line';
      sl.textContent = '— Modo local (solo tu navegador). Configura Supabase en Ajustes.';
    }
  }

  function renderChips() {
    const chips = document.getElementById('chips');
    if (!chips) return;
    STATE.selectedPreset = STATE.selectedPreset || 10;
    chips.innerHTML = PRESETS.map(p => `<button type="button" class="chip ${p === STATE.selectedPreset ? 'on' : ''}" data-v="${p}">$${p}</button>`).join('');
    chips.querySelectorAll('.chip').forEach(b => {
      b.addEventListener('click', () => { STATE.selectedPreset = +b.dataset.v; renderChips(); updatePreview(); });
    });
    updatePreview();
  }
  function rankForPreview(amt) {
    return STATE.rows.filter(d => (d.bid || 0) > amt).length + 1;
  }
  function updatePreview() {
    const n = (document.getElementById('fName') || {}).value || '';
    const p = document.getElementById('preview');
    if (!p) return;
    const lang = localStorage.getItem('ranklol.lang') || 'es';
    p.textContent = n.trim()
      ? (lang === 'en' ? `Position #${rankForPreview(STATE.selectedPreset)} · ${n.trim()} · $${STATE.selectedPreset}` : `Posición #${rankForPreview(STATE.selectedPreset)} · ${n.trim()} · $${STATE.selectedPreset}`)
      : (lang === 'en' ? `If you bid $${STATE.selectedPreset}, you would be at #${rankForPreview(STATE.selectedPreset)}.` : `Si pujas $${STATE.selectedPreset}, estarías en el puesto #${rankForPreview(STATE.selectedPreset)}.`);
  }

  window.openBid = function () {
    const m = document.getElementById('modal');
    if (!m) return;
    m.classList.add('open'); m.setAttribute('aria-hidden', 'false');
    renderChips();
  };
  window.closeBid = function () {
    const m = document.getElementById('modal');
    if (!m) return;
    m.classList.remove('open'); m.setAttribute('aria-hidden', 'true');
  };

  window.submitBid = async function () {
    const name = (document.getElementById('fName').value || '').trim();
    const url = (document.getElementById('fUrl').value || '').trim();
    const desc = (document.getElementById('fDesc').value || '').trim();
    if (!name || !url) { toast(t('toast.err.fields')); return; }
    if (!/^https?:\/\//i.test(url)) { toast(t('toast.err.url')); return; }
    if (STATE.selectedPreset < 2) {
      toast(localStorage.getItem('ranklol.lang') === 'en' ? 'Minimum bid is $2.' : 'La puja mínima es de 2 $.');
      return;
    }

    const newBid = { name, url, description: desc, bid: STATE.selectedPreset };

    // anti-duplicados
    const dupe = STATE.rows.find(d => d.name === name && Number(d.bid) === STATE.selectedPreset);
    if (dupe) { toast(t('toast.err.dupe')); return; }

    let saved;
    try {
      saved = await STATE.backend.add(newBid);
      setMyId(saved.id);
    } catch (e) {
      toast(t('toast.err.network'));
      saved = window.RANKLOL_BACKEND.localStore.add(newBid);
      setMyId(saved.id);
    }

    STATE.rows.unshift(saved);
    STATE.rows.sort((a, b) => b.bid - a.bid);
    STATE.justInserted = [saved.id];
    pushFeed(saved);
    renderRows();
    renderSidebar();

    toast(t('toast.ok') + rankForPreview(STATE.selectedPreset));
    closeBid();
    document.getElementById('fName').value = '';
    document.getElementById('fUrl').value = '';
    document.getElementById('fDesc').value = '';
  };

  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(window.__toastT);
    window.__toastT = setTimeout(() => { el.style.display = 'none'; }, 3500);
  }

  async function bootBackend() {
    const r = await window.RANKLOL_BACKEND.init();
    STATE.backend = r.store;
    STATE.mode = r.mode;
    if (r.mode === 'supabase') {
      try {
        window.__unsub = await r.store.subscribe(list => {
          list.forEach(item => {
            if (!STATE.rows.find(x => x.id === item.id)) {
              STATE.rows.push(item);
              pushFeed(item);
            }
          });
          STATE.rows.sort((a, b) => b.bid - a.bid);
          STATE.justInserted = list.map(x => x.id);
          renderRows();
          renderSidebar();
        });
      } catch (e) { /* swallow */ }
    }
    renderStatus();
    await refreshRows();
    renderFeed();
  }

  window.__refreshBackend = async function () {
    if (window.__unsub) { try { window.__unsub(); } catch (e) {} window.__unsub = null; }
    STATE.rows = [];
    await bootBackend();
  };

  document.addEventListener('DOMContentLoaded', async () => {
    await bootBackend();
    setInterval(tick, 1000); tick();
    setInterval(refreshRows, 15000);
    document.getElementById('fName').addEventListener('input', updatePreview);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeBid(); closeSettings(); } });
    const m = document.getElementById('modal');
    if (m) m.addEventListener('click', e => { if (e.target === m) closeBid(); });
    const s = document.getElementById('settings');
    if (s) s.addEventListener('click', e => { if (e.target === s) closeSettings(); });
  });
})();
