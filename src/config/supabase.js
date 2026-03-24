import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ENV } from "./env.js";

export const supabase = createClient(ENV.supabaseUrl, ENV.supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
