import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://vedantix-migration-test.lovable.app",
  "https://vedantix-control-center-test.lovable.app",
  "https://admin.vedantix.nl",
]);

function responseHeaders(request: Request) {
  const origin = request.headers.get("Origin");
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : "https://vedantix-control-center-test.lovable.app";
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

Deno.serve(async (request: Request) => {
  const headers = responseHeaders(request);
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return new Response(null, { status: 403, headers });
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  if (!origin || !allowedOrigins.has(origin)) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers });

  let body: { email?: string } = {};
  try { body = await request.json(); } catch { /* generic response below */ }
  const email = body.email?.trim().toLowerCase() ?? "";

  const generic = () => new Response(
    JSON.stringify({ ok: true, message: "Als dit e-mailadres geautoriseerd is, ontvang je een beveiligde inloglink." }),
    { status: 200, headers },
  );

  if (!email || !email.includes("@")) return generic();

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceRole) {
    console.error("admin-magic-link missing Supabase environment variables");
    return new Response(JSON.stringify({ error: "Server configuration missing" }), { status: 500, headers });
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: allowed, error: guardError } = await admin.rpc("can_request_admin_login", { p_email: email });
  if (guardError) {
    console.error("admin login guard failed", guardError.message);
    return new Response(JSON.stringify({ error: "Login service unavailable" }), { status: 503, headers });
  }

  if (allowed !== true) return generic();

  const authClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
  const { error: otpError } = await authClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/admin`,
      shouldCreateUser: true,
    },
  });

  if (otpError) {
    console.error("admin magic link send failed", otpError.message);
    return new Response(JSON.stringify({ error: "Login service unavailable" }), { status: 503, headers });
  }

  return generic();
});
