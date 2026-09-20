import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const source = await readFile(new URL("../src/admin/mail-dns-endpoint.ts", import.meta.url), "utf8");
const endpoint = source.match(/MAIL_DNS_API = "([^"]+)"/)[1];
const origin = "https://vedantix.nl";
for (const check of [
  { name: "anonymous apply", method: "POST", origin, expected: 401 },
  { name: "invalid session", method: "POST", origin, token: "invalid.jwt.token-for-live-smoke-only", expected: 401 },
  { name: "foreign origin", method: "POST", origin: "https://untrusted.example", expected: 403 },
  { name: "GET", method: "GET", origin, expected: 405 },
  { name: "preflight", method: "OPTIONS", origin, expected: 204 },
]) {
  const headers = { Origin: check.origin, "Content-Type": "application/json", ...(check.token ? { Authorization: "Bearer " + check.token } : {}) };
  const response = await fetch(endpoint, { method: check.method, headers, redirect: "error", signal: AbortSignal.timeout(15000), ...(check.method === "POST" ? { body: JSON.stringify({ action: "apply", domain_id: "00000000-0000-4000-8000-000000000001" }) } : {}) });
  assert.equal(response.status, check.expected, check.name);
  if (check.origin === origin) assert.equal(response.headers.get("access-control-allow-origin"), origin);
  else assert.equal(response.headers.get("access-control-allow-origin"), null);
  console.log(check.name + ": HTTP " + response.status);
}
