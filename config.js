// config.js — editable por ti. Solo cambia valores entre comillas.
// Si SUPABASE_URL o SUPABASE_ANON_KEY quedan vacíos o son los placeholders,
// la web arranca en modo local (localStorage) sin sincronización.

window.RANKLOL_CONFIG = {
  // ----- Realtime (Supabase) -----
  // 1. Crea proyecto gratis en https://supabase.com (plan Free, 500 MB y 200 conexiones gratis).
  // 2. SQL Editor → pega este CREATE:
  //      create table public.bids (
  //        id bigserial primary key,
  //        created_at timestamp with time zone default now(),
  //        name text not null,
  //        url text not null,
  //        description text,
  //        bid integer not null check (bid >= 2)
  //      );
  //      alter publication supabase_realtime add table public.bids;
  // 3. Settings → API → copia "Project URL" y "anon public key".
  // 4. Pega esos valores aquí abajo.
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // ----- Datos de contacto y legales (edítalos con tus datos) -----
  OPERATOR_NAME: "[TU NOMBRE O RAZÓN SOCIAL]",
  OPERATOR_CIF: "[TU NIF/CIF]",
  OPERATOR_ADDRESS: "[Tu dirección completa]",
  OPERATOR_EMAIL: "tu-correo@dominio.com",
  OPERATOR_PHONE: "+34 600000000",
  OPERATOR_TWITTER: "@tu-cuenta",
  OPERATOR_LINKEDIN: "https://www.linkedin.com/in/tu-perfil",

  // ----- Modo de la página -----
  DEMO: true,                     // true = muestra advertencia amarilla arriba
  MIN_BID: 2,                     // puja mínima en USD
  PRESETS: [2, 5, 10, 25, 50, 100, 250, 500],
  RESET_DAYS: 30
};
