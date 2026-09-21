import AdminLayout from "./AdminLayout";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CircleAlert,
  Download,
  ExternalLink,
  MessageCircle,
  RefreshCw,
  ScanLine,
} from "lucide-react";
import {
  getAuditFunnelStats,
  type AuditFunnelCounts,
  type AuditFunnelDailyPoint,
  type AuditFunnelStats,
} from "./audit-funnel-data";

const PERIODS = [7, 30, 90] as const;

function count(counts: AuditFunnelCounts, event: keyof AuditFunnelCounts) {
  return Number(counts[event] || 0);
}

function ratio(numerator: number, denominator: number) {
  if (!denominator) return null;
  return (numerator / denominator) * 100;
}

function percent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return `${value.toLocaleString("nl-NL", { maximumFractionDigits: 1 })}%`;
}

function MetricCard({ label, value, caption }: { label: string; value: number | string; caption: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <strong className="mt-2 block text-3xl font-bold tracking-tight text-slate-950">{value}</strong>
      <span className="mt-2 block text-xs leading-5 text-slate-400">{caption}</span>
    </article>
  );
}

function FunnelRow({
  label,
  value,
  conversion,
  note,
}: {
  label: string;
  value: number;
  conversion?: number | null;
  note: string;
}) {
  return (
    <div className="grid gap-2 border-b border-slate-100 py-4 last:border-0 md:grid-cols-[1fr_110px_130px] md:items-center">
      <div>
        <strong className="block text-sm text-slate-900">{label}</strong>
        <span className="mt-1 block text-xs text-slate-400">{note}</span>
      </div>
      <div className="text-sm font-semibold text-slate-900 md:text-right">{value.toLocaleString("nl-NL")}</div>
      <div className="text-xs font-semibold text-slate-500 md:text-right">
        {conversion === undefined ? "Startpunt" : `${percent(conversion)} van vorige stap`}
      </div>
    </div>
  );
}

type DailyRow = {
  date: string;
  pageViews: number;
  auditStarted: number;
  results: number;
  contacts: number;
};

