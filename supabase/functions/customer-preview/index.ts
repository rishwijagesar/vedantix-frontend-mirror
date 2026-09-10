import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://vedantix.nl",
  "https://vedantix-migration-test.lovable.app",
]);

function headersFor(request: Request) {
  const origin = request.headers.get("Origin");
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : "https://vedantix.nl";
  return {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "cache-control": "no-store",
    vary: "Origin",
  };
}

function validUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function validPreviewUrl(value: unknown) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" && Boolean(url.hostname) ? url.toString() : null;
  } catch {
    return null;
  }
}

Deno.serve(async (request: Request) => {
  const headers = headersFor(request);
  const origin = request.headers.get("Origin");

  if (request.method === "OPTIONS") {
    if (origin && !allowedOrigins.has(origin)) return new Response(null, { status: 403, headers });
    return new Response(null, { status: 204, headers });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }
  if (origin && !allowedOrigins.has(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), { status: 403, headers });
  }

  let body: { token?: string } = {};
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers });
  }

  const token = String(body.token || "").trim();
  if (!validUuid(token)) {
    return new Response(JSON.stringify({ error: "Preview link is ongeldig." }), { status: 400, headers });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) {
    return new Response(JSON.stringify({ error: "Server configuration missing" }), { status: 500, headers });
  }

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: link, error: linkError } = await admin
    .from("website_preview_links")
    .select("id,website_id,expires_at,revoked_at,open_count")
    .eq("public_token", token)
    .maybeSingle();

  if (linkError || !link) {
    return new Response(JSON.stringify({ error: "Preview link is niet beschikbaar." }), { status: 404, headers });
  }
  if (link.revoked_at) {
    return new Response(JSON.stringify({ error: "Deze previewlink is ingetrokken." }), { status: 410, headers });
  }
  if (new Date(link.expires_at).getTime() <= Date.now()) {
    return new Response(JSON.stringify({ error: "Deze previewlink is verlopen." }), { status: 410, headers });
  }

  const { data: website, error: websiteError } = await admin
    .from("websites")
    .select("id,name,preview_url,status,customer_id")
    .eq("id", link.website_id)
    .maybeSingle();
  if (websiteError || !website) {
    return new Response(JSON.stringify({ error: "Preview website is niet beschikbaar." }), { status: 404, headers });
  }

  const previewUrl = validPreviewUrl(website.preview_url);
  if (!previewUrl) {
    return new Response(JSON.stringify({ error: "Voor deze website is geen geldige preview ingesteld." }), { status: 409, headers });
  }

  const { data: customer } = await admin
    .from("customers")
    .select("company_name,contact_name")
    .eq("id", website.customer_id)
    .maybeSingle();

  await admin
    .from("website_preview_links")
    .update({
      last_opened_at: new Date().toISOString(),
      open_count: Number(link.open_count || 0) + 1,
    })
    .eq("id", link.id)
    .eq("public_token", token);

  return new Response(JSON.stringify({
    ok: true,
    website: {
      name: website.name,
      status: website.status,
      customer_name: customer?.company_name || customer?.contact_name || "Klant",
    },
    preview_url: previewUrl,
    expires_at: link.expires_at,
  }), { status: 200, headers });
});
