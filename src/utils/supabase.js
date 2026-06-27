import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;

export const supabase = createClient(url, import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabaseAdmin = createClient(url, import.meta.env.VITE_SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});