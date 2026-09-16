import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://vedantix.nl",
  "https://www.vedantix.nl",
]);

function cors(request: Request) {
  const origin = request.headers.get("Origin") ?? "";
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowedOrigins.has(origin) ? origin : "https://vedantix.nl",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "Origin",
    "cache-control": "no-store",
  };
}

function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors(request) });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("Origin") ?? "";
  const headers = cors(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: allowedOrigins.has(origin) ? 204 : 403, headers });
  }
  if (request.method !== "POST") return json(request, { error: "Method not allowed" }, 405);
  if (!allowedOrigins.has(origin)) return json(request, { error: "Origin not allowed" }, 403);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = request.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !serviceRole || !authHeader) {
    return json(request, { error: "Unauthorized" }, 401);
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: claims, error: claimsError } = await userClient.auth.getClaims(token);
  const userId = claims?.claims?.sub;
  if (claimsError || !userId) return json(request, { error: "Invalid session" }, 401);

  const { data: staff } = await userClient
    .from("staff_users")
    .select("role,active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  if (!staff || !["ADMIN", "OPERATOR"].includes(String(staff.role))) {
    return json(request, { error: "Staff role required" }, 403);
  }

  let body: { days?: number } = {};
  try {
    body = await request.json();
  } catch {
    return json(request, { error: "Invalid JSON" }, 400);
  }
  const days = Math.max(1, Math.min(365, Math.trunc(Number(body.days ?? 30) || 30)));

  const admin = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.rpc("get_audit_funnel_stats", { p_days: days });
  if (error) {
    console.error("audit-funnel-stats failed", { code: error.code });
    return json(request, { error: "Stats unavailable" }, 500);
  }

  return json(request, data, 200);
});
