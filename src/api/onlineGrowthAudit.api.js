import { API_BASE_URL, apiClient } from "./client";

const DEFAULT_TENANT_ID = import.meta.env.VITE_TENANT_ID || "default";

function publicHeaders() {
  return {
    "X-Tenant-Id": DEFAULT_TENANT_ID,
    "X-Actor-Id": "online-growth-audit",
    "X-Source": "PUBLIC_SITE",
  };
}

export async function startOnlineGrowthAudit(payload) {
  return apiClient.post("/api/audit", payload, {
    actorId: "online-growth-audit",
    source: "PUBLIC_SITE",
  });
}

export async function fetchOnlineGrowthAudit(auditId) {
  return apiClient.get(`/api/audit/${encodeURIComponent(auditId)}`, {
    actorId: "online-growth-audit",
    source: "PUBLIC_SITE",
  });
}

export async function rerunOnlineGrowthAudit(auditId) {
  return apiClient.post(
    `/api/audit/${encodeURIComponent(auditId)}/rerun`,
    {},
    {
      actorId: "online-growth-audit",
      source: "PUBLIC_SITE",
    },
  );
}

export async function downloadOnlineGrowthAuditPdf(auditId) {
  const response = await fetch(
    `${API_BASE_URL}/api/audit/${encodeURIComponent(auditId)}/pdf`,
    {
      method: "GET",
      credentials: "include",
      headers: publicHeaders(),
    },
  );

  if (!response.ok) {
    let message = `PDF downloaden is mislukt (${response.status})`;
    try {
      const json = await response.json();
      message = json?.error?.message || json?.message || message;
    } catch {
      // Keep status-based fallback.
    }
    throw new Error(message);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/i);
  const filename = filenameMatch?.[1] || `vedantix-online-groei-audit-${auditId}.pdf`;
  return { blob, filename };
}
