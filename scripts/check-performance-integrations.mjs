import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parseReviews, publicReviews } from "../src/lib/public-reviews.server.js";
import { metaPixelProxy } from "../src/lib/meta-pixel-proxy.server.js";

const snapshot = JSON.parse(await readFile(new URL("../src/data/google-reviews.json", import.meta.url), "utf8"));
function feed(data = snapshot) {
  const widget = { widget: { id: "019e92edd9f87a41aae99010d53be8d25324" }, schema: [{ fields: [
    { name: "review_data", value: JSON.stringify({ ...data, success: true }) },
    { name: "header_title", value: data.headerTitle },
    { name: "button_text", value: data.buttonText },
    { name: "minimum_rating", value: data.minimumRating },
  ] }] };
  return "const widgetData = '" + JSON.stringify(JSON.stringify(widget)).slice(1, -1).replace(/'/g, "\\'") + "';";
}
assert.deepEqual(parseReviews(feed()), snapshot);
assert.equal(parseReviews(feed({ ...snapshot, headerTitle: "Klant's review" })).headerTitle, "Klant's review");
assert.throws(() => parseReviews("globalThis.untrustedCodeExecuted = true"));
assert.equal(globalThis.untrustedCodeExecuted, undefined);
assert.throws(() => parseReviews(feed({ ...snapshot, shareFeedbackUrl: "javascript:alert(1)" })));
assert.throws(() => parseReviews(feed({ ...snapshot, overallRating: 9 })));
assert.equal((await publicReviews(new Request("https://vedantix.nl/api/public-reviews", { method: "POST" }))).status, 405);

const originalFetch = globalThis.fetch;
try {
  let calls = 0;
  globalThis.fetch = async (url) => { calls++; assert.equal(String(url), "https://www.jotform.com/website-widgets/embed/019e92edd9f87a41aae99010d53be8d25324"); return new Response(feed()); };
  const responses = await Promise.all(Array.from({ length: 4 }, () => publicReviews(new Request("https://vedantix.nl/api/public-reviews"))));
  assert.equal(calls, 1, "Concurrent requests share one provider refresh");
  for (const response of responses) assert.deepEqual(await response.json(), snapshot);
  assert.equal((await publicReviews(new Request("https://vedantix.nl/api/public-reviews", { method: "HEAD" }))).body, null);
  assert.equal(calls, 1, "Cached reads do not call Jotform again");
  const offline = await import("../src/lib/public-reviews.server.js?offline");
  globalThis.fetch = async () => { throw new Error("Provider offline"); };
  assert.deepEqual(await (await offline.publicReviews(new Request("https://vedantix.nl/api/public-reviews"))).json(), snapshot);

  let target;
  globalThis.fetch = async (url, options) => { target = String(url); assert.equal(options.redirect, "error"); assert.equal(options.headers, undefined); return new Response("/* Meta script */"); };
  assert.equal((await metaPixelProxy(new Request("https://vedantix.nl/integrations/meta-pixel/anything"))).status, 404);
  assert.equal(target, undefined);
  const script = await metaPixelProxy(new Request("https://vedantix.nl/integrations/meta-pixel/en_US/fbevents.js", { headers: { Cookie: "private-session=value" } }));
  assert.equal(target, "https://connect.facebook.net/en_US/fbevents.js");
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type"), /javascript/);
  const config = await metaPixelProxy(new Request("https://vedantix.nl/integrations/meta-pixel/signals/config/2100259704034137?domain=vedantix.nl"));
  assert.equal(config.headers.get("cache-control"), "private, no-store");
  assert.equal((await metaPixelProxy(new Request("https://vedantix.nl/integrations/meta-pixel/en_US/fbevents.js", { method: "POST" }))).status, 405);
} finally { globalThis.fetch = originalFetch; }
console.log("Review parsing, link validation, caching, fallback and restricted Pixel proxy checks passed.");
