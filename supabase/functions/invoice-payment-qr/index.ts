import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { invoicePaymentUrl, isInvoicePayable } from "../_shared/invoice-payment.ts";
import { invoiceQrSvg } from "../_shared/invoice-qr.ts";

// The unguessable invoice token is the capability, as for billing-pdf.
Deno.serve(async (request: Request) => {
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
  const token = new URL(request.url).searchParams.get("token") || "";
  const paymentUrl = invoicePaymentUrl(token);
  if (!paymentUrl) return new Response("Invalid invoice token", { status: 400 });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const { data, error } = await admin.rpc("get_public_invoice", { p_token: token });
  if (error || !data || !isInvoicePayable(data)) return new Response("Invoice not payable", { status: 404 });
  return new Response(invoiceQrSvg(paymentUrl), { headers: {
    "content-type": "image/svg+xml",
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    "referrer-policy": "no-referrer",
  } });
});
