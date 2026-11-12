// Reports how many placeholder (fictional) clients the homepage still uses.
// Run with FAIL_ON_PLACEHOLDERS=1 in CI/deploy to block a release that still contains them.
import { PLACEHOLDER_CLIENTS, CLIENT_STRIP_MIN } from "../src/data/proof.js";

console.log(`Homepage can show up to ${PLACEHOLDER_CLIENTS.length} placeholder clients (strip fills to ${CLIENT_STRIP_MIN} tiles).`);
console.log("They are labelled 'voorbeeld' on the page and disappear automatically once enough real clients exist.");
if (process.env.FAIL_ON_PLACEHOLDERS === "1") {
  console.error("FAIL_ON_PLACEHOLDERS=1: replace placeholder clients with real ones before releasing.");
  process.exit(1);
}
