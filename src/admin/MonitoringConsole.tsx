import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Mail,
  RefreshCw,
  RotateCcw,
  ServerCog,
  ShieldCheck,
} from "lucide-react";
import { listDomains, type Domain } from "./control-center-data";
import {
  getDeliveryConfig,
  listAutomationRuns,
  listMonitoringAlerts,
  listMonitoringNotifications,
  retryMonitoringNotification,
  updateDeliveryEnabled,
  updateMonitoringAlertStatus,
  type AutomationRun,
  type DeliveryConfig,
  type MonitoringAlert,
  type MonitoringNotification,
} from "./monitoring-data";
import "./control-center.css";

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const classes = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{children}</span>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">{children}</div>;
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString("nl-NL") : "—";
}

function runTone(status: AutomationRun["status"]): "neutral" | "success" | "warning" | "danger" {
  if (status === "SUCCEEDED") return "success";
  if (status === "FAILED") return "danger";
  if (status === "RUNNING" || status === "QUEUED") return "warning";
  return "neutral";
}

function notificationTone(status: MonitoringNotification["status"]): "neutral" | "success" | "warning" | "danger" {
  if (status === "SENT") return "success";
  if (status === "FAILED") return "danger";
  if (status === "QUEUED") return "warning";
  return "neutral";
}

function alertTone(alert: MonitoringAlert): "neutral" | "success" | "warning" | "danger" {
  if (alert.status === "RESOLVED") return "success";
  if (alert.severity === "CRITICAL") return "danger";
  if (alert.severity === "WARNING") return "warning";
  return "neutral";
}

