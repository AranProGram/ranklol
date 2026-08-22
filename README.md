# RankLOL v4 — pay-to-rank bilingüe + realtime

> Cambios en v4:
> - **"Cómo funciona"** ahora es la primera sección visible bajo el hero.
> - **Sincronización realtime** entre navegadores vía Supabase Realtime (plan gratuito).
> - **Actividad en tiempo real** con timestamps reales calculados con `Date.now()`.
> - **Gramática y mayúsculas** revisadas en todo el copy bilingüe.
> - **Páginas legales reales** enlazadas: Cómo funciona, Contacto, Términos, Acuerdo de usuario, Aviso legal, Privacidad, Cookies.
> - **Empresas seed genéricas** ("Empresa demo 1"…) sin marcas reales.

## Estructura

```
ranklol-v4/
├─ config.js                 ← editable por ti (datos del operador, claves Supabase)
├─ index.html                ← home con ¿Cómo funciona? primero
├─ como-funciona.html        ← guía completa
├─ contacto.html             ← formulario + datos del operador
├─ terminos.html             ← términos de uso
├─ acuerdo-usuario.html      ← derechos y obligaciones del pujador
├─ aviso-legal.html          ← identificación del titular
├─ politica-privacidad.html  ← RGPD
├─ politica-cookies.html     ← cookies y localStorage
├─ assets/
│   ├─ styles.css
│   ├─ seed.js               ← 12 entradas genéricas tipo Empresa demo
│   ├─ i18n.js               ← ES/EN
│   ├─ realtime.js           ← capa Supabase + fallback localStorage
│   └─ app.js                ← ranking, feed, modal
├─ package.json
└─ vercel.json
```

## Cómo correr en local (VS Code + Live Server)

1. Descomprime este ZIP.
2. Abre la carpeta en VS Code.
3. Instala la extensión **Live Server** (Ritwick Dey).
4. Click derecho sobre `index.html` → **Open with Live Server**.
5. Tu pareja puede abrir la **misma URL** desde su navegador y el ranking por ahora se ve duplicado (cada navegador ve sus propias pujas de localStorage). Para que se vean mutuamente, sigue los pasos de Supabase de abajo.

## Cómo activar sincronización realtime (Supabase)

### Por qué hace falta
Live Share de VS Code y Live Server sólo comparten el **editor**, no los datos del navegador. Cada navegador tiene su propio `localStorage`. Para que las pujas se vean en tiempo real entre dispositivos hay que usar un backend. Supabase Realtime es gratuito: 500 MB de base de datos y hasta 200 conexiones concurrentes en el plan Free (verificado en [supabase.com/pricing](https://supabase.com/pricing) y el [kit oficial 2026](https://www.metacto.com/blogs/the-true-cost-of-supabase-a-comprehensive-guide-to-pricing-integration-and-maintenance)).

### Pasos

1. Crea una cuenta gratuita en [supabase.com/dashboard](https://supabase.com/dashboard) (GitHub OAuth también válido).
2. **New project** → elige región cercana a tu público (Frankfurt para Europa por ejemplo).
3. Espera ~2 min mientras se aprovisiona el proyecto.
4. En **SQL Editor**, pega y ejecuta este script:

   ```sql
   create table public.bids (
     id bigserial primary key,
     created_at timestamp with time zone default now(),
     name text not null,
     url text not null,
     description text,
     bid integer not null check (bid >= 2)
   );

   alter publication supabase_realtime add table public.bids;

   -- Habilita Row Level Security sólo si quieres controlar acceso en el futuro
   alter table public.bids enable row level security;

   create policy "Public read" on public.bids for select using (true);
   create policy "Public insert" on public.bids for insert with check (true);
   ```

5. En **Settings → API**, copia dos cosas:
   - **Project URL** (algo como `https://abcdxyz.supabase.co`)
   - **anon public** key (la key pública, NO la `service_role`)
6. Abre `config.js` con VS Code y pega los dos valores:

   ```js
   SUPABASE_URL: "https://abcdxyz.supabase.co",
   SUPABASE_ANON_KEY: "eyJhbGciOi...",
   ```

7. Recarga tu página. El banner amarillo desaparecerá (se mantiene porque el modo DEMO sigue activo para que no se cobren cobros todavía, pero ahora las pujas se sincronizan).

### Cómo verificar que funciona entre dos navegadores

1. Abre la web en tu navegador y en el de tu pareja (o un segundo navegador en ventana privada).
2. Pulsa **Pujar ahora** desde uno y registra una puja.
3. En menos de un segundo, la otra ventana debería mostrar la entrada nueva, sin recargar. La pestaña **Actividad reciente (tiempo real)** también la mostrará.
4. Abre la consola del navegador. Verás el canal `bids-realtime` subscrito si todo va bien.

## Personalización de datos del operador

Abre `config.js` y edita los campos:

```js
OPERATOR_NAME: "[TU NOMBRE O RAZÓN SOCIAL]",
OPERATOR_CIF: "[TU NIF/CIF]",
OPERATOR_ADDRESS: "[Tu dirección completa]",
OPERATOR_EMAIL: "tu-correo@dominio.com",
OPERATOR_PHONE: "+34 600000000",
OPERATOR_TWITTER: "@tu-cuenta",
OPERATOR_LINKEDIN: "https://www.linkedin.com/in/tu-perfil",
```

Estos valores se inyectan automáticamente en la página de [contacto](contacto.html), en el tabla del [aviso legal](aviso-legal.html) y en los mailto de los formularios.

## Activar cobros reales con Stripe (cuando llegue el momento)

Esta versión está diseñada para que la migración a Stripe Checkout sea de una tarde. Cuando quieras dar el paso:

1. Crea cuenta en [dashboard.stripe.com](https://dashboard.stripe.com/register).
2. Verifica tu identidad y banco.
3. En `api/checkout.js` (mira la v2 del proyecto) conecta Stripe Checkout.
4. Cuando pulses "Pujar" en producción, la web te lleva a Stripe Checkout, el webhook `/api/webhook` confirma el pago y crea la entrada en Supabase.

Antes de activar cobros reales, lee el [aviso legal](aviso-legal.html) y valida todo con un asesor fiscal local.

## Despliegue en Vercel (gratis)

```bash
cd ranklol-v4
npm i -g vercel
vercel login
vercel --prod
```

Vercel detecta el HTML raíz automáticamente. Plan Hobby gratis según [vercel.com/pricing](https://vercel.com/pricing) y [Vercel Hobby Limits 2026](https://vercel.com/docs/plans/hobby): 100 GB transferencia + 1 M invocaciones/mes.

## Última revisión
Agosto 2026.
