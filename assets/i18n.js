// i18n.js — diccionario bilingüe + función setLang().
window.I18N = {
  es: {
    "meta.title": "RankLOL — el ranking que se compra",
    "meta.desc": "Paga para subir en el ranking de apps indie y AI. Si alguien puja más, te supera. Reset cada 30 días.",
    "warn.dot": "⚠️",
    "warn.text": "Modo demo. Las pujas no se cobran todavía. Estamos validando demanda antes de activar pagos reales.",
    "warn.link": "cómo funciona",
    "stats.total": "BOTE",
    "stats.bids": "PUJAS",
    "cta.bid": "PUJA AHORA 💸",
    "hero.h1": 'EL RANKING QUE <span class="grad">SE COMPRA</span>',
    "hero.sub": "Paga para subir en el ranking de apps indie y AI. Si alguien puja más, te supera. Reset cada 30 días.",
    "bote.l1": "BOTE",
    "bote.h1": "acumulado del mes",
    "bote.l2": "CIERRE",
    "bote.h2": "días para reset",
    "bote.l3": "MODO",
    "bote.v3": "DEMO",
    "bote.h3": "pujas no se cobran",
    "board.h2": "🏆 RANKING",
    "board.hint": "ordenado por puja · reset cada 30 días",
    "board.note": 'Las filas marcadas <span class="badge-you">TÚ</span> son pujas de demo que añadiste tú en este navegador. Se borran al reset.',
    "side.legal": " ESTADO LEGAL",
    "side.legal.body": "RankLOL en modo <b>demo</b> no cobra, no reparte premios y no requiere licencia de juego en España. Pagas por aparecer más arriba. La versión con cobros reales saldrá cuando valides tráfico suficiente. Lee <a href=\"aviso-legal.html\">aviso-legal.html</a>.",
    "side.trend": "🔥 TRENDING",
    "side.act": "⚡ ACTIVIDAD",
    "side.steps": "💡 CÓMO FUNCIONA",
    "steps.1a": "1. Puja desde",
    "steps.2": "2. Tu dinero decide tu puesto.",
    "steps.3": "3. Si alguien puja más, bajas.",
    "steps.4a": "4. Reset cada",
    "steps.5": "5. Solo pagas por visibilidad. Sin premio, sin reparto.",
    "foot.left": "RankLOL — ranking pay-to-rank para apps indie & AI tools. Spanish/English.",
    "foot.legal": "aviso legal",
    "foot.terms": "términos",
    "modal.h2": "Sube en el ranking 🚀",
    "modal.muted": "Tu puja decide tu posición. Mínimo desde <b>$2</b>.",
    "modal.l1": "Nombre",
    "modal.l2": "URL",
    "modal.l3": "Descripción",
    "modal.l4": "Importe de la puja",
    "modal.cta": "REGISTRAR PUJA DEMO 💸",
    "modal.fine": "En la versión real esto sería un Stripe Checkout. En demo guardamos la puja en este navegador (<b>localStorage</b>) y se borra al reset de 30 días. <a href=\"aviso-legal.html\">Aviso legal</a>.",
    "toast.demo.ok": "Puja registrada · #",
    "toast.demo.err.fields": "Completa nombre y URL para registrar la puja",
    "toast.demo.err.name": "Ya pujaste con ese nombre y esa cantidad. Prueba otra cantidad o usa otro nombre."
  },
  en: {
    "meta.title": "RankLOL — the rank you buy",
    "meta.desc": "Bid to climb the indie/AI tools leaderboard. Outbid others and you rise. Resets every 30 days.",
    "warn.dot": "⚠️",
    "warn.text": "Demo mode. Bids aren't charged yet. We're validating demand before activating real payments.",
    "warn.link": "how it works",
    "stats.total": "POOL",
    "stats.bids": "BIDS",
    "cta.bid": "PLACE YOUR BID 💸",
    "hero.h1": 'THE RANK <span class="grad">YOU BUY</span>',
    "hero.sub": "Pay to climb the indie AI tools leaderboard. Outbidding others unlocks higher ranks. Resets every 30 days.",
    "bote.l1": "POOL",
    "bote.h1": "this month total",
    "bote.l2": "RESET",
    "bote.h2": "days left",
    "bote.l3": "MODE",
    "bote.v3": "DEMO",
    "bote.h3": "bids aren't charged",
    "board.h2": "🏆 RANKING",
    "board.hint": "sorted by bid · resets every 30 days",
    "board.note": 'Rows tagged <span class="badge-you">YOU</span> are demo bids you added in this browser. They clear at reset.',
    "side.legal": " LEGAL STATUS",
    "side.legal.body": "RankLOL in <b>demo mode</b> charges nothing, awards no prize and doesn't require a Spanish gambling licence. You pay for higher visibility. Full payments plus Stripe Checkout will go live once demand is validated. Read <a href=\"aviso-legal.html\">aviso-legal.html</a>.",
    "side.trend": "🔥 TRENDING",
    "side.act": "⚡ ACTIVITY",
    "side.steps": "💡 HOW IT WORKS",
    "steps.1a": "1. Bid from",
    "steps.2": "2. Your money decides your rank.",
    "steps.3": "3. If someone bids more, you drop.",
    "steps.4a": "4. Resets every",
    "steps.5": "5. You only pay for visibility. No prizes, no payouts.",
    "foot.left": "RankLOL — pay-to-rank leaderboard for indie apps & AI tools. Spanish/English.",
    "foot.legal": "legal notice",
    "foot.terms": "terms",
    "modal.h2": "Climb the ranking 🚀",
    "modal.muted": "Your bid decides your position. Minimum: <b>$2</b>.",
    "modal.l1": "Name",
    "modal.l2": "URL",
    "modal.l3": "Description",
    "modal.l4": "Bid amount",
    "modal.cta": "REGISTER DEMO BID 💸",
    "modal.fine": "In production this opens a Stripe Checkout. In demo we store your bid in this browser (<b>localStorage</b>) and clear it after the 30-day reset. <a href=\"aviso-legal.html\">Legal notice</a>.",
    "toast.demo.ok": "Bid registered · #",
    "toast.demo.err.fields": "Please enter both name and URL",
    "toast.demo.err.name": "You already bid this name at this amount. Try a different amount or name."
  }
};

