const FUNNEL_NAME = "online_growth_audit";

export const AUDIT_FUNNEL_EVENTS = new Set([
  "PAGE_VIEW",
  "FORM_STARTED",
  "AUDIT_STARTED",
  "AUDIT_FAILED",
  "RESULT_VIEWED",
  "PDF_DOWNLOADED",
  "PLANNING_CLICK",
  "WHATSAPP_CLICK",
]);

function emptyResponse(status, headers = {}) {
  return new Response(null, {
    status,
    headers: {
      "cache-control": "no-store",
      ...headers,
    },
  });
}

function isSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function auditFunnel(request) {
  if (request.method !== "POST") {
    return emptyResponse(405, { allow: "POST" });
  }

  if (!isSameOrigin(request)) {
    return emptyResponse(403);
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > 256) {
    return emptyResponse(413);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return emptyResponse(400);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return emptyResponse(400);
  }

  const keys = Object.keys(payload);
  if (keys.length !== 1 || keys[0] !== "event") {
    // Reject additional properties so names, e-mail addresses, URLs, audit IDs,
    // session IDs or other visitor data can never accidentally enter funnel logs.
    return emptyResponse(400);
  }

  const event = typeof payload.event === "string" ? payload.event.trim().toUpperCase() : "";
  if (!AUDIT_FUNNEL_EVENTS.has(event)) {
    return emptyResponse(400);
  }

  console.info(
    JSON.stringify({
      kind: "vedantix_funnel",
      funnel: FUNNEL_NAME,
      event,
      timestamp: new Date().toISOString(),
    }),
  );

  return emptyResponse(204);
}
