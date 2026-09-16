import assert from "node:assert/strict";
import fs from "node:fs";

const functionSource = fs.readFileSync("supabase/functions/online-growth-audit-pagespeed/index.ts", "utf8");
const apiSource = fs.readFileSync("src/api/onlineGrowthAudit.api.js", "utf8");

for (const strategy of ["mobile", "desktop"]) {
  assert.match(functionSource, new RegExp(`runPageSpeed\\(targetUrl, \\\"${strategy}\\\"\\)`));
}
for (const category of ["performance", "accessibility", "best-practices", "seo"]) {
  assert.ok(functionSource.includes(`"${category}"`), `Missing Lighthouse category ${category}`);
}
for (const metric of [
  "first-contentful-paint",
  "largest-contentful-paint",
  "cumulative-layout-shift",
  "total-blocking-time",
  "speed-index",
]) {
  assert.ok(functionSource.includes(metric), `Missing PageSpeed metric ${metric}`);
}

assert.match(functionSource, /PAGESPEED_API_KEY/);
assert.match(functionSource, /FAILED_RETRY_MS/);
assert.match(functionSource, /requiresApiKey/);
assert.match(functionSource, /overallScore/);
assert.match(functionSource, /priorityMatrix/);
assert.match(functionSource, /Google PageSpeed Insights API v5 \/ Lighthouse/);
assert.match(functionSource, /from\("online_growth_audits"\)/);
assert.match(functionSource, /\.update\(\{ results: nextResults \}\)/);
assert.doesNotMatch(functionSource, /requester_ip|user_agent/);

assert.match(apiSource, /online-growth-audit-pagespeed/);
assert.match(apiSource, /needsPageSpeedEnrichment/);
assert.match(apiSource, /PageSpeed is enrichment/);
assert.match(apiSource, /PAGESPEED_RETRY_MS/);
assert.match(apiSource, /if \(error\)[\s\S]*return \{ ok: false/);

console.log("PageSpeed integration checks passed.");
