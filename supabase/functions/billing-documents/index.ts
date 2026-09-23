import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { createDocumentsHandler } from "./handler.ts";

// Custom authentication verifies the user and staff role; all data reads retain
// the caller's JWT and RLS. The published terms PDF is intentionally public.
Deno.serve(createDocumentsHandler(authorization=>createClient(
  Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,
  {global:{headers:{Authorization:authorization}},auth:{persistSession:false}},
)));
