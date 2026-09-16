import assert from "node:assert/strict";
import fs from "node:fs";

const functionSource = fs.readFileSync("supabase/functions/audit-funnel-stats/index.ts", "utf8");
assert.match(functionSource, /request\.headers\.get\("Authorization"\)/);
assert.match(functionSource, /auth\.getClaims\(token\)/);
assert.match(functionSource, /from\("staff_users"\)/);
assert.match(functionSource, /\["ADMIN", "OPERATOR"\]/);
assert.match(functionSource, /rpc\("get_audit_funnel_stats"/);
assert.doesNotMatch(functionSource, /from\("audit_funnel_events"\)\.select/);
assert.doesNotMatch(functionSource, /x-forwarded-for|user-agent|cookie|referer/i);

const migrationSource = fs.readFileSync("supabase/migrations/0047_audit_funnel_stats.sql", "utf8");
assert.match(migrationSource, /security definer/i);
assert.match(migrationSource, /set search_path = public/i);
assert.match(migrationSource, /revoke all on function public\.get_audit_funnel_stats\(integer\) from public, anon, authenticated/i);
assert.match(migrationSource, /grant execute on function public\.get_audit_funnel_stats\(integer\) to service_role/i);

const routeSource = fs.readFileSync("src/routes/admin_.growth.tsx", "utf8");
assert.match(routeSource, /<AdminAuthGate>/);
assert.match(routeSource, /noindex, nofollow, noarchive/);

const adminSource = fs.readFileSync("src/routes/admin.tsx", "utf8");
assert.match(adminSource, /href="\/admin\/growth"/);

const dataSource = fs.readFileSync("src/admin/audit-funnel-data.ts", "utf8");
assert.match(dataSource, /functions\.invoke\("audit-funnel-stats"/);

const dashboardSource = fs.readFileSync("src/admin/GrowthAnalytics.tsx", "utf8");
assert.match(dashboardSource, /geen unieke-bezoekerconversie/i);
assert.match(dashboardSource, /eventaantallen/i);
assert.doesNotMatch(dashboardSource, /email|ip-adres ophalen|user-agent ophalen/i);

console.log("Audit funnel admin security checks passed.");
