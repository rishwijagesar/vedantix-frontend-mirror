import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { createEboekhoudenHandler } from "./handler.ts";

// JWTs are verified using getUser(), followed by the existing ADMIN role check.
// Never return the service key, Vault token or upstream session in a response.
const admin=()=>createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } });
const handler=createEboekhoudenHandler(
  authorization => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authorization } }, auth: { persistSession: false, autoRefreshToken: false } }),
  () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false, autoRefreshToken: false } }),
);

import { processSync, rpc } from "./sync.ts";
Deno.serve(async request => {
  const secret=request.headers.get("x-vedantix-worker");
  if (secret!==null) {
    if(request.method!=="POST" || secret.length!==64) return new Response(null,{status:401});
    const db=admin();
    try {
      if(await rpc(db,"worker_auth",null,{secret})!==true) return new Response(null,{status:401});
      await processSync(db,{action:"worker"},null);
      return Response.json({ok:true});
    } catch { return Response.json({error:"Verwerking vraagt om controle."},{status:503}); }
  }
  return handler(request);
});
