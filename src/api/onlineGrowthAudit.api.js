import { supabase } from "@/lib/supabase";
import { AUDIT_FUNNEL_EVENTS, trackAuditFunnel } from "@/lib/audit-funnel";

const PAGESPEED_RETRY_MS = 15 * 60 * 1000;

async function readFunctionError(error, fallback) {
  let message = error?.message || fallback;
  try {
    const response = error?.context;
    if (response instanceof Response) {
      const payload = await response.clone().json();
      message = payload?.error || payload?.message || message;
    }
  } catch {
    // Keep the function error message.
  }
  return message;
}

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke("online-growth-audit", { body });
  if (error) throw new Error(await readFunctionError(error, "Online Groei Audit is mislukt."));
  return data;
}

async function enrichPageSpeed(auditId) {
  const { data, error } = await supabase.functions.invoke("online-growth-audit-pagespeed", {
    body: { auditId },
  });
  if (error) {
    // PageSpeed is enrichment: a temporary Google/API failure must never make
    // an otherwise valid Online Groei Audit unusable.
    return { ok: false, error: await readFunctionError(error, "PageSpeed-meting is tijdelijk niet beschikbaar.") };
  }
  return data;
}

function needsPageSpeedEnrichment(results) {
  const pageSpeed = results?.pageSpeed;
  if (!pageSpeed?.status) return true;
  if (pageSpeed.status !== "FAILED") return false;
  const measuredAt = Date.parse(pageSpeed.measuredAt || "");
  return !Number.isFinite(measuredAt) || Date.now() - measuredAt >= PAGESPEED_RETRY_MS;
}

async function enrichCompletedAudit(data) {
  if (!data?.auditId || data?.status !== "COMPLETED") return data;
  await enrichPageSpeed(data.auditId);
  return data;
}

export async function startOnlineGrowthAudit(payload) {
  const data = await invoke({ action: "start", request: payload });
  trackAuditFunnel(AUDIT_FUNNEL_EVENTS.AUDIT_STARTED);
  return enrichCompletedAudit(data);
}

export async function fetchOnlineGrowthAudit(auditId) {
  let data = await invoke({ action: "get", auditId });
  if (data?.status === "COMPLETED" && data?.results && needsPageSpeedEnrichment(data.results)) {
    await enrichPageSpeed(auditId);
    data = await invoke({ action: "get", auditId });
  }
  return data;
}

export async function rerunOnlineGrowthAudit(auditId) {
  const data = await invoke({ action: "rerun", auditId });
  return enrichCompletedAudit(data);
}

export async function downloadOnlineGrowthAuditPdf(auditId) {
  // Ensure older completed audits are enriched before the PDF is generated.
  const current = await invoke({ action: "get", auditId });
  if (current?.status === "COMPLETED" && current?.results && needsPageSpeedEnrichment(current.results)) {
    await enrichPageSpeed(auditId);
  }

  const data = await invoke({ action: "pdf", auditId });
  const blob = data instanceof Blob ? data : new Blob([data], { type: "application/pdf" });
  trackAuditFunnel(AUDIT_FUNNEL_EVENTS.PDF_DOWNLOADED);
  return {
    blob,
    filename: `Vedantix-Online-Groei-Audit-${String(auditId).slice(0, 8)}.pdf`,
  };
}
