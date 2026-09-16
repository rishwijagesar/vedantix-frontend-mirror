import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://vedantix.nl",
  "https://www.vedantix.nl",
]);

const EVENTS = new Set([
  "PAGE_VIEW",
  "FORM_STARTED",
  "AUDIT_STARTED",
  "AUDIT_FAILED",
  "RESULT_VIEWED",
  "PDF_DOWNLOADED",
  "PLANNING_CLICK",
  "WHATSAPP_CLICK",
]);

const SMOKE_TEST = "SMOKE_TEST";
const MAX_BODY_BYTES = 128;
const encoder = new TextEncoder();

function response(status: number, origin = "") {
  const headers: Record<string, string> = {
    "cache-control": "no-store",
    "vary": "origin",
  };

  if (ALLOWED_ORIGINS.has(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-methods"] = "POST, OPTIONS";
    headers["access-control-allow-headers"] = "apikey, content-type";
  }

  return new Response(null, { status, headers });
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin") ?? "";
  if (!ALLOWED_ORIGINS.has(origin)) return response(403);

  if (request.method === "OPTIONS") return response(204, origin);
  if (request.method !== "POST") return response(405, origin);

  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return response(413, origin);
  }

  let payload: unknown;
  try {
    const rawBody = await request.text();
    if (encoder.encode(rawBody).byteLength > MAX_BODY_BYTES) return response(413, origin);
    payload = JSON.parse(rawBody);
  } catch {
    return response(400, origin);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return response(400, origin);
  }

  const body = payload as Record<string, unknown>;
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== "event") return response(400, origin);

  const event = typeof body.event === "string" ? body.event.trim().toUpperCase() : "";
  if (event !== SMOKE_TEST && !EVENTS.has(event)) return response(400, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return response(500, origin);

  const db = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (event === SMOKE_TEST) {
    const { error } = await db.from("audit_funnel_events").select("id").limit(1);
    if (error) {
      console.error("audit-funnel smoke failed", { code: error.code });
      return response(500, origin);
    }
    return response(204, origin);
  }

  const { error } = await db.from("audit_funnel_events").insert({ event });
  if (error) {
    console.error("audit-funnel insert failed", { code: error.code });
    return response(500, origin);
  }

  return response(204, origin);
});
