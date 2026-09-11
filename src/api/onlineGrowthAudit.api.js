import { supabase } from "@/lib/supabase";
import { AUDIT_FUNNEL_EVENTS, trackAuditFunnel } from "@/lib/audit-funnel";

async function invoke(body) {
  const { data, error } = await supabase.functions.invoke("online-growth-audit", { body });
  if (error) {
    let message = error.message || "Online Groei Audit is mislukt.";
    try {
      const response = error.context;
      if (response instanceof Response) {
        const payload = await response.clone().json();
        message = payload?.error || payload?.message || message;
      }
    } catch {
      // Keep the function error message.
    }
    throw new Error(message);
  }
  return data;
}

export async function startOnlineGrowthAudit(payload) {
  const data = await invoke({ action: "start", request: payload });
  trackAuditFunnel(AUDIT_FUNNEL_EVENTS.AUDIT_STARTED);
  return data;
}

export async function fetchOnlineGrowthAudit(auditId) {
  return invoke({ action: "get", auditId });
}

export async function rerunOnlineGrowthAudit(auditId) {
  return invoke({ action: "rerun", auditId });
}

export async function downloadOnlineGrowthAuditPdf(auditId) {
  const data = await invoke({ action: "pdf", auditId });
  const blob = data instanceof Blob ? data : new Blob([data], { type: "application/pdf" });
  trackAuditFunnel(AUDIT_FUNNEL_EVENTS.PDF_DOWNLOADED);
  return {
    blob,
    filename: `Vedantix-Online-Groei-Audit-${String(auditId).slice(0, 8)}.pdf`,
  };
}
