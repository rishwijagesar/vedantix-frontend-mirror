import assert from "node:assert/strict";
import fs from "node:fs";
import { auditFunnel } from "../src/lib/audit-funnel.server.js";

const endpoint = "https://vedantix.nl/api/funnel/online-growth-audit";

assert.equal((await auditFunnel(new Request(endpoint))).status, 405);

assert.equal(
  (
    await auditFunnel(
      new Request(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ event: "PAGE_VIEW" }),
      }),
    )
  ).status,
  403,
);

for (const origin of ["https://example.com", "http://vedantix.nl"]) {
  assert.equal(
    (
      await auditFunnel(
        new Request(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin,
          },
          body: JSON.stringify({ event: "PAGE_VIEW" }),
        }),
      )
    ).status,
    403,
  );
}

assert.equal(
  (
    await auditFunnel(
      new Request(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://vedantix.nl",
        },
        body: JSON.stringify({ event: "PAGE_VIEW", email: "should-not-be-accepted@example.com" }),
      }),
    )
  ).status,
  400,
);

assert.equal(
  (
    await auditFunnel(
      new Request(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://vedantix.nl",
        },
        body: JSON.stringify({ event: "UNKNOWN_EVENT" }),
      }),
    )
  ).status,
  400,
);

assert.equal(
  (
    await auditFunnel(
      new Request(endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://vedantix.nl",
        },
        body: JSON.stringify({ event: "PAGE_VIEW", padding: "x".repeat(300) }),
      }),
    )
  ).status,
  413,
);

const originalInfo = console.info;
const logged = [];
console.info = (value) => logged.push(String(value));
try {
  const smokeResponse = await auditFunnel(
    new Request(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://vedantix.nl",
      },
      body: JSON.stringify({ event: "SMOKE_TEST" }),
    }),
  );
  assert.equal(smokeResponse.status, 204);
  assert.equal(logged.length, 0);

  const response = await auditFunnel(
    new Request(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://vedantix.nl",
      },
      body: JSON.stringify({ event: "RESULT_VIEWED" }),
    }),
  );
  assert.equal(response.status, 204);
} finally {
  console.info = originalInfo;
}

assert.equal(logged.length, 1);
const eventLog = JSON.parse(logged[0]);
assert.deepEqual(Object.keys(eventLog).sort(), ["event", "funnel", "kind", "timestamp"]);
assert.equal(eventLog.kind, "vedantix_funnel");
assert.equal(eventLog.funnel, "online_growth_audit");
assert.equal(eventLog.event, "RESULT_VIEWED");

const clientSource = fs.readFileSync("src/lib/audit-funnel.js", "utf8");
assert.match(clientSource, /credentials:\s*"omit"/);
assert.match(clientSource, /referrerPolicy:\s*"no-referrer"/);
assert.doesNotMatch(clientSource, /localStorage|sessionStorage|cookie/i);

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

console.log("Audit funnel privacy checks passed.");
