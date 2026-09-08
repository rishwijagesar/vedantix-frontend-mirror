import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Ban, CheckCircle2, CircleDollarSign, History, Plus, RefreshCw, WalletCards } from "lucide-react";
import type { Customer } from "./control-center-data";
import { getInvoice, listInvoices, type Invoice } from "./sales-billing-data";
import {
  PAYMENT_METHOD_LABELS,
  listInvoicePayments,
  refreshOverdueInvoices,
  registerInvoicePayment,
  voidInvoicePayment,
  type InvoicePayment,
  type PaymentMethod,
} from "./payments-data";

const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const date = new Intl.DateTimeFormat("nl-NL");

function statusClass(status: string) {
  if (status === "PAID") return "bg-emerald-50 text-emerald-700";
  if (status === "OVERDUE") return "bg-red-50 text-red-700";
  if (status === "PARTIALLY_PAID") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function Status({ value }: { value: string }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(value)}`}>{value}</span>;
}

function remaining(invoice: Invoice) {
  return Math.max(0, Number(invoice.total_incl_vat || 0) - Number(invoice.amount_paid || 0));
}

export function PaymentsModule({ customers }: { customers: Customer[] }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadInvoices() {
    setLoading(true);
    setError(null);
    try {
      await refreshOverdueInvoices();
      const rows = await listInvoices();
      setInvoices(rows);
      if (selected) {
        const next = await getInvoice(selected.id);
        setSelected(next);
        setPayments(await listInvoicePayments(next.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Betalingen konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  async function openInvoice(invoice: Invoice) {
    setError(null);
    setNotice(null);
    try {
      const next = await getInvoice(invoice.id);
      setSelected(next);
      setPayments(await listInvoicePayments(next.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Factuur kon niet worden geopend.");
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  const customerName = (customerId: string) =>
    customers.find((customer) => customer.id === customerId)?.company_name || "Onbekende klant";

  const stats = useMemo(() => {
    const finalized = invoices.filter((invoice) => invoice.status !== "DRAFT" && invoice.status !== "CREDITED");
    return {
      received: finalized.reduce((sum, invoice) => sum + Number(invoice.amount_paid || 0), 0),
      outstanding: finalized.reduce((sum, invoice) => sum + remaining(invoice), 0),
      overdue: finalized.filter((invoice) => invoice.status === "OVERDUE").reduce((sum, invoice) => sum + remaining(invoice), 0),
      overdueCount: finalized.filter((invoice) => invoice.status === "OVERDUE").length,
    };
  }, [invoices]);

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    try {
      await registerInvoicePayment({
        invoiceId: selected.id,
        amount: Number(form.get("amount") || 0),
        paymentDate: String(form.get("payment_date") || new Date().toISOString().slice(0, 10)),
        method: String(form.get("method") || "BANK_TRANSFER") as PaymentMethod,
        reference: String(form.get("reference") || "") || null,
        notes: String(form.get("notes") || "") || null,
      });
      setNotice("Betaling geregistreerd en factuurstatus bijgewerkt.");
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Betaling registreren mislukt.");
    } finally {
      setBusy(false);
    }
  }

  async function voidPayment(payment: InvoicePayment) {
    const reason = window.prompt("Waarom wil je deze betaling intrekken? Dit blijft zichtbaar in de historie.");
    if (!reason?.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await voidInvoicePayment(payment.id, reason.trim());
      setNotice("Betaling ingetrokken. Het auditrecord blijft bewaard.");
      await loadInvoices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Betaling intrekken mislukt.");
    } finally {
      setBusy(false);
    }
  }

  if (selected) {
    const outstanding = remaining(selected);
    const canPay = selected.status !== "DRAFT" && selected.status !== "CREDITED" && outstanding > 0;
    return <div className="space-y-5">
      <button type="button" onClick={() => { setSelected(null); setPayments([]); setError(null); setNotice(null); }} className="text-sm font-semibold text-slate-600">← Terug naar betalingen</button>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">{selected.invoice_number || "Concept"}</span>
            <h2 className="mt-1 text-xl font-semibold">{customerName(selected.customer_id)}</h2>
            <p className="mt-1 text-sm text-slate-500">Vervaldatum {selected.due_date ? date.format(new Date(`${selected.due_date}T00:00:00`)) : "—"}</p>
          </div>
          <Status value={selected.status}/>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-500">Factuurtotaal</span><strong className="mt-1 block text-xl">{money.format(Number(selected.total_incl_vat))}</strong></div>
          <div className="rounded-xl bg-emerald-50 p-4"><span className="text-xs text-emerald-700">Ontvangen</span><strong className="mt-1 block text-xl text-emerald-800">{money.format(Number(selected.amount_paid))}</strong></div>
          <div className={`rounded-xl p-4 ${outstanding > 0 ? "bg-amber-50" : "bg-slate-50"}`}><span className="text-xs text-slate-600">Openstaand</span><strong className="mt-1 block text-xl">{money.format(outstanding)}</strong></div>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {notice ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}</div> : null}

      {canPay ? <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4"><h3 className="font-semibold">Betaling registreren</h3><p className="mt-1 text-sm text-slate-500">Elke betaling wordt als afzonderlijke boeking bewaard.</p></div>
        <form key={`${selected.id}-${selected.amount_paid}`} onSubmit={submitPayment} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-medium text-slate-700">Bedrag<input name="amount" type="number" min="0.01" max={outstanding} step="0.01" defaultValue={outstanding.toFixed(2)} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
          <label className="text-sm font-medium text-slate-700">Betaaldatum<input name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
          <label className="text-sm font-medium text-slate-700">Methode<select name="method" defaultValue="BANK_TRANSFER" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">{Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Referentie<input name="reference" placeholder="Bijv. bankreferentie" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
          <label className="text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-3">Notitie<input name="notes" placeholder="Optionele interne notitie" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
          <div className="flex items-end"><button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Plus size={15}/>{busy ? "Boeken…" : "Betaling boeken"}</button></div>
        </form>
      </section> : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2"><History size={18}/><div><h3 className="font-semibold">Betalingshistorie</h3><p className="text-sm text-slate-500">Boekingen worden niet verwijderd; correcties worden ingetrokken met reden.</p></div></div>
        {payments.length ? <div className="space-y-2">{payments.map((payment) => <div key={payment.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${payment.voided_at ? "border-slate-100 bg-slate-50 opacity-70" : "border-slate-100"}`}>
          <div><strong className={payment.voided_at ? "line-through" : ""}>{money.format(Number(payment.amount))}</strong><span className="ml-2 text-xs text-slate-500">{date.format(new Date(`${payment.payment_date}T00:00:00`))} · {PAYMENT_METHOD_LABELS[payment.method] || payment.method}</span><span className="mt-1 block text-xs text-slate-400">{payment.reference || "Geen referentie"}{payment.notes ? ` · ${payment.notes}` : ""}</span>{payment.voided_at ? <span className="mt-1 block text-xs font-medium text-red-600">Ingetrokken: {payment.void_reason || "geen reden"}</span> : null}</div>
          {!payment.voided_at ? <button type="button" disabled={busy} onClick={() => voidPayment(payment)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-40"><Ban size={13}/> Intrekken</button> : <span className="text-xs font-semibold text-slate-400">AUDIT</span>}
        </div>)}</div> : <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center text-sm text-slate-500">Nog geen betalingen geregistreerd.</div>}
      </section>
    </div>;
  }

  const visibleInvoices = invoices.filter((invoice) => invoice.status !== "DRAFT");
  return <div className="space-y-5">
    <section className="grid gap-4 sm:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><CircleDollarSign className="mb-3" size={19}/><span className="text-sm text-slate-500">Ontvangen</span><strong className="mt-1 block text-2xl">{money.format(stats.received)}</strong></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><WalletCards className="mb-3" size={19}/><span className="text-sm text-slate-500">Openstaand</span><strong className="mt-1 block text-2xl">{money.format(stats.outstanding)}</strong></article>
      <article className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm"><CheckCircle2 className="mb-3 text-red-600" size={19}/><span className="text-sm text-slate-500">Achterstallig</span><strong className="mt-1 block text-2xl text-red-700">{money.format(stats.overdue)}</strong><span className="text-xs text-slate-400">{stats.overdueCount} factuur/facturen</span></article>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Betalingen & openstaande facturen</h2><p className="mt-1 text-sm text-slate-500">Overdue-status wordt bij het openen en vernieuwen automatisch herberekend.</p></div><button type="button" onClick={loadInvoices} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Vernieuwen</button></div>
      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {visibleInvoices.length ? <div className="space-y-2">{visibleInvoices.map((invoice) => <button type="button" key={invoice.id} onClick={() => openInvoice(invoice)} className="grid w-full gap-3 rounded-xl border border-slate-100 px-4 py-3 text-left hover:bg-slate-50 sm:grid-cols-[1fr_auto_auto] sm:items-center">
        <div><strong className="text-sm">{invoice.invoice_number || "Concept"}</strong><span className="block text-xs text-slate-400">{customerName(invoice.customer_id)} · vervalt {invoice.due_date || "—"}</span></div>
        <div className="text-left sm:text-right"><span className="block text-xs text-slate-400">Openstaand</span><strong>{money.format(remaining(invoice))}</strong></div>
        <Status value={invoice.status}/>
      </button>)}</div> : <div className="rounded-xl border border-dashed border-slate-200 px-5 py-8 text-center text-sm text-slate-500">Nog geen gefinaliseerde facturen.</div>}
    </section>
  </div>;
}
