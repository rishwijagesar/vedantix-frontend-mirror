import { test } from "node:test";
import assert from "node:assert/strict";
import { validateAccountMapping, verifyEboekhoudenToken } from "../supabase/functions/ebookhouden-admin/api.ts";
import { buildAccountingPreview } from "../supabase/functions/ebookhouden-admin/preview.ts";
import { createEboekhoudenHandler } from "../supabase/functions/ebookhouden-admin/handler.ts";

const ledgers = [{ id: 1, code: "1300", description: "Debiteuren", category: "DEB" }, { id: 2, code: "8000", description: "Omzet", category: "VW" }, { id: 3, code: "1100", description: "Bank", category: "FIN" }, { id: 4, code: "1150", description: "Mollie", category: "BAL" }];

test("connection verification only creates a session, reads ledgers and closes the session", async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = async (url: any, init: RequestInit) => {
    calls.push({ url: String(url), init });
    if (init.method === "POST") return Response.json({ token: "session-secret", expiresIn: 3600 });
    if (init.method === "DELETE") return new Response(null, { status: 204 });
    return Response.json({ items: ledgers, count: 4 });
  };
  assert.deepEqual(await verifyEboekhoudenToken("api-secret", fetcher as typeof fetch), ledgers);
  assert.equal(calls.length, 3);
  assert.deepEqual(JSON.parse(String(calls[0]!.init.body)), { accessToken: "api-secret", source: "Vedantix" });
  assert.equal((calls[1]!.init.headers as Record<string, string>).Authorization, "session-secret");
  assert.ok(calls.every(call => call.url.startsWith("https://api.e-boekhouden.nl/v1/") && call.init.redirect === "error"));
  assert.ok(calls.every(call => !call.url.includes("mutation") && !call.url.includes("relation")));
});

test("ledger pagination reads all pages and supports the documented alternate response casing", async () => {
  const page = Array.from({ length: 1000 }, (_, i) => ({ Id: i + 1, Code: String(i), Description: "Rekening", Category: "VW" }));
  const calls: string[] = [];
  const fetcher = async (url: any, init: RequestInit) => {
    calls.push(String(url));
    if (init.method === "POST") return Response.json({ Token: "session" });
    if (init.method === "DELETE") return new Response(null, { status: 204 });
    return Response.json({ Items: String(url).endsWith("offset=0") ? page : [] });
  };
  assert.equal((await verifyEboekhoudenToken("api", fetcher as typeof fetch)).length, 1000);
  assert.ok(calls.some(url => url.endsWith("offset=1000")));
});

test("upstream errors never reflect submitted credentials and failed reads still close sessions", async () => {
  let deleted = false;
  const fetcher = async (_url: any, init: RequestInit) => {
    if (init.method === "POST") return Response.json({ token: "session-secret" });
    if (init.method === "DELETE") { deleted = true; return new Response(null, { status: 204 }); }
    return new Response("Your token is api-secret", { status: 403 });
  };
  await assert.rejects(verifyEboekhoudenToken("api-secret", fetcher as typeof fetch), error => !String(error).includes("api-secret") && String(error).includes("Geen toegang"));
  assert.equal(deleted, true);
});

test("mapping validates live account IDs, category and distinct bank/clearing accounts", () => {
  assert.deepEqual(validateAccountMapping({ debtor: 1, revenue: 2, bank: 3, mollie: 4 }, ledgers), { debtor: 1, revenue: 2, bank: 3, mollie: 4 });
  assert.deepEqual(validateAccountMapping({ debtor: 1, revenue: 2 }, ledgers), { debtor: 1, revenue: 2, bank: null, mollie: null });
  assert.throws(() => validateAccountMapping({ debtor: 999, revenue: 2 }, ledgers));
  assert.throws(() => validateAccountMapping({ debtor: 2, revenue: 1 }, ledgers));
  assert.throws(() => validateAccountMapping({ debtor: 1, revenue: 2, bank: 3, mollie: 3 }, ledgers));
  assert.throws(() => validateAccountMapping({ debtor: "1", revenue: 2 }, ledgers));
});

