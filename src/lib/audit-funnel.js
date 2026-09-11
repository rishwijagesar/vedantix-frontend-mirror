export const AUDIT_FUNNEL_EVENTS = Object.freeze({
  PAGE_VIEW: "PAGE_VIEW",
  FORM_STARTED: "FORM_STARTED",
  AUDIT_STARTED: "AUDIT_STARTED",
  AUDIT_FAILED: "AUDIT_FAILED",
  RESULT_VIEWED: "RESULT_VIEWED",
  PDF_DOWNLOADED: "PDF_DOWNLOADED",
  PLANNING_CLICK: "PLANNING_CLICK",
  WHATSAPP_CLICK: "WHATSAPP_CLICK",
});

const ALLOWED_EVENTS = new Set(Object.values(AUDIT_FUNNEL_EVENTS));

export function trackAuditFunnel(event) {
  if (typeof window === "undefined" || !ALLOWED_EVENTS.has(event)) return;

  const body = JSON.stringify({ event });

  void fetch("/api/funnel/online-growth-audit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
    credentials: "omit",
    referrerPolicy: "no-referrer",
  }).catch(() => {
    // Funnel telemetry must never block or break the public audit flow.
  });
}
