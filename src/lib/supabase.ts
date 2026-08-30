import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  import.meta.env['VITE_SUPABASE_URL'] || "https://zxnexwqvoznmirajhgxj.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
  "sb_publishable_QlxkbMaJ9IEBAPr9y0d1HQ_xh8Z6oEu";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
