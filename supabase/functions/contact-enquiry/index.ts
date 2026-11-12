import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://vedantix.nl",
  "https://www.vedantix.nl",
  "https://vedantix-migration-test.lovable.app",
]);
const MAX_PER_HOUR = 5;

function cors(request: Request) {
  const origin = request.headers.get("origin") || "";
  return {
    "access-control-allow-origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://vedantix.nl",
    "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    "vary": "origin",
  };
}
function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(request), "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
const clean = (value: unknown, max: number) => String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max);

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request) });
  if (request.method !== "POST") return json(request, { error: "Methode niet toegestaan." }, 405);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json(request, { error: "Ongeldig verzoek." }, 400); }

  // Honeypot: real visitors never fill this hidden field. Pretend success so bots learn nothing.
  if (clean(body.website, 200)) return json(request, { ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 254).toLowerCase();
  const message = clean(body.message, 4000);
  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return json(request, { error: "Vul je naam, een geldig e-mailadres en je bericht in." }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return json(request, { error: "Server niet beschikbaar." }, 500);
  const db = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const ipRaw = (request.headers.get("x-forwarded-for") || request.headers.get("cf-connecting-ip") || "").split(",")[0].trim();
  const ip = ipRaw && /^[0-9a-f:.]+$/i.test(ipRaw) ? ipRaw : null;
  if (ip) {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await db.from("contact_enquiries").select("id", { count: "exact", head: true }).eq("requester_ip", ip).gte("created_at", since);
    if ((count ?? 0) >= MAX_PER_HOUR) return json(request, { error: "Te veel aanvragen. Probeer het later opnieuw of stuur een WhatsApp-bericht." }, 429);
  }

  const { error } = await db.from("contact_enquiries").insert({
    name,
    company_name: clean(body.companyName, 160) || null,
    email,
    phone: clean(body.phone, 40) || null,
    help_type: clean(body.helpType, 120) || null,
    message,
    source_path: clean(body.sourcePath, 200) || null,
    requester_ip: ip,
    user_agent: clean(request.headers.get("user-agent"), 300) || null,
  });
  if (error) return json(request, { error: "Opslaan mislukt." }, 500);
  return json(request, { ok: true });
});
