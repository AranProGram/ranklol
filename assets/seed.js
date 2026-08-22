// seed.js — entradas iniciales neutrales, sin marcas reales.
// Para una demo relajada las fechas se construyen en tiempo real
// (Date.now() hacia atrás) y se muestran correctamente con relativeTime.

(function(){
  const now = Date.now();
  const m = (mins) => new Date(now - mins * 60000).toISOString();
  const d = (days)  => new Date(now - days * 86400000).toISOString();
  const h = (hours) => new Date(now - hours * 3600000).toISOString();
  window.SEED = [
    {id:'seed-1', name:'Empresa demo 1', url:'https://example.com/demo-1',   description:'SaaS genérico (placeholder personalizable).', bid: 280, clicks: 1840, created_at: h(1) },
    {id:'seed-2', name:'Empresa demo 2', url:'https://example.com/demo-2',   description:'Herramienta IA (placeholder).',               bid: 175, clicks: 920,  created_at: h(3) },
    {id:'seed-3', name:'Empresa demo 3', url:'https://example.com/demo-3',   description:'Workflow No-Code (placeholder).',            bid: 120, clicks: 610,  created_at: h(8) },
    {id:'seed-4', name:'Empresa demo 4', url:'https://example.com/demo-4',   description:'Dev tool (placeholder).',                    bid:  90, clicks: 480,  created_at: d(1) },
    {id:'seed-5', name:'Empresa demo 5', url:'https://example.com/demo-5',   description:'Marketplace LATAM (placeholder).',            bid:  75, clicks: 350,  created_at: d(2) },
    {id:'seed-6', name:'Empresa demo 6', url:'https://example.com/demo-6',   description:'Productividad (placeholder).',                 bid:  60, clicks: 280,  created_at: d(3) },
    {id:'seed-7', name:'Empresa demo 7', url:'https://example.com/demo-7',   description:'Editor AI (placeholder).',                     bid:  55, clicks: 265,  created_at: d(4) },
    {id:'seed-8', name:'Empresa demo 8', url:'https://example.com/demo-8',   description:'Notas & tareas (placeholder).',                bid:  45, clicks: 190,  created_at: d(5) },
    {id:'seed-9', name:'Empresa demo 9', url:'https://example.com/demo-9',   description:'PDF y datos (placeholder).',                   bid:  40, clicks: 140,  created_at: d(6) },
    {id:'seed-10',name:'Empresa demo 10',url:'https://example.com/demo-10',  description:'CRM minimalista (placeholder).',               bid:  30, clicks:  88,  created_at: d(8) },
    {id:'seed-11',name:'Empresa demo 11',url:'https://example.com/demo-11',  description:'Automation cron (placeholder).',                bid:  25, clicks:  60,  created_at: d(11) },
    {id:'seed-12',name:'Empresa demo 12',url:'https://example.com/demo-12',  description:'Markdown hosting (placeholder).',              bid:  20, clicks:  40,  created_at: d(15) }
  ];
})();