(function(){
  // Auto-detect language first time
  if(!localStorage.getItem('ranklol.lang')){
    const nav = (navigator.language||'es').slice(0,2).toLowerCase();
    localStorage.setItem('ranklol.lang', nav==='en'?'en':'es');
  }
})();

window.setLang = function(lang){
  if(!window.I18N[lang]) lang='es';
  localStorage.setItem('ranklol.lang', lang);
  document.documentElement.lang = lang;
  const dict = window.I18N[lang];
  // Text content (incl. HTML con data-i18n)
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k = el.getAttribute('data-i18n');
    if(dict[k] !== undefined) el.innerHTML = dict[k];
  });
  // Atributos (placeholder, content...)
  document.querySelectorAll('[data-i18n-attr]').forEach(el=>{
    const attr = el.getAttribute('data-i18n-attr');
    const k = el.getAttribute('data-i18n');
    if(attr && dict[k] !== undefined) el.setAttribute(attr, dict[k]);
  });
  // Toggle UI
  document.querySelectorAll('.lang-btn').forEach(b=>{
    const on = b.getAttribute('data-lang')===lang;
    b.classList.toggle('on', on);
    b.setAttribute('aria-pressed', String(on));
  });
};

// Init after DOMContentLoaded
window.addEventListener('DOMContentLoaded', ()=>{
  setLang(localStorage.getItem('ranklol.lang')||'es');
  document.querySelectorAll('.lang-btn').forEach(b=>{
    b.addEventListener('click', ()=>setLang(b.getAttribute('data-lang')));
  });
});
