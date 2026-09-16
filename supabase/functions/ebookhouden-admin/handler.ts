import { SetupError, validateAccountMapping, verifyEboekhoudenToken, type Ledger } from "./api.ts";
import { buildAccountingPreview } from "./preview.ts";

type Client = any;
const origins = new Set(["https://vedantix.nl", "https://vedantix-migration-test.lovable.app"]);
const safeColumns = "connected,last_verified_at,mapping,updated_at,connection_revision";

async function result(query: any) {
  const { data, error } = await query;
  if (error) throw new Error("Database operation failed");
  return data;
}
async function listAll(client: Client, table: string, columns: string) {
  const rows: any[] = [];
  for (let offset = 0; offset < 20000; offset += 500) {
    const page = await result(client.from(table).select(columns).order("id").range(offset, offset + 499));
    if (!Array.isArray(page)) throw new Error("Invalid database response");
    rows.push(...page);
    if (page.length < 500) return rows;
  }
  throw new SetupError("Het overzicht is te groot om volledig te laden.");
}

export function createEboekhoudenHandler(createUserClient: (authorization: string) => Client, createAdminClient: () => Client, verify: (token: string) => Promise<Ledger[]> = verifyEboekhoudenToken) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("Origin");
    const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Access-Control-Allow-Origin": origin && origins.has(origin) ? origin : "https://vedantix.nl", "Access-Control-Allow-Headers": "authorization,apikey,content-type,x-client-info", "Access-Control-Allow-Methods": "POST,OPTIONS", Vary: "Origin" };
    const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (origin && !origins.has(origin)) return reply({ error: "Origin niet toegestaan." }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply({ error: "Gebruik POST." }, 405);
    const authorization = request.headers.get("Authorization") || "";
    if (!/^Bearer\s+\S+$/i.test(authorization)) return reply({ error: "Log opnieuw in." }, 401);
    try {
      const userClient = createUserClient(authorization);
      const { data: auth, error: authError } = await userClient.auth.getUser();
      if (authError || !auth?.user?.id) return reply({ error: "Log opnieuw in." }, 401);
      const { data: staff, error: staffError } = await userClient.rpc("is_staff", { required_roles: ["ADMIN"] });
      if (staffError || staff !== true) return reply({ error: "Alleen een beheerder kan de boekhoudkoppeling beheren." }, 403);
      const bodyText = await request.text();
      if (bodyText.length > 12000) return reply({ error: "Verzoek te groot." }, 413);
      let body: Record<string, unknown>;
      try { body = JSON.parse(bodyText); } catch { return reply({ error: "Ongeldig verzoek." }, 400); }
      if (!body || typeof body !== "object" || !["status", "connect", "test", "save_mapping", "disconnect", "preview"].includes(String(body.action))) return reply({ error: "Onbekende actie." }, 400);
      // A service client is instantiated only after a verified JWT and ADMIN authorization.
      const admin = createAdminClient();
      const config = await result(admin.from("ebookhouden_config").select(safeColumns).eq("id", true).single());
      const publicConfig = (value: any) => ({ ...value, sync_enabled: false, stage: !value.connected ? "TOKEN_REQUIRED" : !value.mapping?.debtor || !value.mapping?.revenue ? "ACCOUNTS_REQUIRED" : "REVIEW_REQUIRED" });

      if (body.action === "status") return reply({ ok: true, config: publicConfig(config) });
      if (body.action === "preview") {
        // Reads preserve the caller's staff RLS; this action never contacts e-Boekhouden.
        const [invoices, credits, payments, requests] = await Promise.all([
          listAll(userClient, "invoices", "id,invoice_number,status,is_active,title,total_incl_vat,invoice_date"),
          listAll(userClient, "credit_notes", "id,invoice_id,credit_number,status,total_incl_vat,credit_date"),
          listAll(userClient, "invoice_payments", "id,invoice_id,amount,method,voided_at,metadata"),
          listAll(userClient, "payment_requests", "id,invoice_id,metadata"),
        ]);
        return reply({ ok: true, preview: buildAccountingPreview(invoices, credits, payments, requests), config: publicConfig(config) });
      }
      if (body.action === "disconnect") {
        await result(admin.rpc("ebookhouden_secret", { p_action: "delete", p_token: null }));
        return reply({ ok: true });
      }
      if (body.action === "connect") {
        if (typeof body.api_token !== "string" || !body.api_token.trim() || body.api_token.length > 4096) throw new SetupError("Vul een geldig API-token in.");
        const ledgers = await verify(body.api_token.trim());
        if (!ledgers.length) throw new SetupError("De verbinding werkt, maar er zijn nog geen boekhoudrekeningen. Richt eerst de administratie in e-Boekhouden in.");
        // Persist only a token that can read this administration; rotating it clears old mappings.
        await result(admin.rpc("ebookhouden_secret", { p_action: "save", p_token: body.api_token.trim() }));
        return reply({ ok: true, ledgers });
      }
      const token = await result(admin.rpc("ebookhouden_secret", { p_action: "read", p_token: null }));
      if (typeof token !== "string" || !token) throw new SetupError("Verbind eerst je e-Boekhouden-account.");
      const ledgers = await verify(token);
      if (body.action === "test") {
        await result(admin.from("ebookhouden_config").update({ last_verified_at: new Date().toISOString() }).eq("id", true).eq("connection_revision", config.connection_revision));
        return reply({ ok: true, ledgers });
      }
      const mapping = validateAccountMapping(body.mapping, ledgers);
      const changed = await result(admin.from("ebookhouden_config").update({ mapping, updated_at: new Date().toISOString(), last_verified_at: new Date().toISOString() }).eq("id", true).eq("connection_revision", config.connection_revision).eq("connected", true).select(safeColumns).maybeSingle());
      if (!changed) throw new SetupError("De verbinding is ondertussen gewijzigd. Laad de rekeningen opnieuw.");
      return reply({ ok: true, config: publicConfig(changed), ledgers });
    } catch (error) {
      return reply({ error: error instanceof SetupError ? error.message : "De boekhoudinstellingen konden niet worden verwerkt. Probeer opnieuw." }, error instanceof SetupError ? 400 : 500);
    }
  };
}
