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
    vary: "Origin",
  };
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

  const { data: staff } = await userClient
    .from("staff_users")
    .select("role,active")
    .eq("user_id", userId)
    .eq("active", true)
    .maybeSingle();
  if (staff?.role !== "ADMIN") return new Response(JSON.stringify({ error: "Admin role required" }), { status: 403, headers });

  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });
  const { data: config } = await admin
    .from("payment_provider_config")
    .select("mode,credentials_configured")
    .eq("id", true)
    .maybeSingle();
  if (config?.mode !== "TEST" || !config?.credentials_configured) {
    return new Response(JSON.stringify({ error: "Mollie TEST credentials are required" }), { status: 409, headers });
  }

  const { data: apiKey, error: keyError } = await admin.rpc("get_mollie_api_key");
  if (keyError || !apiKey) return new Response(JSON.stringify({ error: "Mollie TEST key is unavailable" }), { status: 503, headers });

  const suffix = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const invoiceNumber = `TEST-MOLLIE-${suffix}`;
  const fixtureNote = "Internal Mollie TEST fixture. Do not send to a customer.";

  const { data: customer, error: customerError } = await admin
    .from("customers")
    .insert({
      company_name: "__VEDANTIX_MOLLIE_TEST__",
      contact_name: "Mollie Test",
      email: "info@vedantix.nl",
      status: "LEAD",
      notes: fixtureNote,
    })
    .select("id")
    .single();
  if (customerError || !customer) return new Response(JSON.stringify({ error: "Could not create test customer" }), { status: 500, headers });

  const { data: invoice, error: invoiceError } = await admin
    .from("invoices")
    .insert({
      customer_id: customer.id,
      invoice_number: invoiceNumber,
      status: "SENT",
      invoice_date: new Date().toISOString().slice(0, 10),
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      title: "Mollie testbetaling",
      notes: fixtureNote,
      subtotal_ex_vat: 1,
      total_ex_vat: 1,
      vat_total: 0,
      total_incl_vat: 1,
      amount_paid: 0,
      finalized_at: new Date().toISOString(),
      sent_at: new Date().toISOString(),
      company_snapshot: { company_name: "Vedantix" },
      customer_snapshot: { company_name: "__VEDANTIX_MOLLIE_TEST__", email: "info@vedantix.nl" },
    })
    .select("id,public_token,invoice_number")
    .single();
  if (invoiceError || !invoice) {
    await admin.from("customers").delete().eq("id", customer.id);
    return new Response(JSON.stringify({ error: "Could not create test invoice" }), { status: 500, headers });
  }

  const redirectOrigin = origin && allowedOrigins.has(origin) ? origin : "https://vedantix.nl";
  const redirectUrl = `${redirectOrigin}/admin?mollie_test=return`;
  const webhookUrl = `${supabaseUrl}/functions/v1/mollie-webhook`;

  const { data: paymentRequest, error: paymentRequestError } = await admin
    .from("payment_requests")
    .insert({
      invoice_id: invoice.id,
      provider: "MOLLIE",
      amount: 1,
      currency: "EUR",
      status: "CREATING",
      redirect_url: redirectUrl,
      metadata: { invoice_number: invoice.invoice_number, test_fixture: true },
    })
    .select("id")
    .single();
  if (paymentRequestError || !paymentRequest) {
    await admin.from("invoices").delete().eq("id", invoice.id);
    await admin.from("customers").delete().eq("id", customer.id);
    return new Response(JSON.stringify({ error: "Could not create test payment request" }), { status: 500, headers });
  }

  const mollieResponse = await fetch("https://api.mollie.com/v2/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      amount: { currency: "EUR", value: "1.00" },
      description: "Vedantix interne Mollie testbetaling",
      redirectUrl,
      webhookUrl,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        payment_request_id: paymentRequest.id,
        test_fixture: true,
      },
    }),
  });
  const mollie = await mollieResponse.json().catch(() => ({}));

  if (!mollieResponse.ok || !mollie?.id || !mollie?._links?.checkout?.href) {
    await admin.from("payment_requests").update({
      status: "FAILED",
      metadata: { test_fixture: true, error: mollie?.detail || mollie?.title || "mollie_create_failed" },
    }).eq("id", paymentRequest.id);
    return new Response(JSON.stringify({ error: "Mollie test payment could not be created" }), { status: 502, headers });
  }

  const mappedStatus = ["open", "pending", "authorized"].includes(String(mollie.status))
    ? String(mollie.status).toUpperCase()
    : "OPEN";

  await admin.from("payment_requests").update({
    provider_payment_id: mollie.id,
    status: mappedStatus,
    checkout_url: mollie._links.checkout.href,
    provider_created_at: mollie.createdAt || null,
    metadata: { invoice_number: invoice.invoice_number, mollie_mode: mollie.mode || "test", test_fixture: true },
  }).eq("id", paymentRequest.id);

  return new Response(JSON.stringify({
    ok: true,
    test: true,
    amount: "1.00",
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    payment_request_id: paymentRequest.id,
    checkout_url: mollie._links.checkout.href,
    status: mappedStatus,
  }), { status: 201, headers });
});
