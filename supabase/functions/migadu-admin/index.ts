import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { createMailHandler } from "./handler.ts";
Deno.serve(createMailHandler(
  authorization => createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_ANON_KEY")!,{
    global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false},
  }),
  () => createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,{
    auth:{persistSession:false,autoRefreshToken:false},
  }),
));