export default function MonitoringConsole({ embedded = false }: { embedded?: boolean } = {}) {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [notifications, setNotifications] = useState<MonitoringNotification[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [delivery, setDelivery] = useState<DeliveryConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [nextAlerts, nextRuns, nextNotifications, nextDomains, nextDelivery] = await Promise.all([
        listMonitoringAlerts(),
        listAutomationRuns(),
        listMonitoringNotifications(),
        listDomains(),
        getDeliveryConfig(),
      ]);
      setAlerts(nextAlerts);
      setRuns(nextRuns);
      setNotifications(nextNotifications);
      setDomains(nextDomains);
      setDelivery(nextDelivery);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Monitoringdata kon niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = window.setInterval(load, 60_000);
    return () => window.clearInterval(interval);
  }, []);

  const domainName = useMemo(() => new Map(domains.map((domain) => [domain.id, domain.domain_name])), [domains]);
  const activeAlerts = alerts.filter((alert) => alert.status !== "RESOLVED");
  const criticalAlerts = activeAlerts.filter((alert) => alert.severity === "CRITICAL");
  const latestRun = runs[0] ?? null;
  const queuedNotifications = notifications.filter((notification) => notification.status === "QUEUED").length;

  async function changeAlert(alert: MonitoringAlert, status: "ACKNOWLEDGED" | "RESOLVED") {
    setBusyId(alert.id);
    try {
      await updateMonitoringAlertStatus(alert.id, status);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Alert kon niet worden bijgewerkt.");
    } finally {
      setBusyId(null);
    }
  }

  async function retryNotification(notification: MonitoringNotification) {
    setBusyId(notification.id);
    try {
      await retryMonitoringNotification(notification.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Notificatie kon niet opnieuw worden ingepland.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleDelivery() {
    if (!delivery || !delivery.credentials_configured) return;
    setBusyId("delivery");
    try {
      await updateDeliveryEnabled(!delivery.enabled);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delivery-instelling kon niet worden gewijzigd.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className={embedded ? "text-slate-950" : "min-h-screen bg-slate-50 text-slate-950"}>
      {embedded ? null : (
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-white">V</div>
              <div><strong className="block text-sm">Vedantix Monitoring</strong><span className="text-xs text-slate-400">Control Center</span></div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/admin" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"><ArrowLeft size={14} /> Control Center</a>
              <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Vernieuwen</button>
            </div>
          </div>
        </header>
      )}

      <main className={embedded ? "" : "mx-auto max-w-7xl p-4 md:p-7"}>
        {embedded ? (
          <div className="mb-5 flex justify-end">
            <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Monitoring vernieuwen</button>
          </div>
        ) : (
          <div className="mb-7">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Vedantix Operations</span>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Monitoring</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">Autonome domein-, e-mail- en websitecontrole met audit trail, alerts en notification delivery.</p>
          </div>
        )}

        {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Actieve alerts" value={loading ? "—" : activeAlerts.length} icon={CircleAlert} caption="Open of acknowledged" tone={activeAlerts.length > 0 ? "warning" : "success"} />
          <SummaryCard label="Critical" value={loading ? "—" : criticalAlerts.length} icon={AlertTriangle} caption="Directe aandacht vereist" tone={criticalAlerts.length > 0 ? "danger" : "success"} />
          <SummaryCard label="Laatste monitor" value={latestRun?.status ?? (loading ? "—" : "GEEN RUN")} icon={Activity} caption={latestRun ? formatDate(latestRun.finished_at || latestRun.created_at) : "Nog geen run"} tone={latestRun?.status === "FAILED" ? "danger" : latestRun?.status === "SUCCEEDED" ? "success" : "neutral"} />
          <SummaryCard label="Notificaties" value={loading ? "—" : queuedNotifications} icon={Mail} caption="Queued voor delivery" tone={queuedNotifications > 0 ? "warning" : "success"} />
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <Panel title="Alerts" subtitle="Actuele problemen en eerder opgeloste incidenten.">
              {alerts.length === 0 ? <Empty>Geen monitoringalerts. Alle beheerde systemen zijn gezond.</Empty> : <div className="space-y-3">{alerts.slice(0, 30).map((alert) => (
                <div key={alert.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{domainName.get(alert.domain_id) || alert.domain_id.slice(0, 8)}</strong><Badge tone={alertTone(alert)}>{alert.severity}</Badge><Badge>{alert.check_type}</Badge><Badge tone={alert.status === "RESOLVED" ? "success" : alert.status === "ACKNOWLEDGED" ? "warning" : "danger"}>{alert.status}</Badge></div>
                      <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
                      <p className="mt-1 text-xs text-slate-400">Eerste detectie {formatDate(alert.first_seen_at)} · laatste detectie {formatDate(alert.last_seen_at)}</p>
                    </div>
                    {alert.status !== "RESOLVED" ? <div className="flex gap-2">{alert.status === "OPEN" ? <button type="button" disabled={busyId === alert.id} onClick={() => changeAlert(alert, "ACKNOWLEDGED")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Bevestigen</button> : null}<button type="button" disabled={busyId === alert.id} onClick={() => changeAlert(alert, "RESOLVED")} className="rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Opgelost</button></div> : null}
                  </div>
                </div>
              ))}</div>}
            </Panel>

            <Panel title="Automation runs" subtitle="Audit trail van de autonome dagelijkse domeinmonitor.">
              {runs.length === 0 ? <Empty>Nog geen automation-runs.</Empty> : <div className="space-y-3">{runs.slice(0, 20).map((run) => {
                const output = run.output ?? {};
                const changeCount = Number(output.change_count ?? 0);
                const overall = String(output.overall_status ?? "—");
                return <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"><div><div className="flex items-center gap-2"><strong className="text-sm">{run.domain_id ? domainName.get(run.domain_id) || run.domain_id.slice(0, 8) : "Monitoring run"}</strong><Badge tone={runTone(run.status)}>{run.status}</Badge></div><span className="mt-1 block text-xs text-slate-400">{formatDate(run.finished_at || run.created_at)} · overall {overall} · {changeCount} relevante wijziging(en)</span>{run.error_message ? <span className="mt-1 block text-xs text-red-600">{run.error_message}</span> : null}</div><Clock3 size={16} className="text-slate-300" /></div>;
              })}</div>}
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Migadu delivery" subtitle="SMTP transport en notification scheduler.">
              <div className="space-y-4 text-sm">
                <StatusRow label="SMTP transport" ok={delivery?.transport_ok === true} value={delivery?.transport_ok === true ? "TLS / SMTP bereikbaar" : "Niet gevalideerd"} />
                <StatusRow label="Credentials" ok={delivery?.credentials_configured === true} value={delivery?.credentials_configured ? "Geconfigureerd" : "Nog niet ingesteld"} />
                <StatusRow label="Scheduler" ok={delivery?.enabled === true} value={delivery?.enabled ? `Actief · ${delivery.schedule}` : "Uitgeschakeld"} />
                <StatusRow label="Laatste probe" ok={delivery?.transport_ok === true} value={formatDate(delivery?.last_probe_at)} />
              </div>
              <button type="button" onClick={toggleDelivery} disabled={!delivery?.credentials_configured || busyId === "delivery"} className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{delivery?.enabled ? "Delivery uitschakelen" : "Delivery inschakelen"}</button>
              {!delivery?.credentials_configured ? <p className="mt-3 text-xs leading-5 text-slate-500">Delivery blijft bewust uit totdat de Migadu SMTP-gebruikersnaam en het SMTP-wachtwoord als Supabase secrets zijn ingesteld.</p> : null}
            </Panel>

            <Panel title="Notification outbox" subtitle="Queued, verzonden en mislukte monitoringberichten.">
              {notifications.length === 0 ? <Empty>De outbox is leeg.</Empty> : <div className="space-y-3">{notifications.slice(0, 25).map((notification) => {
                const payload = notification.payload ?? {};
                const domainId = String(payload.domain_id ?? "");
                return <div key={notification.id} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-2"><div><strong className="text-xs">{domainName.get(domainId) || "Monitoring"}</strong><span className="block text-xs text-slate-400">{notification.event_type} · {formatDate(notification.created_at)}</span></div><div className="flex items-center gap-2"><Badge tone={notificationTone(notification.status)}>{notification.status}</Badge>{notification.status === "FAILED" ? <button type="button" disabled={busyId === notification.id} onClick={() => retryNotification(notification)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50" title="Opnieuw proberen"><RotateCcw size={14} /></button> : null}</div></div>{notification.error_message ? <p className="mt-2 text-xs leading-5 text-red-600">{notification.error_message}</p> : null}</div>;
              })}</div>}
            </Panel>

            <div className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-emerald-300"><ShieldCheck size={16} /><strong className="text-sm">Read-only infrastructure monitoring</strong></div>
              <p className="text-xs leading-5 text-slate-400">De monitor controleert en rapporteert zelfstandig. DNS-, hosting- en mailrecords worden nooit automatisch gewijzigd zonder expliciete goedkeuring.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, caption, tone }: { label: string; value: string | number; icon: typeof ServerCog; caption: string; tone: "neutral" | "success" | "warning" | "danger" }) {
  const iconTone = { neutral: "bg-slate-100 text-slate-700", success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-700", danger: "bg-red-50 text-red-700" }[tone];
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-lg ${iconTone}`}><Icon size={18} /></div><p className="text-sm text-slate-500">{label}</p><strong className="mt-1 block text-2xl font-bold">{value}</strong><span className="mt-1 block text-xs text-slate-400">{caption}</span></article>;
}

function StatusRow({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><span className="text-slate-500">{label}</span><span className={`inline-flex items-center gap-1.5 text-right text-xs font-semibold ${ok ? "text-emerald-700" : "text-amber-700"}`}>{ok ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}{value}</span></div>;
}
