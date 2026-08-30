import { supabase } from "@/lib/supabase";

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type NotificationStatus = "QUEUED" | "SENT" | "FAILED" | "SKIPPED";

export type MonitoringAlert = {
  id: string;
  domain_id: string;
  check_type: string;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  details: Record<string, unknown>;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

export type AutomationRun = {
  id: string;
  customer_id: string | null;
  domain_id: string | null;
  website_id: string | null;
  automation_type: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "SKIPPED";
  input: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error_message: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type MonitoringNotification = {
  id: string;
  alert_id: string | null;
  event_type: "ALERT_OPENED" | "ALERT_RESOLVED";
  channel: string;
  status: NotificationStatus;
  payload: Record<string, unknown>;
  created_at: string;
  processed_at: string | null;
  error_message: string | null;
};

export type DeliveryConfig = {
  id: boolean;
  enabled: boolean;
  provider: "MIGADU_SMTP";
  schedule: string;
  transport_ok: boolean | null;
  credentials_configured: boolean;
  last_probe_at: string | null;
  updated_at: string;
};

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listMonitoringAlerts(limit = 100): Promise<MonitoringAlert[]> {
  const { data, error } = await supabase
    .from("monitoring_alerts")
    .select("*")
    .order("last_seen_at", { ascending: false })
    .limit(limit);
  throwIfError(error);
  return (data ?? []) as MonitoringAlert[];
}

export async function updateMonitoringAlertStatus(id: string, status: AlertStatus): Promise<void> {
  const changes: Record<string, unknown> = { status };
  if (status === "RESOLVED") changes.resolved_at = new Date().toISOString();
  if (status !== "RESOLVED") changes.resolved_at = null;
  const { error } = await supabase.from("monitoring_alerts").update(changes).eq("id", id);
  throwIfError(error);
}

export async function listAutomationRuns(limit = 40): Promise<AutomationRun[]> {
  const { data, error } = await supabase
    .from("automation_runs")
    .select("*")
    .eq("automation_type", "DOMAIN_HEALTH_MONITOR")
    .order("created_at", { ascending: false })
    .limit(limit);
  throwIfError(error);
  return (data ?? []) as AutomationRun[];
}

export async function listMonitoringNotifications(limit = 50): Promise<MonitoringNotification[]> {
  const { data, error } = await supabase
    .from("monitoring_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  throwIfError(error);
  return (data ?? []) as MonitoringNotification[];
}

export async function retryMonitoringNotification(id: string): Promise<void> {
  const { error } = await supabase
    .from("monitoring_notifications")
    .update({ status: "QUEUED", processed_at: null, error_message: null })
    .eq("id", id);
  throwIfError(error);
}

export async function getDeliveryConfig(): Promise<DeliveryConfig | null> {
  const { data, error } = await supabase
    .from("notification_delivery_config")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  throwIfError(error);
  return data as DeliveryConfig | null;
}

export async function updateDeliveryEnabled(enabled: boolean): Promise<void> {
  const { error } = await supabase
    .from("notification_delivery_config")
    .update({ enabled })
    .eq("id", true);
  throwIfError(error);
}
