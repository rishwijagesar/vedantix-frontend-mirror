import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://vedantix-migration-test.lovable.app",
  "https://vedantix.nl",
]);

function headersFor(request: Request) {
  const origin = request.headers.get("Origin");
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : "https://vedantix-migration-test.lovable.app";
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "Origin",
  };
}

async function mollieRequest(apiKey: string, path: string) {
  return await fetch(`https://api.mollie.com/v2${path}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  const headers = headersFor(request);
  const origin = request.headers.get("Origin");
  if (request.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return new Response(null, { status: 403, headers });
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  if (origin && !allowedOrigins.has(origin)) return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = request.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRole || !authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } });
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers });

  const { data: staff } = await userClient.from("staff_users").select("role,active").eq("user_id", userId).eq("active", true).maybeSingle();
  if (staff?.role !== "ADMIN") return new Response(JSON.stringify({ error: "Admin role required" }), { status: 403, headers });

  let body: { action?: "save" | "test" | "status"; api_key?: string; mode?: "TEST" | "LIVE" } = {};
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers }); }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  if (body.action === "status") {
    const { data: configured } = await admin.rpc("has_mollie_api_key");
    const { data: config } = await admin.from("payment_provider_config").select("enabled,mode,credentials_configured").eq("id", true).single();
    return new Response(JSON.stringify({ ok: true, configured: Boolean(configured), config }), { status: 200, headers });
  }

  let apiKey = body.api_key?.trim() || "";
  let mode = (body.mode || "TEST").toUpperCase() as "TEST" | "LIVE";
  if (body.action === "test" && !apiKey) {
    const { data } = await admin.rpc("get_mollie_api_key");
    apiKey = String(data || "");
    const { data: config } = await admin.from("payment_provider_config").select("mode").eq("id", true).single();
    mode = (config?.mode || "TEST") as "TEST" | "LIVE";
  }
  if (!apiKey) return new Response(JSON.stringify({ error: "Mollie API key is required" }), { status: 400, headers });

  const profileResponse = await mollieRequest(apiKey, "/profiles/me");
  const profile = await profileResponse.json().catch(() => ({}));
  if (!profileResponse.ok) return new Response(JSON.stringify({ ok: false, authenticated: false, error: "Mollie API key kon niet worden geverifieerd." }), { status: 400, headers });

  const methodResponse = await mollieRequest(apiKey, "/methods?sequenceType=oneoff&locale=nl_NL");
  const methodPayload = await methodResponse.json().catch(() => ({}));
  const methods = Array.isArray(methodPayload?._embedded?.methods) ? methodPayload._embedded.methods.map((m: { id?: string; description?: string }) => ({ id: m.id, description: m.description })) : [];

  if (body.action === "save") {
    const { error } = await admin.rpc("store_mollie_api_key", { p_api_key: apiKey, p_mode: mode });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers });
  }

  return new Response(JSON.stringify({ ok: true, authenticated: true, mode, profile: { id: profile.id, name: profile.name, status: profile.status, website: profile.website }, methods }), { status: 200, headers });
});