function dailyRows(points: AuditFunnelDailyPoint[]): DailyRow[] {
  const map = new Map<string, DailyRow>();
  for (const point of points) {
    const row = map.get(point.date) ?? {
      date: point.date,
      pageViews: 0,
      auditStarted: 0,
      results: 0,
      contacts: 0,
    };
    if (point.event === "PAGE_VIEW") row.pageViews += point.count;
    if (point.event === "AUDIT_STARTED") row.auditStarted += point.count;
    if (point.event === "RESULT_VIEWED") row.results += point.count;
    if (point.event === "PLANNING_CLICK" || point.event === "WHATSAPP_CLICK") row.contacts += point.count;
    map.set(point.date, row);
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export default function GrowthAnalytics() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [stats, setStats] = useState<AuditFunnelStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStats(await getAuditFunnelStats(days));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Funneldata kon niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = stats?.counts ?? {};
  const pageViews = count(counts, "PAGE_VIEW");
  const formStarts = count(counts, "FORM_STARTED");
  const auditStarts = count(counts, "AUDIT_STARTED");
  const auditFailures = count(counts, "AUDIT_FAILED");
  const results = count(counts, "RESULT_VIEWED");
  const downloads = count(counts, "PDF_DOWNLOADED");
  const planningClicks = count(counts, "PLANNING_CLICK");
  const whatsappClicks = count(counts, "WHATSAPP_CLICK");
  const contactActions = planningClicks + whatsappClicks;

  const rows = useMemo(() => dailyRows(stats?.daily ?? []), [stats?.daily]);
  const displayedRows = rows.slice(0, Math.min(days, 14));

  return (
    <AdminLayout actions={<button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Vernieuwen</button>}>

      <main className="mx-auto max-w-7xl p-4 md:p-7">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Online Groei Audit</span>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Funnel & conversie</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Geaggregeerde first-party events zonder bezoekers-ID, cookies, IP-adres of sessieprofielen. Ratio&apos;s zijn gebaseerd op eventaantallen en zijn daarom geen unieke-bezoekerconversie.
            </p>
          </div>
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
            {PERIODS.map((period) => (
              <button
                type="button"
                key={period}
                onClick={() => setDays(period)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${days === period ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
              >
                {period} dagen
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Auditpagina bekeken" value={loading ? "—" : pageViews.toLocaleString("nl-NL")} caption="PAGE_VIEW events in deze periode" />
          <MetricCard label="Audit gestart" value={loading ? "—" : auditStarts.toLocaleString("nl-NL")} caption={`${percent(ratio(auditStarts, pageViews))} ten opzichte van page views`} />
          <MetricCard label="Resultaat bekeken" value={loading ? "—" : results.toLocaleString("nl-NL")} caption={`${percent(ratio(results, auditStarts))} ten opzichte van gestarte audits`} />
          <MetricCard label="Contactacties" value={loading ? "—" : contactActions.toLocaleString("nl-NL")} caption={`${planningClicks} planning · ${whatsappClicks} WhatsApp`} />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <ScanLine size={18} className="text-slate-500" />
              <h2 className="text-lg font-semibold">Funnelstappen</h2>
            </div>
            <p className="mb-3 text-xs leading-5 text-slate-400">Een bezoeker kan events meer dan één keer veroorzaken. Gebruik dit om trends en duidelijke uitvalpunten te herkennen, niet als persoonsmeting.</p>
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-400">Funnel laden…</div>
            ) : (
              <div>
                <FunnelRow label="Auditpagina bekeken" value={pageViews} note="Startpunt van de auditfunnel" />
                <FunnelRow label="Formulier gestart" value={formStarts} conversion={ratio(formStarts, pageViews)} note="Eerste interactie met het formulier" />
                <FunnelRow label="Audit aangevraagd" value={auditStarts} conversion={ratio(auditStarts, formStarts)} note="Backend-audit succesvol gestart" />
                <FunnelRow label="Resultaat bekeken" value={results} conversion={ratio(results, auditStarts)} note="Auditresultaat in de browser geopend" />
                <FunnelRow label="Contactactie" value={contactActions} conversion={ratio(contactActions, results)} note="Planning of WhatsApp vanuit de auditflow" />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <BarChart3 size={18} className="text-slate-500" />
              <h2 className="text-lg font-semibold">Acties na resultaat</h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-600"><Download size={15} /> PDF gedownload</span>
                <strong>{downloads.toLocaleString("nl-NL")}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-600"><ExternalLink size={15} /> Planning geopend</span>
                <strong>{planningClicks.toLocaleString("nl-NL")}</strong>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-slate-600"><MessageCircle size={15} /> WhatsApp geopend</span>
                <strong>{whatsappClicks.toLocaleString("nl-NL")}</strong>
              </div>
              <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${auditFailures ? "bg-amber-50" : "bg-emerald-50"}`}>
                <span className="flex items-center gap-2 text-sm text-slate-600"><CircleAlert size={15} /> Auditfouten</span>
                <strong>{auditFailures.toLocaleString("nl-NL")}</strong>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Dagtrend</h2>
            <p className="mt-1 text-xs text-slate-400">Maximaal de laatste 14 dagen binnen de gekozen periode.</p>
          </div>
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">Dagtrend laden…</div>
          ) : displayedRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">
              Nog geen echte funnel-events in deze periode. De meting staat nu live; data verschijnt zodra bezoekers de audit gebruiken.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-3 font-semibold">Datum</th>
                    <th className="pb-3 text-right font-semibold">Page views</th>
                    <th className="pb-3 text-right font-semibold">Audits gestart</th>
                    <th className="pb-3 text-right font-semibold">Resultaten</th>
                    <th className="pb-3 text-right font-semibold">Contactacties</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedRows.map((row) => (
                    <tr key={row.date} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 font-medium text-slate-700">{new Date(`${row.date}T12:00:00`).toLocaleDateString("nl-NL", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="py-3 text-right">{row.pageViews.toLocaleString("nl-NL")}</td>
                      <td className="py-3 text-right">{row.auditStarted.toLocaleString("nl-NL")}</td>
                      <td className="py-3 text-right">{row.results.toLocaleString("nl-NL")}</td>
                      <td className="py-3 text-right">{row.contacts.toLocaleString("nl-NL")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </AdminLayout>
  );
}