test("preview excludes drafts, inactive records, test checkouts and voided payments", () => {
  const invoice = { id: "real", invoice_number: "FAC-2026-0002", title: "Website", status: "FINALIZED", is_active: true, total_incl_vat: 121, invoice_date: "2026-09-16" };
  const invoices = [invoice, { ...invoice, id: "draft", status: "DRAFT" }, { ...invoice, id: "inactive", is_active: false }, { ...invoice, id: "test-number", invoice_number: "TEST-MOLLIE-1" }, { ...invoice, id: "test-mode", invoice_number: "FAC-2026-9999" }];
  const payment = { id: "p1", invoice_id: "real", amount: 50, method: "BANK", voided_at: null, metadata: null };
  const result = buildAccountingPreview(invoices, [{ id: "c1", invoice_id: "real", credit_number: "CR-1", status: "FINALIZED", total_incl_vat: 12.1, credit_date: "2026-09-16" }], [payment, { ...payment, id: "void", voided_at: "2026-09-16" }, { ...payment, id: "test", metadata: { mollie_mode: "test" } }], [{ invoice_id: "test-mode", metadata: { mollie_mode: "test" } }]);
  assert.equal(result.invoices.length, 1); assert.equal(result.excluded_invoice_count, 4);
  assert.equal(result.payment_count, 1); assert.equal(result.payment_amount, 50);
  assert.equal(result.credits.length, 1); assert.equal(result.invoices[0]!.status, "NOT_SYNCED");
});

const makeRequest = (body: unknown, authorization = "Bearer user-jwt", origin = "https://vedantix.nl") => new Request("https://functions.example/ebookhouden-admin", { method: "POST", headers: { Authorization: authorization, Origin: origin }, body: JSON.stringify(body) });
const user = (staff: boolean, signedIn = true) => ({ auth: { getUser: async () => ({ data: { user: signedIn ? { id: "admin-id" } : null }, error: null }) }, rpc: async () => ({ data: staff, error: null }) });
const config = { connected: false, last_verified_at: null, mapping: {}, updated_at: "2026-09-16", connection_revision: "revision-a" };
const admin = (rpc: (...args: any[]) => Promise<any>) => ({ from: () => ({ select: () => ({ eq: () => ({ single: async () => ({ data: config, error: null }) }) }) }), rpc });

test("anonymous, expired and non-admin sessions cannot instantiate privileged database access", async () => {
  for (const [authorization, staff, signedIn, expected] of [["", true, true, 401], ["Bearer expired", true, false, 401], ["Bearer member", false, true, 403]] as const) {
    const handler = createEboekhoudenHandler(() => user(staff, signedIn), () => { throw new Error("Service access must not happen"); });
    assert.equal((await handler(makeRequest({ action: "status" }, authorization))).status, expected);
  }
});

test("untrusted origins and unknown actions are denied before service operations", async () => {
  const handler = createEboekhoudenHandler(() => user(true), () => { throw new Error("Unexpected service access"); });
  assert.equal((await handler(makeRequest({ action: "status" }, "Bearer ok", "https://evil.example"))).status, 403);
  assert.equal((await handler(makeRequest({ action: "sync" }))).status, 400);
});

test("status does not read Vault and accurately reports sync unavailable", async () => {
  const handler = createEboekhoudenHandler(() => user(true), () => admin(async () => { throw new Error("Vault should not be accessed"); }));
  const response = await handler(makeRequest({ action: "status" }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.config.sync_enabled, false); assert.equal(body.config.stage, "TOKEN_REQUIRED");
  assert.equal(body.config.secret_id, undefined);
});

test("invalid API token cannot overwrite the stored working token", async () => {
  let saved = false;
  const handler = createEboekhoudenHandler(() => user(true), () => admin(async () => { saved = true; return { data: null }; }), async () => { throw new Error("Provider leaked api-secret"); });
  const response = await handler(makeRequest({ action: "connect", api_token: "api-secret" }));
  assert.equal(response.status, 500); assert.equal(saved, false);
  assert.doesNotMatch(await response.text(), /api-secret/);
});

test("successful connect verifies before persisting and never returns the token", async () => {
  const order: string[] = [];
  const handler = createEboekhoudenHandler(() => user(true), () => admin(async (name, args) => { order.push("save"); assert.equal(name, "ebookhouden_secret"); assert.equal(args.p_action, "save"); assert.equal(args.p_token, "api-secret"); return { data: null, error: null }; }), async token => { order.push("verify"); assert.equal(token, "api-secret"); return ledgers; });
  const response = await handler(makeRequest({ action: "connect", api_token: "api-secret" }));
  assert.equal(response.status, 200); assert.deepEqual(order, ["verify", "save"]);
  assert.doesNotMatch(await response.text(), /api-secret/);
});
