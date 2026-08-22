// app.js — orquesta ranking, reloj, modal y actividad en tiempo real.
// Trabaja con la capa realtime.js (Supabase o fallback local).

(function () {
  const cfg = () => (window.RANKLOL_CONFIG || {});
  const state = {
    backend: null,
    rows: [],
    mode: 'local',
    selectedPreset: cfg().PRESETS ? cfg().PRESETS[2] : 10,
    feed: [],
    clockEl: null,
  };

  function t(key) { return (window.I18N[(localStorage.getItem('ranklol.lang') || 'es')] || {})[key] || key; }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }
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

  // ----- reloj / reset -----
  function getRoundStart() {
    let v = parseInt(localStorage.getItem('ranklol.roundStart') || '0', 10);
    if (!v) { v = Date.now(); localStorage.setItem('ranklol.roundStart', String(v)); }
    return v;
  }
  function bumpRound() {
    const RESET = (cfg().RESET_DAYS || 30) * 86400000;
    const start = getRoundStart();
    if (Date.now() - start >= RESET) {
      try {
        if (state.mode === 'local') {
          localStorage.removeItem('ranklol.bids.v1');
        }
      } catch (e) {}
      localStorage.setItem('ranklol.roundStart', String(Date.now()));
    }
  }
  function tick() {
    bumpRound();
    const RESET = (cfg().RESET_DAYS || 30) * 86400000;
    const left = Math.max(0, RESET - (Date.now() - getRoundStart()));
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

  // ----- render -----
  async function refreshRows() {
    try {
      const rows = await state.backend.list();
      const seed = window.SEED.map(s => ({
        id: 'seed-' + s.name,
        name: s.name, url: s.url, description: s.description,
        bid: s.bid, clicks: s.clicks, ts: s.ts, origin: 'seed'
      }));
      const merged = [...(rows || []), ...seed].sort((a, b) => b.bid - a.bid);
      state.rows = merged.slice(0, 25);
      renderRows();
      renderSidebar();
    } catch (e) {
      // fallback silencioso
      const seed = window.SEED.map(s => ({
        id: 'seed-' + s.name,
        name: s.name, url: s.url, description: s.description,
        bid: s.bid, clicks: s.clicks, ts: s.ts, origin: 'seed'
      }));
      state.rows = seed.slice(0, 25);
      renderRows();
      renderSidebar();
    }
  }

  function renderRows() {
    const rs = document.getElementById('rows');
    if (!rs) return;
    const lang = localStorage.getItem('ranklol.lang') || 'es';
    const myFingerprints = new Set(getMyLocalIds());
    rs.innerHTML = state.rows.map((d, i) => {
      const isMine = myFingerprints.has(d.id) || (d.origin === 'local');
      const youTag = isMine ? `<span class="badge-you">${lang === 'en' ? 'YOU' : 'TÚ'}</span>` : '';
      const isNew = state.justInserted && state.justInserted.includes(d.id);
      const crown = i < 3 ? 'crown' : '';
      const rankCls = i < 3 ? 'top' : '';
      return `<div class="row ${isMine ? 'you' : ''} ${isNew ? 'newInsert' : ''}">
        <div class="rank ${crown} ${rankCls}">${i + 1}</div>
        <div class="info">
          <a class="nm" href="${escapeAttr(d.url)}" target="_blank" rel="noopener nofollow ugc">${escapeHtml(d.name)}</a>${youTag}
          <div class="ds">${escapeHtml(d.description || '')}</div>
        </div>
        <div class="meta">
          <span class="bid mono">$${Number(d.bid).toLocaleString()}</span>
          <span class="clk">${(d.clicks || 0).toLocaleString()} clicks</span>
        </div>
      </div>`;
    }).join('');

    const total = state.rows.reduce((a, b) => a + b.bid, 0);
    document.getElementById('bTotal').textContent = '$' + total.toLocaleString();
    document.getElementById('totalRaised') && (document.getElementById('totalRaised').textContent = '$' + total.toLocaleString());
    document.getElementById('totalBids') && (document.getElementById('totalBids').textContent = state.rows.length);

    state.justInserted = null;
  }

  function renderSidebar() {
    const trend = [...state.rows].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);
    const tEl = document.getElementById('trend');
    if (tEl) tEl.innerHTML = trend.length
      ? trend.map(d => `<li><span>${escapeHtml(d.name)}</span><span class="n">${(d.clicks || 0).toLocaleString()} clicks/h</span></li>`).join('')
      : `<li style="border:none;color:var(--muted)">—</li>`;

    const act = [...state.rows].sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 6);
    const aEl = document.getElementById('act');
    if (aEl) aEl.innerHTML = act.length
      ? act.map(d => `<li><span>${escapeHtml(d.name)} · $${Number(d.bid).toLocaleString()}</span><span class="ago">${relativeTime(d.ts || 0)}</span></li>`).join('')
      : `<li style="border:none;color:var(--muted)">—</li>`;
  }

  function renderFeed() {
    const feedEl = document.getElementById('actFeed');
    if (!feedEl) return;
    if (!state.feed.length) {
      feedEl.innerHTML = `<li style="border:none;color:var(--muted)">${escapeHtml(t('feed.empty'))}</li>`;
      return;
    }
    feedEl.innerHTML = state.feed.map(item => `
      <li>
        <span><b>${escapeHtml(item.name)}</b> subió al ranking · $${Number(item.bid).toLocaleString()}</span>
        <span class="ago">${relativeTime(item.ts)}</span>
      </li>
    `).join('');
  }

  function pushFeed(item) {
    state.feed.unshift(item);
    state.feed = state.feed.slice(0, 30);
    renderFeed();
  }

  function getMyLocalIds() {
    try {
      const my = JSON.parse(localStorage.getItem('ranklol.myLocal') || '[]');
      return my;
    } catch (e) { return []; }
  }
  function setMyLocalId(id) {
    const arr = getMyLocalIds();
    if (!arr.includes(id)) {
      arr.push(id);
      localStorage.setItem('ranklol.myLocal', JSON.stringify(arr));
    }
  }

  // ----- modal / puja -----
  function renderChips() {
    const chips = document.getElementById('chips');
    if (!chips) return;
    const presets = cfg().PRESETS || [2,5,10,25,50,100,250,500];
    state.selectedPreset = state.selectedPreset || presets[2];
    chips.innerHTML = presets.map(p => {
      return `<button type="button" class="chip ${p === state.selectedPreset ? 'on' : ''}" data-v="${p}">$${p}</button>`;
    }).join('');
    chips.querySelectorAll('.chip').forEach(b => {
      b.addEventListener('click', () => {
        state.selectedPreset = +b.dataset.v;
        renderChips(); updatePreview();
      });
    });
    updatePreview();
  }
  function rankForPreview(amt) {
    const all = [...state.rows, ...(window.SEED.map(s => ({...s, ts: s.ts||Date.now()})))];
    return all.filter(d => (d.bid||0) > amt).length + 1;
  }
  function updatePreview() {
    const n = (document.getElementById('fName') || {}).value || '';
    const p = document.getElementById('preview');
    if (!p) return;
    p.textContent = n.trim()
      ? `Posición #${rankForPreview(state.selectedPreset)} · ${n.trim()} · $${state.selectedPreset}`
      : `Si pujas $${state.selectedPreset},estarías en el puesto #${rankForPreview(state.selectedPreset)}.`;
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
    if (!/^https?:\/\//i.test(url)) {
      toast(localStorage.getItem('ranklol.lang') === 'en'
        ? 'URL must start with http:// or https://'
        : 'La URL debe empezar por http:// o https://');
      return;
    }
    const min = cfg().MIN_BID || 2;
    if (state.selectedPreset < min) {
      toast(localStorage.getItem('ranklol.lang') === 'en'
        ? `Minimum bid is $${min}.` : `La puja mínima es de $${min}.`);
      return;
    }

    const newBid = { name, url, description: desc, bid: state.selectedPreset, ts: Date.now() };
    let savedBid = null;

    try {
      if (state.mode === 'supabase') {
        savedBid = await window.RANKLOL_BACKEND.remoteStore.add(newBid);
      } else {
        savedBid = window.RANKLOL_BACKEND.localStore.add(newBid);
      }
      setMyLocalId(savedBid.id);

      // Insertar local sin esperar al canal realtime
      state.rows.unshift(savedBid);
      state.rows.sort((a, b) => b.bid - a.bid);
      state.justInserted = [savedBid.id];
      pushFeed(savedBid);
      renderRows();
      renderSidebar();

      toast(t('toast.ok') + rankForPreview(state.selectedPreset));
      closeBid();
      document.getElementById('fName').value = '';
      document.getElementById('fUrl').value = '';
      document.getElementById('fDesc').value = '';
    } catch (e) {
      toast(t('toast.err.network'));
      try {
        savedBid = window.RANKLOL_BACKEND.localStore.add(newBid);
        setMyLocalId(savedBid.id);
        state.rows.unshift(savedBid);
        state.rows.sort((a, b) => b.bid - a.bid);
        state.justInserted = [savedBid.id];
        pushFeed(savedBid);
        renderRows();
        renderSidebar();
      } catch (innerErr) {
        toast(t('toast.err.network'));
      }
    }
  };

  function toast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.style.display = 'block';
    clearTimeout(window.__toastT);
    window.__toastT = setTimeout(() => { el.style.display = 'none'; }, 3500);
  }

  // ----- init -----
  async function boot() {
    const r = await window.RANKLOL_BACKEND.init();
    state.backend = r.store;
    state.mode = r.mode;

    if (r.mode === 'supabase') {
      try {
        const unsubscribe = await r.store.subscribe(list => {
          list.forEach(item => {
            if (!state.rows.find(x => x.id === item.id)) {
              state.rows.push(item);
              pushFeed(item);
            }
          });
          state.rows.sort((a, b) => b.bid - a.bid);
          state.justInserted = list.map(x => x.id);
          renderRows();
          renderSidebar();
        });
        window.__unsub = unsubscribe;
      } catch (e) { /* swallow */ }
    } else {
      // feed vacío al inicio en modo local
      state.feed = [];
    }

    await refreshRows();
    renderFeed();
    setInterval(tick, 1000); tick();
    setInterval(refreshRows, 12000);

    document.getElementById('fName').addEventListener('input', updatePreview);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBid(); });
    const m = document.getElementById('modal');
    if (m) m.addEventListener('click', e => { if (e.target === m) closeBid(); });
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
