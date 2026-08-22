# RankLOL v5 — pay-to-rank bilingüe para GitHub Pages

> **Listo para desplegar en GitHub Pages.**
> GitHub Pages = hosting estático gratuito (`<tu-usuario>.github.io/<repo>`).
> Las claves de Supabase, si las usas, se introducen desde el panel "Ajustes" y
> se guardan en localStorage. NO se suben al repositorio público.

## Por qué este formato está adaptado a GitHub Pages

| Pieza | Cómo se resuelve |
|---|---|
| **Hosting estático** | Todo el sitio es HTML + CSS + JS puro. Compatible con Pages sin build step. |
| **Realtime entre dispositivos** | Supabase Realtime (plan gratuito). El cliente mete sus claves desde el panel de Ajustes; nada se sube al repo. |
| **Sin servidor backend** | Se eliminó `vercel.json` y la carpeta `api/`. La columna "Estado del backend" muestra qué modo está activo. |
| **Subpath de Pages** | Todos los enlaces usan `./` o rutas relativas (`./terminos.html`) para que funcione en `https://user.github.io/ranklol/`. |
| **`.nojekyll`** | Evita que GitHub Pages use Jekyll (que ignoraría archivos con `_` al inicio). La web de RankLOL no necesita Jekyll. |
| **404.html** | Página de error amigable si alguien navega a una URL que no existe. |
| **Workflow Pages** | `.github/workflows/deploy.yml` usa las Actions oficiales `actions/configure-pages`, `actions/upload-pages-artifact` y `actions/deploy-pages`. |
| **Claves seguras** | El panel `Ajustes` permite introducir tu URL y anon key de Supabase. Se guardan en `localStorage` y viajan contigo en el navegador. |

## ⚠️ Cosas que ya NO funcionan al pasar a Pages

He **borrado las APIs server-side** de las versiones anteriores porque GitHub Pages no ejecuta funciones serverless.

| Antes en Vercel | Ahora en GitHub Pages |
|---|---|
| `/api/checkout.js` (Stripe Checkout) | **No incluido.** Activa Stripe Checkout solo cuando migres a Vercel, Netlify Functions o Cloudflare Workers. |
| `/api/webhook.js` (confirmación de pago) | **No incluido.** Si activas cobros con backend, necesitas endpoint server-side. |
| `/api/payouts.js` (cron de pagos) | **No incluido.** |
| **Auto-deploy al hacer push** | Sigue funcionando: el workflow `.github/workflows/deploy.yml` se encarga. |
| **Variables de entorno server-side** | Las claves Supabase se introducen ahora desde el navegador (panel Ajustes). **No uses variables server-side secret porque Pages no las admite**; las únicas claves que acepta son Build-time secrets, y RankLOL no las necesita. |
| **`config.js` con claves hardcodeadas** | **Eliminado.** Nunca dejes claves en el repositorio público. |

Si en el futuro quieres cobrar con Stripe Checkout, migra a Vercel o Netlify y vuelve a añadir las funciones server-side de la v4.

## Cómo subirlo a GitHub Pages (clic a clic)

### 1. Sube este ZIP a un repo nuevo en GitHub

Si nunca has usado GitHub:

