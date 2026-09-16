import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260916113000_sales_lead_pipeline.sql", "utf8");
const dataLayer = fs.readFileSync("src/admin/leads-data.ts", "utf8");
const route = fs.readFileSync("src/routes/admin_.leads.tsx", "utf8");
const page = fs.readFileSync("src/admin/LeadsPipeline.tsx", "utf8");
const adminRoute = fs.readFileSync("src/routes/admin.tsx", "utf8");

assert.match(migration, /create table if not exists public\.sales_leads/i);
assert.match(migration, /create table if not exists public\.sales_lead_activities/i);
assert.match(migration, /alter table public\.sales_leads enable row level security/i);
assert.match(migration, /alter table public\.sales_lead_activities enable row level security/i);
assert.match(migration, /public\.is_staff\(array\['ADMIN','OPERATOR'\]\)/);
assert.match(migration, /sales_leads_one_active_per_customer_idx/);
assert.match(migration, /online_growth_audit_sales_lead_sync/);
assert.match(migration, /upsert_sales_lead_from_audit/);
assert.match(migration, /compute_audit_lead_score/);
assert.match(migration, /update public\.customers set status = 'ACTIVE'/i);
assert.doesNotMatch(migration, /for insert to anon|for update to anon|for delete to anon/i);

assert.match(dataLayer, /createQuoteForLead/);
assert.match(dataLayer, /createQuote\(lead\.customer_id\)/);
assert.match(dataLayer, /latest_quote_id: quote\.id/);
assert.match(dataLayer, /stage: "QUOTE"/);
assert.match(dataLayer, /scheduleLeadFollowUp/);
assert.match(dataLayer, /markLeadContacted/);
assert.match(dataLayer, /createManualLead/);

assert.match(route, /<AdminAuthGate>/);
assert.match(route, /<LeadsPipeline/);
assert.match(route, /noindex, nofollow, noarchive/);
assert.match(page, /Online Groei Audits verschijnen automatisch als lead/);
assert.match(page, /Offerte maken/);
assert.match(page, /Contactmoment registreren/);
assert.match(page, /Opvolging/);
assert.match(adminRoute, /href="\/admin\/leads"/);

console.log("Lead pipeline regression checks passed.");
