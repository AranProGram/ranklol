# RankLOL v3 — pay-to-rank bilingüe para apps indie & AI

Modo demo (sin cobros reales). Pujas se guardan en `localStorage` y se borran cada 30 días.

## Stack
- HTML + CSS + JS puros, sin build
- i18n propio (`assets/i18n.js`)
- Persistencia demo: localStorage del navegador
- Hosting: Vercel Hobby (gratis)

## Cómo correrlo en local

```bash
npx serve .         # o "python3 -m http.server 8000"
# abre http://localhost:8000
```

## Cómo subir a Vercel

```bash
cd ranklol-v3
npm i -g vercel
vercel login
vercel --prod
```

Vercel detecta el `index.html` raíz automáticamente. No hay funciones serverless en esta versión.

## Futura activación de Stripe (cuando tengas tráfico)

1. Crear cuenta Stripe (DNI/NIE).
2. `STRIPE_SECRET_KEY` en Vercel → Settings → Environment Variables.
3. Sustituir `payDemo()` por un redirect a `/api/checkout` (lo tienes en la v2, `api/checkout.js`).
4. Webhook `/api/webhook` confirma pagos y actualiza el ranking.
5. Cuando valides tráfico, vuelve a hablar con un asesor fiscal.

## Vertical y copy

Marketing dirigido al público "indie builder" / "AI tool founder" — franja de founders de 22-35 años que presumen de su MRR y launches en X. El tono es neutral descriptivo (igual que outbid.lol).