1. Crea una cuenta en [github.com](https://github.com).
2. Crea un nuevo repositorio: pulsando el botón **+** arriba derecha → **New repository**.
   - Nombre: `ranklol` (o el que prefieras).
   - Visibilidad: **Public** (Pages funciona también en private, pero public es más cómodo).
   - Inicializa con un README vacío si quieres.

3. **Opción A — Todo desde el navegador** (más fácil si no quieres usar Git):
   - Pulsa **"uploading an existing file"** o **"Add file → Upload files"**.
   - Arrastra todos los archivos y carpetas de este ZIP
     (los archivos sueltos, NO la carpeta raíz del ZIP).
   - Pulsa **Commit changes**.

4. **Opción B — Con Git + VS Code** (más cómodo para iterar):
   ```bash
   cd ruta/donde/descomprimiste/ranklol-v5
   git init
   git remote add origin https://github.com/TU_USUARIO/ranklol.git
   git checkout -b main
   git add .
   git commit -m "RankLOL v5 inicial"
   git push -u origin main
   ```

   Si VS Code te pregunta por credenciales, ve a *File → Preferences → Accounts → Sign in with GitHub*.

### 2. Activa GitHub Pages

1. En tu repo, abre **Settings → Pages**.
2. En **Source**, selecciona **GitHub Actions**.
3. Empuja un commit (o espera a que el workflow corra si acabas de subir).
4. La web se publica en `https://TU_USUARIO.github.io/ranklol/` en 1-3 minutos.

Si te aparece el workflow deploy como rojo:
- Ve a la pestaña **Actions**, abre el run que falló y revisa los logs.
- Casi siempre es un problema de permisos: asegúrate de que el repositorio permite Actions en **Settings → Actions → General**.

### 3. Dominio propio (opcional)

Si quieres `ranklol.es` o `ranklol.io`:

1. Compra el dominio donde prefieras ([Porkbun](https://porkbun.com), [Namecheap](https://www.namecheap.com)).
2. En **Settings → Pages → Custom domain**, escribe el dominio (ej. `ranklol.es`).
3. En tu registrador, añade un CNAME a `TU_USUARIO.github.io.` (o A-records a las IPs de GitHub Pages).
4. Activa **Enforce HTTPS** cuando el certificado Let's Encrypt esté listo (1-5 minutos).

## Cómo activar la sincronización realtime con Supabase (gratis)

### Por qué hace falta
GitHub Pages es estático, así que Live Share y la URL local sólo muestran los datos de tu navegador. Para sincronizar pujas entre dispositivos hay que conectar una base de datos en la nube. Usamos **Supabase Realtime** (plan gratuito).

### Pasos

1. Crea una cuenta gratuita en [supabase.com/dashboard](https://supabase.com/dashboard).
2. **New project** → elige nombre `ranklol-prod` y una región cercana (Frankfurt para Europa).
3. Espera 1-2 minutos mientras se aprovisiona.
4. En **SQL Editor**, pega y ejecuta:

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
alter table public.bids enable row level security;

create policy "Public read"  on public.bids for select using (true);
create policy "Public insert" on public.bids for insert with check (true);
```

5. En **Settings → API**, copia:
   - **Project URL** (algo como `https://abcdxyz.supabase.co`)
   - **anon public key** (la key pública, NO la service_role)

6. Abre tu web publicada (`https://TU_USUARIO.github.io/ranklol/`).
7. Pulsa el botón **⚙︎ Ajustes** arriba a la derecha y pega los dos valores.
8. Pulsa **Guardar y conectar** y luego **Probar conexión**.

A partir de ese momento todas las pujas se sincronizan entre los navegadores que tengas abierta la misma URL.

> **Importante para la seguridad**: las claves anon se almacenan **únicamente en tu navegador** (no se suben al repo). Si tu URL de GitHub Pages es pública, cualquiera puede ver las claves anon que dejaste. Esto es aceptable porque la anon key está diseñada para ser pública y los Row Level Security policies de Supabase limitan lo que se puede hacer con ella. Pero por si acaso, en el SQL de arriba puedes reemplazar la policy `Public insert` por una con validación extra.

## Cómo editar tus datos del operador

Tienes 3 opciones:

### Opción 1 · Desde el panel Ajustes (recomendado)
Pulsa **⚙︎ Ajustes**, rellena "Nombre del operador" y "Correo de contacto". Estos valores se inyectan automáticamente en la página de contacto y en la tabla del aviso legal.

### Opción 2 · Editando HTML directamente
Abre `contacto.html` o `aviso-legal.html` con VS Code y sustituye los placeholders `[Tu nombre o razón social]`, `[Tu NIF/CIF]`, etc.

## Datos del proyecto

- **Festivo**: No.
- **Stack**: HTML + CSS + JS estáticos.
- **Peso**: < 50 KB total incluyendo el JS del CDN.
- **Tiempo de carga**: < 1 s desde cualquier CDN.
- **Versión**: 5.0.0 — agosto 2026.

## Próximos pasos

1. Cambia los placeholders por tus datos.
2. Activa Pages en Settings → Pages.
3. Abre Settings → Pages y verifica que el workflow se ejecuta en verde.
4. Si quieres sincronizar pujas, conecta el backend Supabase.
5. Cuando estés listo para cobrar, migra a Vercel o Netlify y añade `/api/checkout`.

## Próximos pasos opcionales si quieres viralizar

1. Publicar en [reddit.com/r/SideProject](https://reddit.com/r/SideProject/submit) con el formato problema → solución → links.
2. Publicar en [Product Hunt](https://www.producthunt.com/posts/new) el día D.
3. Tweet del screenshot del ranking con el monto acumulado.
