// Fails when the WhatsApp number drifts or is hardcoded wrongly anywhere in src/public.
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const WRONG = /wa\.me\/310626219989|\b310626219989\b/;
async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (/\.(jsx?|tsx?|txt|xml|json|html)$/.test(entry.name)) yield path;
  }
}
let checked = 0;
for (const root of ["src", "public"]) {
  for await (const file of walk(new URL(`../${root}`, import.meta.url).pathname)) {
    checked++;
    assert.doesNotMatch(await readFile(file, "utf8"), WRONG, `Wrong WhatsApp number (extra zero) in ${file}`);
  }
}
console.log(`Contact constants OK (${checked} files checked)`);
