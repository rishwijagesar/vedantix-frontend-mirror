import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

function mappedStatus(status: string) {
  const value = status.toLowerCase();
  if (value === "paid") return "PAID";
  if (value === "pending") return "PENDING";
  if (value === "authorized") return "AUTHORIZED";
  if (value === "failed") return "FAILED";
  if (value === "canceled") return "CANCELED";
  if (value === "expired") return "EXPIRED";
  return "OPEN";
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") return new Response(JSON.stringify({ ok: true }), { status: 200, headers: jsonHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return new Response(JSON.stringify({ error: "Server configuration missing" }), { status: 500, headers: jsonHeaders });
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const contentType = request.headers.get("content-type") || "";
  let paymentId = "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const form = await request.formData();
    paymentId = String(form.get("id") || "").trim();
  } else {
    try {
      const body = await request.json();
      paymentId = String(body?.id || body?.resource?.id || "").trim();
    } catch { /* ignore malformed payload */ }
  }
  if (!/^tr_[A-Za-z0-9]+$/.test(paymentId)) return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200, headers: jsonHeaders });

  const { data: apiKey } = await admin.rpc("get_mollie_api_key");
  if (!apiKey) return new Response(JSON.stringify({ error: "Provider credentials missing" }), { status: 503, headers: jsonHeaders });

  const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
  });
  if (!mollieResponse.ok) return new Response(JSON.stringify({ ok: false, error: "Could not verify payment" }), { status: 502, headers: jsonHeaders });
  const mollie = await mollieResponse.json();

  const { data: row } = await admin
    .from("payment_requests")
    .select("id,invoice_id,amount,currency,provider_payment_id,status,metadata")
    .eq("provider_payment_id", paymentId)
    .maybeSingle();
  if (!row) return new Response(JSON.stringify({ ok: true, ignored: true }), { status: 200, headers: jsonHeaders });

  const metadata = mollie?.metadata || {};
  if (String(metadata.payment_request_id || "") !== row.id || String(metadata.invoice_id || "") !== row.invoice_id) {
    return new Response(JSON.stringify({ ok: false, error: "Payment metadata mismatch" }), { status: 409, headers: jsonHeaders });
  }

  const providerAmount = Number(mollie?.amount?.value || 0);
  const providerCurrency = String(mollie?.amount?.currency || "");
  if (providerCurrency !== row.currency || Math.abs(providerAmount - Number(row.amount)) > 0.009) {
    return new Response(JSON.stringify({ ok: false, error: "Payment amount mismatch" }), { status: 409, headers: jsonHeaders });
  }

  const status = mappedStatus(String(mollie.status || "open"));
  await admin.from("payment_requests").update({
    status,
    webhook_received_at: new Date().toISOString(),
    provider_paid_at: mollie.paidAt || null,
    metadata: {
      ...(row.metadata && typeof row.metadata === "object" ? row.metadata : {}),
      mollie_mode: mollie.mode || null,
      method: mollie.method || null,
    },
  }).eq("id", row.id);

  if (status === "PAID") {
    const { error } = await admin.rpc("register_mollie_payment_system", {
      p_payment_request_id: row.id,
      p_provider_payment_id: paymentId,
      p_amount: providerAmount,
      p_paid_at: mollie.paidAt || new Date().toISOString(),
    });
    if (error) return new Response(JSON.stringify({ ok: false, error: "Ledger registration failed" }), { status: 500, headers: jsonHeaders });
  }

  return new Response(JSON.stringify({ ok: true, payment_id: paymentId, status }), { status: 200, headers: jsonHeaders });
});
