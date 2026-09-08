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

function amountValue(value: number) {
  return Math.max(0, Math.round(value * 100) / 100).toFixed(2);
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
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return new Response(JSON.stringify({ error: "Server configuration missing" }), { status: 500, headers });
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  let body: { action?: "status" | "create"; token?: string } = {};
  try { body = await request.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers }); }
  const publicToken = String(body.token || "").trim();
  if (!/^[0-9a-f-]{36}$/i.test(publicToken)) return new Response(JSON.stringify({ error: "Invalid invoice token" }), { status: 400, headers });

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .select("id,invoice_number,status,total_incl_vat,amount_paid,public_token")
    .eq("public_token", publicToken)
    .maybeSingle();
  if (invoiceError || !invoice || !invoice.invoice_number) return new Response(JSON.stringify({ error: "Invoice not found" }), { status: 404, headers });

  const outstanding = Math.max(0, Number(invoice.total_incl_vat || 0) - Number(invoice.amount_paid || 0));
  const eligible = ["SENT", "PARTIALLY_PAID", "OVERDUE"].includes(String(invoice.status)) && outstanding > 0.009;
  const { data: config } = await admin.from("payment_provider_config").select("enabled,mode,credentials_configured").eq("id", true).maybeSingle();
  const available = Boolean(config?.enabled && config?.credentials_configured && eligible);

  if (body.action === "status") {
    return new Response(JSON.stringify({ ok: true, available, mode: config?.mode || "TEST", outstanding: amountValue(outstanding) }), { status: 200, headers });
  }
  if (!available) return new Response(JSON.stringify({ error: "Online betalen is momenteel niet beschikbaar." }), { status: 409, headers });

  const { data: existing } = await admin
    .from("payment_requests")
    .select("id,checkout_url,provider_payment_id,status,amount")
    .eq("invoice_id", invoice.id)
    .in("status", ["OPEN", "PENDING", "AUTHORIZED"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing && existing.checkout_url && Math.abs(Number(existing.amount) - outstanding) < 0.01) {
    return new Response(JSON.stringify({ ok: true, reused: true, payment_request_id: existing.id, checkout_url: existing.checkout_url, status: existing.status }), { status: 200, headers });
  }

  const redirectOrigin = origin && allowedOrigins.has(origin) ? origin : "https://vedantix.nl";
  const redirectUrl = `${redirectOrigin}/factuur/${publicToken}?payment=return`;
  const webhookUrl = `${supabaseUrl}/functions/v1/mollie-webhook`;

  const { data: requestRow, error: insertError } = await admin
    .from("payment_requests")
    .insert({
      invoice_id: invoice.id,
      provider: "MOLLIE",
      amount: Number(amountValue(outstanding)),
      currency: "EUR",
      status: "CREATING",
      redirect_url: redirectUrl,
      metadata: { invoice_number: invoice.invoice_number },
    })
    .select("id")
    .single();
  if (insertError || !requestRow) return new Response(JSON.stringify({ error: "Payment request could not be created" }), { status: 500, headers });

  const { data: apiKey, error: keyError } = await admin.rpc("get_mollie_api_key");
  if (keyError || !apiKey) {
    await admin.from("payment_requests").update({ status: "FAILED", metadata: { error: "provider_credentials_missing" } }).eq("id", requestRow.id);
    return new Response(JSON.stringify({ error: "Payment provider is not configured" }), { status: 503, headers });
  }

  const mollieResponse = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      amount: { currency: "EUR", value: amountValue(outstanding) },
      description: `Factuur ${invoice.invoice_number} - Vedantix`,
      redirectUrl,
      webhookUrl,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        payment_request_id: requestRow.id,
      },
    }),
  });
  const mollie = await mollieResponse.json().catch(() => ({}));

  if (!mollieResponse.ok || !mollie?.id || !mollie?._links?.checkout?.href) {
    await admin.from("payment_requests").update({ status: "FAILED", metadata: { error: mollie?.detail || mollie?.title || "mollie_create_failed" } }).eq("id", requestRow.id);
    return new Response(JSON.stringify({ error: "Mollie payment could not be created" }), { status: 502, headers });
  }

  const mappedStatus = ["open", "pending", "authorized"].includes(String(mollie.status)) ? String(mollie.status).toUpperCase() : "OPEN";
  await admin.from("payment_requests").update({
    provider_payment_id: mollie.id,
    status: mappedStatus,
    checkout_url: mollie._links.checkout.href,
    provider_created_at: mollie.createdAt || null,
    metadata: { invoice_number: invoice.invoice_number, mollie_mode: mollie.mode || config?.mode || "TEST" },
  }).eq("id", requestRow.id);

  return new Response(JSON.stringify({ ok: true, reused: false, payment_request_id: requestRow.id, checkout_url: mollie._links.checkout.href, status: mappedStatus }), { status: 201, headers });
});
