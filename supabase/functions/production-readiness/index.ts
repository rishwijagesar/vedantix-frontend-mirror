import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const STAGING_ORIGIN = "https://dhnczzdgsgc436kkidetyxg45u0zxukp.lambda-url.eu-west-1.on.aws";
const allowedOrigins = new Set([
  "https://vedantix-migration-test.lovable.app",
  STAGING_ORIGIN,
  "https://vedantix.nl",
]);
const LIVE_MARKER_URL = "https://vedantix.nl/.well-known/vedantix-release.json";
const STAGING_MARKER_URL = `${STAGING_ORIGIN}/.well-known/vedantix-release.json`;
const EXPECTED_MARKER = "VEDANTIX_AWS_SERVERLESS_COMMERCE_READY";
const EXPECTED_PLATFORM = "aws-lambda";

function headersFor(request: Request) {
  const origin = request.headers.get("Origin");
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : STAGING_ORIGIN;
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

async function readMarker(url: string) {
  try {
    const response = await fetch(url, {
      headers: { accept: "application/json" },
      redirect: "follow",
      cache: "no-store",
    });
    const payload = response.ok ? await response.json().catch(() => null) : null;
    return {
      ok: Boolean(
        response.ok &&
        payload?.release_marker === EXPECTED_MARKER &&
        payload?.platform === EXPECTED_PLATFORM
      ),
      http_status: response.status,
      marker: payload?.release_marker ?? null,
      platform: payload?.platform ?? null,
    };
  } catch (error) {
    return {
      ok: false,
      http_status: null,
      marker: null,
      platform: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
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
  if (!supabaseUrl || !anonKey || !serviceRole || !authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
  }

  const token = authHeader.replace(/^Bearer\s+/i, "");
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers });

  const { data: staff, error: staffError } = await userClient
    .from("staff_users")
    .select("role,active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  if (staffError || staff?.role !== "ADMIN") return new Response(JSON.stringify({ error: "Admin role required" }), { status: 403, headers });

  let body: { action?: "status" | "activate" | "deactivate" } = {};
  try { body = await request.json(); } catch { /* default status */ }
  const action = body.action || "status";

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const [live, staging] = await Promise.all([readMarker(LIVE_MARKER_URL), readMarker(STAGING_MARKER_URL)]);
  const checkedAt = new Date().toISOString();

  const { data: emailConfig } = await admin
    .from("billing_email_config")
    .select("delivery_enabled,reminders_enabled")
    .eq("id", true)
    .maybeSingle();
  const { data: paymentConfig } = await admin
    .from("payment_provider_config")
    .select("enabled,mode,credentials_configured")
    .eq("id", true)
    .maybeSingle();
  const { data: mollieKeyPresent } = await admin.rpc("has_mollie_api_key");

  const details = {
    live,
    staging,
    billing: emailConfig ?? null,
    mollie: paymentConfig ? { ...paymentConfig, key_present: Boolean(mollieKeyPresent) } : null,
  };

  await admin.from("commerce_production_activation").update({
    live_marker_ok: live.ok,
    staging_marker_ok: staging.ok,
    preview_marker_ok: staging.ok,
    last_checked_at: checkedAt,
    last_check_details: details,
  }).eq("id", true);

  if (action === "activate") {
    if (!live.ok || !staging.ok) {
      return new Response(JSON.stringify({
        ok: false,
        activated: false,
        error: !staging.ok
          ? "De AWS staging-release is nog niet gevalideerd."
          : "vedantix.nl draait nog niet op de gevalideerde AWS serverless-release.",
        ...details,
      }), { status: 409, headers });
    }

    await admin.from("billing_email_config").update({
      delivery_enabled: true,
      reminders_enabled: true,
      updated_at: checkedAt,
    }).eq("id", true);
    await admin.from("commerce_production_activation").update({
      activated_at: checkedAt,
      activated_by: userId,
      updated_at: checkedAt,
    }).eq("id", true);

    return new Response(JSON.stringify({
      ok: true,
      activated: true,
      billing_enabled: true,
      reminders_enabled: true,
      mollie_unchanged: true,
      ...details,
    }), { status: 200, headers });
  }

  if (action === "deactivate") {
    await admin.from("billing_email_config").update({
      delivery_enabled: false,
      reminders_enabled: false,
      updated_at: checkedAt,
    }).eq("id", true);
    return new Response(JSON.stringify({ ok: true, activated: false, billing_enabled: false, reminders_enabled: false, ...details }), { status: 200, headers });
  }

  return new Response(JSON.stringify({
    ok: true,
    ready_for_activation: live.ok && staging.ok,
    activated: Boolean(emailConfig?.delivery_enabled && emailConfig?.reminders_enabled),
    ...details,
  }), { status: 200, headers });
});
