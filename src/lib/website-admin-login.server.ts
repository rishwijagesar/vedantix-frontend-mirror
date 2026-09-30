import { DEFAULT_LOGIN_PRESENTATION, LOGIN_PRESENTATION_MAX_BYTES, validateLoginPresentation } from "../../packages/website-admin-core/src/login-presentation.ts";
import { websiteAdminLoginPresentation } from "./website-admin-login-presentation.ts";

/** Public decorative settings only; this endpoint never receives account data. */
export function websiteAdminLogin(request: Request): Response {
  const headers = new Headers({
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
    "cache-control": "public, max-age=60",
    "x-content-type-options": "nosniff",
  });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "GET") {
    headers.set("allow", "GET, OPTIONS");
    headers.set("cache-control", "no-store");
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers });
  }
  const validated = validateLoginPresentation(websiteAdminLoginPresentation);
  let body = JSON.stringify(validated || DEFAULT_LOGIN_PRESENTATION);
  if (new TextEncoder().encode(body).byteLength > LOGIN_PRESENTATION_MAX_BYTES) {
    body = JSON.stringify(DEFAULT_LOGIN_PRESENTATION);
  }
  return new Response(body, { status: 200, headers });
}
