import assert from "node:assert/strict";
import fs from "node:fs";

const clientSource = fs.readFileSync("src/lib/audit-funnel.js", "utf8");
assert.match(clientSource, /\/functions\/v1\/audit-funnel/);
assert.match(clientSource, /apikey:\s*SUPABASE_PUBLISHABLE_KEY/);
assert.match(clientSource, /credentials:\s*"omit"/);
assert.match(clientSource, /referrerPolicy:\s*"no-referrer"/);
assert.doesNotMatch(clientSource, /authorization\s*:/i);
assert.doesNotMatch(clientSource, /localStorage|sessionStorage|cookie/i);
assert.doesNotMatch(clientSource, /\/api\/funnel\/online-growth-audit/);

const functionSource = fs.readFileSync("supabase/functions/audit-funnel/index.ts", "utf8");
for (const eventName of [
  "PAGE_VIEW",
  "FORM_STARTED",
  "AUDIT_STARTED",
  "AUDIT_FAILED",
  "RESULT_VIEWED",
  "PDF_DOWNLOADED",
  "PLANNING_CLICK",
  "WHATSAPP_CLICK",
]) {
  assert.match(functionSource, new RegExp(`\\"${eventName}\\"`));
}
assert.match(functionSource, /"https:\/\/vedantix\.nl"/);
assert.match(functionSource, /"https:\/\/www\.vedantix\.nl"/);
assert.match(functionSource, /keys\.length !== 1 \|\| keys\[0\] !== "event"/);
assert.match(functionSource, /from\("audit_funnel_events"\)\.insert\(\{ event \}\)/);
assert.match(functionSource, /SMOKE_TEST/);
for (const forbidden of [
  /x-forwarded-for/i,
  /cf-connecting-ip/i,
  /user-agent/i,
  /referer/i,
  /cookie/i,
  /authorization/i,
]) {
  assert.doesNotMatch(functionSource, forbidden);
}

const migrationSource = fs.readFileSync("supabase/migrations/0046_audit_funnel_events.sql", "utf8");
assert.match(migrationSource, /event text not null check/i);
assert.match(migrationSource, /created_at timestamptz not null default now\(\)/i);
assert.match(migrationSource, /enable row level security/i);
assert.match(migrationSource, /revoke all on table public\.audit_funnel_events from anon, authenticated/i);
assert.doesNotMatch(migrationSource, /email|website_url|audit_id|session|user_agent|ip_address/i);

const serverSource = fs.readFileSync("src/server.ts", "utf8");
assert.doesNotMatch(serverSource, /\/api\/funnel\/online-growth-audit/);
assert.doesNotMatch(serverSource, /audit-funnel\.server/);

const trackerSource = fs.readFileSync("src/components/AuditFunnelTracker.jsx", "utf8");
for (const eventName of [
  "PAGE_VIEW",
  "FORM_STARTED",
  "AUDIT_FAILED",
  "RESULT_VIEWED",
  "PLANNING_CLICK",
  "WHATSAPP_CLICK",
]) {
  assert.match(trackerSource, new RegExp(eventName));
}

const apiSource = fs.readFileSync("src/api/onlineGrowthAudit.api.js", "utf8");
assert.match(apiSource, /AUDIT_STARTED/);
assert.match(apiSource, /PDF_DOWNLOADED/);

console.log("Supabase audit funnel privacy checks passed.");
