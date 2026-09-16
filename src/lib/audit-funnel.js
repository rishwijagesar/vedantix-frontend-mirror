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
const SUPABASE_URL =
  import.meta.env["VITE_SUPABASE_URL"] || "https://zxnexwqvoznmirajhgxj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
  "sb_publishable_QlxkbMaJ9IEBAPr9y0d1HQ_xh8Z6oEu";
const AUDIT_FUNNEL_ENDPOINT = `${SUPABASE_URL}/functions/v1/audit-funnel`;

export function trackAuditFunnel(event) {
  if (typeof window === "undefined" || !ALLOWED_EVENTS.has(event)) return;

  void fetch(AUDIT_FUNNEL_ENDPOINT, {
    method: "POST",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      "content-type": "application/json",
    },
    body: JSON.stringify({ event }),
    keepalive: true,
    credentials: "omit",
    referrerPolicy: "no-referrer",
  }).catch(() => {
    // Funnel telemetry must never block or break the public audit flow.
  });
}
