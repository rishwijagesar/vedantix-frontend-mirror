import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";

const [baseUrl, publicDir] = process.argv.slice(2);
assert(
  baseUrl && publicDir,
  "Usage: node scripts/smoke-assets.mjs URL PUBLIC_DIR",
);
const root = resolve(publicDir);
const assetRoot = resolve(root, "assets");
const entries = await readdir(assetRoot, {
  recursive: true,
  withFileTypes: true,
});
const files = entries
  .filter((entry) => entry.isFile())
  .map((entry) => resolve(entry.parentPath ?? entry.path, entry.name));
assert(files.length > 0, "No built assets to verify");
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
let checked = 0;
// Modest concurrency also works against staging's small Lambda quota.
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (;;) {
      const file = files.pop();
      if (!file) return;
      const path = "/" + relative(root, file).split(sep).join("/");
      const response = await fetch(new URL(path, baseUrl), {
        redirect: "error",
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(response.status, 200, `${path}: HTTP ${response.status}`);
      assert(
        file.endsWith(".html") || !response.headers.get("content-type")?.includes("text/html"),
        `${path}: HTML fallback`,
      );
      assert.equal(
        hash(Buffer.from(await response.arrayBuffer())),
        hash(await readFile(file)),
        `${path}: wrong release bytes`,
      );
      checked++;
    }
  }),
);
console.log(
  `Verified ${checked} assets: HTTP 200, correct content type and SHA-256.`,
);
