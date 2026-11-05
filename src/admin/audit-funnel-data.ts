import { supabase } from "@/lib/supabase";

export type AuditFunnelEvent =
  | "PAGE_VIEW"
  | "FORM_STARTED"
  | "AUDIT_STARTED"
  | "AUDIT_FAILED"
  | "RESULT_VIEWED"
  | "PDF_DOWNLOADED"
  | "PLANNING_CLICK"
  | "WHATSAPP_CLICK";

export type AuditFunnelCounts = Partial<Record<AuditFunnelEvent, number>>;

export type AuditFunnelDailyPoint = {
  date: string;
  event: AuditFunnelEvent;
  count: number;
};

export type AuditFunnelStats = {
  days: number;
  from: string;
  to: string;
  counts: AuditFunnelCounts;
  daily: AuditFunnelDailyPoint[];
};

function asCount(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? Math.trunc(number) : 0;
}

export async function getAuditFunnelStats(days = 30): Promise<AuditFunnelStats> {
  const safeDays = Math.max(1, Math.min(365, Math.trunc(Number(days) || 30)));
  const { data, error } = await supabase.functions.invoke("audit-funnel-stats", {
    body: { days: safeDays },
  });

  if (error) {
    let message = error.message || "Funneldata kon niet worden geladen.";
    try {
      const response = error.context;
      if (response instanceof Response) {
        const payload = await response.clone().json();
        message = payload?.error || message;
      }
    } catch {
      // Keep the function error message.
    }
    throw new Error(message);
  }

  const raw = data && typeof data === "object" ? data : {};
  const rawCounts = raw.counts && typeof raw.counts === "object" ? raw.counts : {};
  const events: AuditFunnelEvent[] = [
    "PAGE_VIEW",
    "FORM_STARTED",
    "AUDIT_STARTED",
    "AUDIT_FAILED",
    "RESULT_VIEWED",
    "PDF_DOWNLOADED",
    "PLANNING_CLICK",
    "WHATSAPP_CLICK",
  ];
  const counts: AuditFunnelCounts = {};
  for (const event of events) counts[event] = asCount(rawCounts[event]);

  const daily = Array.isArray(raw.daily)
    ? raw.daily
        .filter((item: unknown): item is { date?: unknown; event: AuditFunnelEvent; count?: unknown } => Boolean(item && typeof item === "object" && "event" in item && events.includes(item.event as AuditFunnelEvent)))
        .map((item: { date?: unknown; event: AuditFunnelEvent; count?: unknown }) => ({
          date: String(item.date || ""),
          event: item.event as AuditFunnelEvent,
          count: asCount(item.count),
        }))
        .filter((item: AuditFunnelDailyPoint) => /^\d{4}-\d{2}-\d{2}$/.test(item.date))
    : [];

  return {
    days: asCount(raw.days) || safeDays,
    from: String(raw.from || ""),
    to: String(raw.to || ""),
    counts,
    daily,
  };
}
