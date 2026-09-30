import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_LOGIN_PRESENTATION, WEBSITE_ADMIN_LOGIN_PRESENTATION_URL, LOGIN_PRESENTATION_MAX_BYTES, loadLoginPresentation, validateLoginPresentation, mayApplyLoginPresentation } from "../src/login-presentation.ts";

test("shared local default and supported central layout validate", () => {
  assert.deepEqual(validateLoginPresentation(DEFAULT_LOGIN_PRESENTATION), DEFAULT_LOGIN_PRESENTATION);
  assert.equal(validateLoginPresentation({ ...DEFAULT_LOGIN_PRESENTATION, layout: "centered", heading: "Goed je weer te zien" })?.layout, "centered");
});

test("remote HTML, links, unknown fields and CSS values cannot control the login", () => {
  const invalid = [
    { heading: "<img src=x onerror=alert(1)>" }, { storyText: "Open https://example.test" },
    { description: "javascript:alert(1)" }, { primaryColor: "url(https://example.test)" },
    { backgroundColor: "red;display:none" }, { borderRadius: "999px;display:none" },
    { provider: "attacker" }, { recoveryUrl: "https://example.test" }, { hidePassword: true },
    { version: 2 }, { layout: "script" }, { heading: "x".repeat(81) },
    { layout: { toString: () => "split" } }, { borderRadius: { toString: () => "16px" } },
  ];
  for (const change of invalid) assert.equal(validateLoginPresentation({ ...DEFAULT_LOGIN_PRESENTATION, ...change }), null);
});

test("remote theme must keep white primary text and fixed dark background text readable", () => {
  assert.equal(validateLoginPresentation({ ...DEFAULT_LOGIN_PRESENTATION, primaryColor: "#FFFFFF" }), null);
  assert.equal(validateLoginPresentation({ ...DEFAULT_LOGIN_PRESENTATION, backgroundColor: "#0F172A" }), null);
});

test("presentation request has a fixed public destination and no credentials or referrer", async () => {
  let calls = 0;
  const fetcher: typeof fetch = async (url, options) => {
    calls++;
    assert.equal(url, WEBSITE_ADMIN_LOGIN_PRESENTATION_URL);
    assert.equal(options?.credentials, "omit"); assert.equal(options?.referrerPolicy, "no-referrer");
    assert.equal(options?.redirect, "error"); assert.equal(options?.cache, "default");
    assert.equal(options?.method, "GET"); assert.equal(options?.body, undefined); assert.equal(options?.headers, undefined);
    return Response.json({ ...DEFAULT_LOGIN_PRESENTATION, layout: "centered" });
  };
  assert.equal((await loadLoginPresentation(fetcher)).layout, "centered");
  assert.equal(calls, 1);
});

test("failure, wrong content, malformed JSON and oversize responses use immediate local fallback", async () => {
  for (const fetcher of [
    async () => { throw new Error("offline"); },
    async () => new Response("not available", { status: 503 }),
    async () => new Response("<html>login</html>", { headers: { "content-type": "text/html" } }),
    async () => new Response("{invalid", { headers: { "content-type": "application/json" } }),
    async () => Response.json({ ...DEFAULT_LOGIN_PRESENTATION, token: "never-accepted" }),
    async () => new Response("x".repeat(LOGIN_PRESENTATION_MAX_BYTES + 1), { headers: { "content-type": "application/json" } }),
  ]) assert.equal(await loadLoginPresentation(fetcher as typeof fetch), DEFAULT_LOGIN_PRESENTATION);
});

test("a request can be aborted without affecting the credential form", async () => {
  const controller = new AbortController();
  const fetcher: typeof fetch = async (_url, options) => new Promise((_resolve, reject) => {
    options?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    controller.abort();
  });
  assert.equal(await loadLoginPresentation(fetcher, controller.signal), DEFAULT_LOGIN_PRESENTATION);
});

test("late presentation responses cannot change the layout after interaction or unmount", () => {
  assert.equal(mayApplyLoginPresentation(false, false), true);
  assert.equal(mayApplyLoginPresentation(true, false), false);
  assert.equal(mayApplyLoginPresentation(false, true), false);
});
