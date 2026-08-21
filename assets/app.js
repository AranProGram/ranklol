// app.js — ranking, countdown, modal, pujas demo con auto-borrado a 30d.
// No tocas el servidor ni Stripe: pujas en localStorage.

(function () {
  const RESET_MS = 30 * 86400000;          // 30 días
  const STORAGE_KEY = 'ranklol.bids.v1';
  const ROUND_START_KEY = 'ranklol.roundStart';
  let category = 'Indie AI tools';        // solo usado en el modal

  // --- round clock ---
  function getRoundStart() {
    let t = parseInt(localStorage.getItem(ROUND_START_KEY) || '0', 10);
    if (!t) { t = Date.now(); localStorage.setItem(ROUND_START_KEY, String(t)); }
    return t;
  }
  function bumpRoundIfNeeded() {
    const start = getRoundStart();
    if (Date.now() - start >= RESET_MS) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.setItem(ROUND_START_KEY, String(Date.now()));
    }
  }
  function pad(n) { return String(n).padStart(2, '0'); }
  function tick() {
    const start = getRoundStart();
    const left = Math.max(0, RESET_MS - (Date.now() - start));
    const d = Math.floor(left / 86400000);
    const h = Math.floor(left % 86400000 / 3600000);
    const m = Math.floor(left % 3600000 / 60000);
    const s = Math.floor(left % 60000 / 1000);
    const c = document.getElementById('countdown');
    const dEl = document.getElementById('bDays');
    if (c) c.textContent = lang() === 'en'
      ? `Resets in ${d}d ${pad(h)}:${pad(m)}:${pad(s)}`
      : `Reset en ${d}d ${pad(h)}:${pad(m)}:${pad(s)}`;
    if (dEl) dEl.textContent = d + (lang() === 'en' ? ' d' : ' días');
  }

  function lang() { return localStorage.getItem('ranklol.lang') || 'es'; }

  // --- data merge ---
  function getMyBids() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch (e) { return []; }
  }
  function saveMyBids(arr) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }
  function merged() {
    bumpRoundIfNeeded();
    const mine = getMyBids();
    const all = [...window.SEED, ...mine].sort((a, b) => b.bid - a.bid);
    return { rows: all, mine };
  }

  // --- render ---
  function render() {
    const { rows, mine } = merged();
    const mineKeys = new Set(mine.map(b => b.name + '|' + b.bid));
    const rs = document.getElementById('rows');
    if (!rs) return;
    rs.innerHTML = rows.slice(0, 20).map((d, i) => {
      const isMine = mineKeys.has(d.name + '|' + d.bid);
      const youTag = isMine ? '<span class="badge-you">' + (lang() === 'en' ? 'YOU' : 'TÚ') + '</span>' : '';
      const crown = i < 3 ? 'crown' : '';
      const rankCls = i < 3 ? 'top' : '';
      return `<div class="row ${isMine ? 'you' : ''}">
        <div class="rank ${crown} ${rankCls}">${i + 1}</div>
        <div class="info">
          <a class="nm" href="${escapeAttr(d.url)}" target="_blank" rel="noopener">${escapeHtml(d.name)}</a>${youTag}
          <div class="ds">${escapeHtml(d.description || '')}</div>
        </div>
        <div class="meta">
          <span class="bid mono">$${d.bid.toLocaleString()}</span>
          <span class="clk">${(d.clicks || 0).toLocaleString()} ${lang() === 'en' ? 'clicks' : 'clicks'}</span>
        </div>
      </div>`;
    }).join('');

    const total = rows.reduce((a, b) => a + b.bid, 0);
    setText('totalRaised', '$' + total.toLocaleString());
    setText('totalBids', rows.length);
    setText('bTotal', '$' + total.toLocaleString());

    const trend = [...rows].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);
    renderList('trend', trend, d => `<li><span>${escapeHtml(d.name)}</span><span class="n">${(d.clicks || 0).toLocaleString()} clicks/h</span></li>`);
    const act = [...rows].sort((a, b) => b.ts - a.ts).slice(0, 6);
    renderList('act', act, d => `<li><span>${escapeHtml(d.name)} · $${d.bid.toLocaleString()}</span><span class="t">${ago(d.ts)}</span></li>`);
  }

  function renderList(id, items, tpl) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!items.length) { el.innerHTML = '<li style="border:none;color:var(--muted)">—</li>'; return; }
    el.innerHTML = items.map(tpl).join('');
  }
  function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }
  function ago(ts) {
    const dt = Date.now() - ts;
    if (dt < 60000) return lang() === 'en' ? 'just now' : 'hace un momento';
    if (dt < 3600000) return Math.floor(dt / 60000) + (lang() === 'en' ? ' min ago' : ' min');
    if (dt < 86400000) return Math.floor(dt / 3600000) + (lang() === 'en' ? ' h ago' : ' h');
    return Math.floor(dt / 86400000) + ' d';
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // --- modal ---
  const PRESETS = [2, 5, 10, 25, 50, 100, 250, 500];
  let selectedPreset = 10;
  function renderChips() {
    const c = document.getElementById('chips');
    if (!c) return;
    c.innerHTML = PRESETS.map(p => `<button class="chip ${p === selectedPreset ? 'on' : ''}" data-v="${p}">$${p}</button>`).join('');
    c.querySelectorAll('.chip').forEach(b => {
      b.addEventListener('click', () => {
        selectedPreset = +b.dataset.v;
        renderChips();
        updatePreview();
      });
    });
    updatePreview();
  }
  function rankFor(amt) {
    const all = [...window.SEED, ...getMyBids()];
    return all.filter(d => d.bid > amt).length + 1;
  }
  function updatePreview() {
    const n = (document.getElementById('fName') || {}).value || '';
    const p = document.getElementById('preview');
    if (!p) return;
    p.textContent = n.trim()
      ? `#${rankFor(selectedPreset)} · ${n.trim()} · $${selectedPreset}`
      : `Bid: $${selectedPreset} → rank #${rankFor(selectedPreset)}`;
  }

  window.openBid = function () {
    const m = document.getElementById('modal');
    if (!m) return;
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    renderChips();
  };
  window.closeBid = function () {
    const m = document.getElementById('modal');
    if (!m) return;
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
  };
  window.payDemo = function () {
    const name = (document.getElementById('fName').value || '').trim();
    const url = (document.getElementById('fUrl').value || '').trim();
    const desc = (document.getElementById('fDesc').value || '').trim();
    if (!name || !url) {
      toast((window.I18N[lang()]['toast.demo.err.fields']));
      return;
    }
    bumpRoundIfNeeded();
    const mine = getMyBids();
    if (mine.some(b => b.name === name && b.bid === selectedPreset)) {
      toast((window.I18N[lang()]['toast.demo.err.name']));
      return;
    }
    mine.push({
      name, url, description: desc,
      bid: selectedPreset,
      clicks: 0,
      ts: Date.now(),
      category,
      mine: true
    });
    saveMyBids(mine);
    const newRank = rankFor(selectedPreset) - 1 + 1; // recalculado después de push
    toast(window.I18N[lang()]['toast.demo.ok'] + rankFor(selectedPreset));
    render();
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

  // --- init ---
  document.addEventListener('DOMContentLoaded', () => {
    bumpRoundIfNeeded();
    render();
    renderChips();
    bindInputs();
    setInterval(tick, 1000); tick();
    setInterval(render, 8000); // refresco suave para que se sienta vivo
  });

  function bindInputs() {
    const n = document.getElementById('fName');
    if (n) n.addEventListener('input', updatePreview);
    // Tecla Esc cierra el modal
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeBid(); });
    // Click fuera del modal cierra
    const m = document.getElementById('modal');
    if (m) m.addEventListener('click', e => { if (e.target === m) closeBid(); });
  }
})();
