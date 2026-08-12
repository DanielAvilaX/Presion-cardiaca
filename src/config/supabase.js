import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function loadConfig() {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error("config endpoint unavailable");
    return await res.json();
  } catch {
    return { url: "", anonKey: "" };
  }
}

const { url, anonKey } = await loadConfig();

if (!url || !anonKey) {
  console.error(
    "Supabase no está configurado: faltan SUPABASE_URL / SUPABASE_ANON_KEY en el entorno (revisa /api/config)."
  );
}

// La anon key de Supabase es pública por diseño; la seguridad real la dan
// las políticas RLS, no mantenerla en secreto. Aun así, la URL y la key
// viven en variables de entorno de Vercel (no en el repo) para poder rotar
// de proyecto de Supabase sin tocar código. createClient exige una URL/key
// con formato válido, así que usamos un placeholder si aún no están
// configuradas — las llamadas a la API simplemente fallarán hasta entonces.
export const supabase = createClient(url || "https://placeholder.supabase.co", anonKey || "placeholder", {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
