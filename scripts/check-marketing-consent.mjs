import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [workerConfig, metaPixel, consentUi, root] = await Promise.all([
  read("src/lib/partytown-config.ts"),
  read("src/components/MetaPixel.jsx"),
  read("src/components/CookieConsent.jsx"),
  read("src/routes/__root.tsx"),
]);

assert.match(workerConfig, /only defines the Meta initializer/i);
assert.doesNotMatch(
  workerConfig,
  /if \(!location\.pathname\.startsWith\('\/admin'\)[\s\S]*fbq\('track', 'PageView'\)/,
  "Meta PageView must not be emitted from the unconditional worker bootstrap",
);
assert.match(metaPixel, /consent !== "granted"/);
assert.doesNotMatch(metaPixel, /<noscript/);
assert.match(consentUi, />\s*Weigeren\s*</);
assert.match(consentUi, />\s*Accepteren\s*</);
assert.match(root, /<CookieConsent \/>/);

console.log("Marketing tracking remains gated behind explicit browser consent.");
