import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import { makePdf } from "./document.ts";

Deno.serve(async (request: Request) => {
  if (request.method !== "GET") return new Response("Method not allowed", { status: 405 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") as "quote" | "invoice" | null;
  const token = url.searchParams.get("token") || "";
  if (!kind || !["quote", "invoice"].includes(kind) || !/^[0-9a-f-]{36}$/i.test(token)) return new Response("Invalid request", { status: 400 });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRole) return new Response("Server configuration missing", { status: 500 });
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  const rpc = kind === "quote" ? "get_public_quote" : "get_public_invoice";
  const { data, error } = await admin.rpc(rpc, { p_token: token });
  if (error || !data) return new Response("Document not found", { status: 404 });

  const bytes = await makePdf(kind, data, token);
  const number = String((kind === "quote" ? data.quote_number : data.invoice_number) || "").replace(/[^A-Za-z0-9._-]/g, "-") || kind;
  return new Response(bytes, {
    status: 200,
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="Vedantix-${number}.pdf"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
});
