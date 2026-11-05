import { useEffect, useState, type FormEvent } from "react";
import { CalendarClock, CheckCircle2, Pause, Play, RefreshCw, Repeat2, XCircle } from "lucide-react";
import type { Customer } from "./control-center-data";
import type { BillingItem, Quote } from "./sales-billing-data";
import {
  activateQuoteBilling,
  estimateSubscriptionInvoice,
  listRecurringBillingRuns,
  listSubscriptionItems,
  listSubscriptions,
  quoteRecurringTypes,
  updateSubscription,
  type QuoteBillingActivationResult,
  type RecurringBillingRun,
  type Subscription,
  type SubscriptionItem,
} from "./recurring-billing-data";

const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

function isoDateAfter(months: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setMonth(date.getMonth() + months);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateNl(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function statusLabel(status: Subscription["status"]) {
  return status === "ACTIVE" ? "Actief" : status === "PAUSED" ? "Gepauzeerd" : "Gestopt";
}

export function QuoteBillingActivation({ quote, items, onActivated }: { quote: Quote; items: BillingItem[]; onActivated: () => Promise<void> }) {
  const types = quoteRecurringTypes(items);
  const [monthlyStartDate, setMonthlyStartDate] = useState(isoDateAfter(1));
  const [yearlyStartDate, setYearlyStartDate] = useState(isoDateAfter(12));
  const [autoFinalize, setAutoFinalize] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QuoteBillingActivationResult | null>(null);

  if (quote.billing_activated_at) {
    return <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
      <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 shrink-0" size={18}/><div><strong className="block">Facturatie is geactiveerd</strong><span>De eenmalige factuur en/of abonnementen zijn al vanuit deze offerte aangemaakt. Beheer terugkerende kosten via Abonnementen.</span></div></div>
    </section>;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(null); setResult(null);
    try {
      const activation = await activateQuoteBilling({
        quoteId: quote.id,
        monthlyStartDate: types.hasMonthly ? monthlyStartDate : null,
        yearlyStartDate: types.hasYearly ? yearlyStartDate : null,
        autoFinalize,
      });
      setResult(activation);
      await onActivated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Facturatie activeren mislukt");
    } finally {
      setLoading(false);
    }
  }

  return <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4">
    <div className="mb-4"><h3 className="font-semibold text-slate-950">Facturatie activeren</h3><p className="mt-1 text-sm text-slate-600">Eenmalige regels worden een factuurconcept. Maand- en jaarregels worden aparte abonnementen met hun eigen volgende factuurdatum.</p></div>
    {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
    {result ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Facturatie aangemaakt.{result.immediate_invoice_id ? " Eenmalig factuurconcept is klaar." : ""}{result.monthly_subscription_number ? ` ${result.monthly_subscription_number} is maandelijks geactiveerd.` : ""}{result.yearly_subscription_number ? ` ${result.yearly_subscription_number} is jaarlijks geactiveerd.` : ""}</div> : null}
    <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-3"><span className="text-xs font-medium uppercase tracking-[.12em] text-slate-400">Eenmalig</span><strong className="mt-1 block text-sm">{types.hasOneTime ? "Factuurconcept bij activatie" : "Geen eenmalige kosten"}</strong></div>
      {types.hasMonthly ? <label className="text-sm font-medium text-slate-700">Eerste maandfactuur<input type="date" value={monthlyStartDate} onChange={(e) => setMonthlyStartDate(e.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"/></label> : <div className="rounded-xl border border-slate-200 bg-white p-3"><span className="text-xs font-medium uppercase tracking-[.12em] text-slate-400">Maandelijks</span><strong className="mt-1 block text-sm">Geen maandelijkse kosten</strong></div>}
      {types.hasYearly ? <label className="text-sm font-medium text-slate-700">Eerste jaarfactuur<input type="date" value={yearlyStartDate} onChange={(e) => setYearlyStartDate(e.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"/></label> : <div className="rounded-xl border border-slate-200 bg-white p-3"><span className="text-xs font-medium uppercase tracking-[.12em] text-slate-400">Jaarlijks</span><strong className="mt-1 block text-sm">Geen jaarlijkse kosten</strong></div>}
      <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700"><input type="checkbox" checked={autoFinalize} onChange={(e) => setAutoFinalize(e.target.checked)} className="h-4 w-4"/><span><strong className="block">Automatisch finaliseren</strong><small className="text-slate-500">Terugkerende facturen krijgen automatisch een FAC-nummer.</small></span></label>
      {quote.discount_type === "FIXED" && (types.hasMonthly || types.hasYearly) ? <div className="md:col-span-2 xl:col-span-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Een vaste algemene korting wordt bij terugkerende kosten alleen op de eerste factuur van dat abonnement toegepast. Procentuele kortingen blijven op iedere termijn van toepassing.</div> : null}
      <div className="md:col-span-2 xl:col-span-4"><button disabled={loading} className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{loading ? "Activeren…" : types.hasMonthly || types.hasYearly ? "Facturatie & abonnementen activeren" : "Factuurconcept maken"}</button></div>
    </form>
  </section>;
}

export function SubscriptionsModule({ customers }: { customers: Customer[] }) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [items, setItems] = useState<SubscriptionItem[]>([]);
  const [runs, setRuns] = useState<RecurringBillingRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try {
      const [subscriptionData, itemData, runData] = await Promise.all([listSubscriptions(), listSubscriptionItems(), listRecurringBillingRuns(8)]);
      setSubscriptions(subscriptionData); setItems(itemData); setRuns(runData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Abonnementen laden mislukt");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const active = subscriptions.filter((subscription) => subscription.status === "ACTIVE");
  const monthly = active.filter((subscription) => subscription.billing_type === "MONTHLY").reduce((sum, subscription) => sum + estimateSubscriptionInvoice(subscription, items).totalInclVat, 0);
  const yearly = active.filter((subscription) => subscription.billing_type === "YEARLY").reduce((sum, subscription) => sum + estimateSubscriptionInvoice(subscription, items).totalInclVat, 0);
  const inThirtyDays = new Date(); inThirtyDays.setDate(inThirtyDays.getDate() + 30);
  const dueSoon = active.filter((subscription) => new Date(`${subscription.next_invoice_date}T12:00:00`) <= inThirtyDays).length;

  return <div className="space-y-5">
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Actieve abonnementen" value={String(active.length)} caption="Maand en jaar samen"/>
      <Metric label="Maandelijks" value={`${money.format(monthly)} p/m`} caption="Geschatte volgende termijnen"/>
      <Metric label="Jaarlijks" value={`${money.format(yearly)} p/j`} caption="Geschatte volgende termijnen"/>
      <Metric label="Binnen 30 dagen" value={String(dueSoon)} caption="Volgende factuurmomenten"/>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Abonnementen</h2><p className="mt-1 text-sm text-slate-500">Dagelijkse verwerking om 06:30 UTC. Facturen worden gegenereerd op of na de ingestelde volgende factuurdatum.</p></div><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Vernieuwen</button></div>
      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      {loading && !subscriptions.length ? <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Laden…</div> : subscriptions.length ? <div className="space-y-3">{subscriptions.map((subscription) => <SubscriptionCard key={subscription.id} subscription={subscription} items={items} customer={customers.find((customer) => customer.id === subscription.customer_id)} onChanged={load}/>)}</div> : <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Nog geen abonnementen. Plan jaarfacturen vanuit een definitieve factuur, of activeer een geaccepteerde offerte met maand- of jaarregels.</div>}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Recente automatische runs</h2><p className="mb-4 mt-1 text-sm text-slate-500">Auditlog van de recurring-billing scheduler.</p>
      {runs.length ? <div className="space-y-2">{runs.map((run) => <div key={run.id} className="grid gap-2 rounded-xl border border-slate-100 px-4 py-3 text-sm md:grid-cols-[1fr_auto_auto_auto]"><div><strong>{run.status}</strong><span className="block text-xs text-slate-400">{run.trigger_source} · {dateNl(run.as_of_date)}</span></div><span>{run.subscriptions_processed} verwerkt</span><span>{run.invoices_created} facturen</span><span className={run.errors?.length ? "text-red-600" : "text-emerald-600"}>{run.errors?.length || 0} fouten</span></div>)}</div> : <div className="text-sm text-slate-500">Nog geen runs.</div>}
    </section>
  </div>;
}

function Metric({ label, value, caption }: { label: string; value: string; caption: string }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"><Repeat2 size={18}/></div><p className="text-sm text-slate-500">{label}</p><strong className="mt-1 block text-2xl font-bold">{value}</strong><span className="mt-1 block text-xs text-slate-400">{caption}</span></article>;
}

function SubscriptionCard({ subscription, items, customer, onChanged }: { subscription: Subscription; items: SubscriptionItem[]; customer?: Customer | undefined; onChanged: () => Promise<void> }) {
  const [nextDate, setNextDate] = useState(subscription.next_invoice_date);
  const [saving, setSaving] = useState(false);
  const estimate = estimateSubscriptionInvoice(subscription, items);
  const standardEstimate = estimateSubscriptionInvoice({ ...subscription, last_invoice_date: subscription.last_invoice_date || "already-billed" }, items);
  const ownItems = items.filter((item) => item.subscription_id === subscription.id);

  useEffect(() => { setNextDate(subscription.next_invoice_date); }, [subscription.next_invoice_date]);

  async function saveDate() {
    setSaving(true);
    try { await updateSubscription(subscription.id, { next_invoice_date: nextDate }); await onChanged(); }
    finally { setSaving(false); }
  }

  async function setStatus(status: Subscription["status"]) {
    setSaving(true);
    try { await updateSubscription(subscription.id, { status }); await onChanged(); }
    finally { setSaving(false); }
  }

  return <article className="rounded-2xl border border-slate-200 p-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><div className="flex flex-wrap items-center gap-2"><strong>{subscription.subscription_number}</strong><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${subscription.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : subscription.status === "PAUSED" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{statusLabel(subscription.status)}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{subscription.billing_type === "MONTHLY" ? "Maandelijks" : "Jaarlijks"}</span></div><span className="mt-1 block text-sm text-slate-500">{customer?.company_name || "Klant"} · gestart {dateNl(subscription.start_date)}</span></div>
      <div className="text-right"><span className="block text-xs text-slate-400">Volgende factuur</span><strong className="text-xl">{money.format(estimate.totalInclVat)}{subscription.billing_type === "MONTHLY" ? " p/m" : " p/j"}</strong>{estimate.totalInclVat !== standardEstimate.totalInclVat ? <span className="block text-xs text-slate-400">daarna {money.format(standardEstimate.totalInclVat)}</span> : null}</div>
    </div>

    <details className="mt-4 rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-700">{ownItems.length} abonnementregel(s)</summary><div className="mt-3 space-y-2">{ownItems.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span>{item.description} × {Number(item.quantity).toLocaleString("nl-NL")}</span><strong>{money.format(Number(item.line_total_incl_vat))}</strong></div>)}</div></details>

    <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
      <label className="text-sm font-medium text-slate-700">Volgende factuurdatum<input type="date" value={nextDate} disabled={subscription.status === "CANCELLED"} onChange={(e) => setNextDate(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 disabled:bg-slate-50"/></label>
      <button type="button" disabled={saving || nextDate === subscription.next_invoice_date || subscription.status === "CANCELLED"} onClick={saveDate} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Datum opslaan</button>
      <label className="flex items-center gap-2 pb-2 text-sm text-slate-700"><input type="checkbox" checked={subscription.auto_finalize} disabled={subscription.status === "CANCELLED"} onChange={async (e) => { setSaving(true); try { await updateSubscription(subscription.id, { auto_finalize: e.target.checked }); await onChanged(); } finally { setSaving(false); } }}/><span>Automatisch finaliseren</span></label>
    </div>

    <div className="mt-3 flex flex-wrap gap-2">
      {subscription.status === "ACTIVE" ? <button disabled={saving} onClick={() => setStatus("PAUSED")} className="inline-flex items-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700"><Pause size={14}/> Pauzeren</button> : null}
      {subscription.status === "PAUSED" ? <button disabled={saving} onClick={() => setStatus("ACTIVE")} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700"><Play size={14}/> Hervatten</button> : null}
      {subscription.status !== "CANCELLED" ? <button disabled={saving} onClick={() => { if (confirm(`${subscription.subscription_number} definitief stoppen?`)) setStatus("CANCELLED"); }} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"><XCircle size={14}/> Stoppen</button> : null}
      <span className="inline-flex items-center gap-2 px-2 py-2 text-xs text-slate-400"><CalendarClock size={14}/> Laatste factuur: {dateNl(subscription.last_invoice_date)}</span>
    </div>
  </article>;
}

