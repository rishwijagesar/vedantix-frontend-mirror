import test from "node:test";
import assert from "node:assert/strict";
import { websiteAdminLogin } from "../src/lib/website-admin-login.server.ts";
import { LOGIN_PRESENTATION_MAX_BYTES, validateLoginPresentation } from "../packages/website-admin-core/src/login-presentation.ts";

const endpoint = "https://vedantix.nl/api/public/website-admin-login";

test("public login settings contain only bounded validated presentation", async () => {
  const response = websiteAdminLogin(new Request(endpoint));
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.ok(new TextEncoder().encode(body).byteLength <= LOGIN_PRESENTATION_MAX_BYTES);
  const data = JSON.parse(body);
  assert.deepEqual(validateLoginPresentation(data), data);
  assert.equal(response.headers.get("access-control-allow-origin"), "*");
  assert.equal(response.headers.get("access-control-allow-credentials"), null);
  assert.equal(response.headers.get("cache-control"), "public, max-age=60");
  assert.equal(response.headers.get("set-cookie"), null);
});

test("response is independent of site cookies, account identifiers and origin", async () => {
  const plain = await websiteAdminLogin(new Request(endpoint)).text();
  const withAccount = await websiteAdminLogin(new Request(endpoint + "?email=test@example.invalid", {
    headers: { cookie: "session=unused", authorization: "Bearer unused", origin: "https://naturehealing.nl" },
  })).text();
  assert.equal(withAccount, plain);
});

test("public CORS preflight grants GET without credential sharing", () => {
  const response = websiteAdminLogin(new Request(endpoint, { method: "OPTIONS" }));
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("access-control-allow-methods"), "GET, OPTIONS");
  assert.equal(response.headers.get("access-control-allow-credentials"), null);
});

test("login configuration cannot accept credential submissions or mutations", async () => {
  for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
    const response = websiteAdminLogin(new Request(endpoint, { method }));
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, OPTIONS");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { error: "Method not allowed" });
  }
});
