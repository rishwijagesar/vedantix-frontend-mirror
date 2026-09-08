import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, CreditCard, Printer, ReceiptText, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type InvoiceItem = {
  position: number;
  code: string | null;
  description: string;
  billing_type: "ONE_TIME" | "MONTHLY" | "YEARLY";
  quantity: number;
  unit_price_ex_vat: number;
  vat_rate: number;
  line_discount_ex_vat: number;
  line_total_ex_vat: number;
  line_vat: number;
  line_total_incl_vat: number;
};

type PublicInvoiceData = {
  invoice_number: string;
  status: "SENT" | "PARTIALLY_PAID" | "PAID" | "OVERDUE" | "CREDITED";
  invoice_date: string | null;
  delivery_date: string | null;
  due_date: string | null;
  title: string;
  notes: string | null;
  payment_reference: string | null;
  subtotal_ex_vat: number;
  document_discount_ex_vat: number;
  total_ex_vat: number;
  vat_total: number;
  total_incl_vat: number;
  amount_paid: number;
  amount_outstanding: number;
  company: Record<string, string>;
  customer: Record<string, string>;
  items: InvoiceItem[];
};

const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const day = new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "long", year: "numeric" });

function displayDate(value: string | null) {
  if (!value) return "—";
  return day.format(new Date(`${value}T00:00:00`));
}

function statusMeta(status: PublicInvoiceData["status"]) {
  if (status === "PAID") return { label: "Betaald", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (status === "OVERDUE") return { label: "Vervallen", cls: "bg-red-50 text-red-700 border-red-200" };
  if (status === "PARTIALLY_PAID") return { label: "Gedeeltelijk betaald", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  if (status === "CREDITED") return { label: "Gecrediteerd", cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return { label: "Openstaand", cls: "bg-blue-50 text-blue-700 border-blue-200" };
}

export default function PublicInvoice({ token }: { token: string }) {
  const [invoice, setInvoice] = useState<PublicInvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentAvailable, setPaymentAvailable] = useState(false);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.rpc("get_public_invoice", { p_token: token }).then(({ data, error: rpcError }) => {
      if (!active) return;
      if (rpcError || !data) setError("Deze factuurlink is ongeldig of niet meer beschikbaar.");
      else setInvoice(data as PublicInvoiceData);
      setLoading(false);
    });
    supabase.functions.invoke("mollie-payment", { body: { action: "status", token } }).then(({ data }) => {
      if (active) setPaymentAvailable(Boolean(data?.available));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [token]);

  const grouped = useMemo(() => {
    const groups: Record<string, InvoiceItem[]> = { ONE_TIME: [], MONTHLY: [], YEARLY: [] };
    for (const item of invoice?.items ?? []) groups[item.billing_type || "ONE_TIME"].push(item);
    return groups;
  }, [invoice]);

  async function payOnline() {
    setPaymentBusy(true); setPaymentError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke("mollie-payment", { body: { action: "create", token } });
      if (invokeError || !data?.checkout_url) throw new Error(data?.error || "Online betaling kon niet worden gestart.");
      window.location.assign(String(data.checkout_url));
    } catch (e) {
      setPaymentError(e instanceof Error ? e.message : "Online betaling kon niet worden gestart.");
      setPaymentBusy(false);
    }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">Factuur laden…</div>;
  if (error || !invoice) return <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6"><div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm"><ReceiptText className="mx-auto mb-4 text-red-500"/><h1 className="text-xl font-bold">Factuur niet beschikbaar</h1><p className="mt-2 text-sm text-slate-500">{error}</p></div></div>;

  const company = invoice.company ?? {};
  const customer = invoice.customer ?? {};
  const status = statusMeta(invoice.status);
  const billingGroups = [
    ["ONE_TIME", "Eenmalig"],
    ["MONTHLY", "Maandelijks"],
    ["YEARLY", "Jaarlijks"],
  ] as const;

  return <div className="min-h-screen bg-slate-100 px-4 py-8 text-slate-950 print:bg-white print:p-0">
    <main className="mx-auto max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <header className="bg-slate-950 px-6 py-7 text-white md:px-10">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div><strong className="text-2xl">Vedantix</strong><span className="mt-1 block text-sm text-slate-400">{company.trade_name || "Vedantix"} · {company.email || "info@vedantix.nl"}</span></div>
          <div className="text-right"><span className="text-xs uppercase tracking-[.18em] text-slate-400">Factuur</span><h1 className="mt-1 text-2xl font-bold">{invoice.invoice_number}</h1></div>
        </div>
      </header>

      <div className="space-y-8 p-6 md:p-10">
        <section className="flex flex-wrap items-start justify-between gap-6">
          <div><span className="text-xs font-semibold uppercase tracking-[.15em] text-slate-400">Factuur aan</span><h2 className="mt-2 text-lg font-semibold">{customer.company_name || customer.contact_name || "Klant"}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{customer.contact_name && customer.company_name ? <>{customer.contact_name}<br/></> : null}{customer.address_line1 ? <>{customer.address_line1}<br/></> : null}{customer.postal_code || customer.city ? <>{customer.postal_code} {customer.city}<br/></> : null}{customer.country || ""}</p></div>
          <div className="min-w-56 rounded-2xl bg-slate-50 p-4 text-sm"><div className="flex justify-between gap-6"><span className="text-slate-500">Factuurdatum</span><strong>{displayDate(invoice.invoice_date)}</strong></div><div className="mt-2 flex justify-between gap-6"><span className="text-slate-500">Vervaldatum</span><strong>{displayDate(invoice.due_date)}</strong></div><div className="mt-3"><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.cls}`}>{status.label}</span></div></div>
        </section>

        <section className="space-y-5">
          {billingGroups.map(([type, label]) => grouped[type].length ? <div key={type}><div className="mb-2 text-xs font-semibold uppercase tracking-[.14em] text-slate-400">{label}</div><div className="overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[620px] text-sm"><thead className="bg-slate-50 text-left text-xs uppercase text-slate-400"><tr><th className="px-4 py-3">Omschrijving</th><th className="px-4 py-3 text-right">Aantal</th><th className="px-4 py-3 text-right">Excl. btw</th><th className="px-4 py-3 text-right">Btw</th><th className="px-4 py-3 text-right">Incl. btw</th></tr></thead><tbody>{grouped[type].map((item, index) => <tr key={`${type}-${index}`} className="border-t border-slate-100"><td className="px-4 py-3 font-medium">{item.description}</td><td className="px-4 py-3 text-right">{Number(item.quantity)}</td><td className="px-4 py-3 text-right">{money.format(Number(item.line_total_ex_vat))}</td><td className="px-4 py-3 text-right">{money.format(Number(item.line_vat))}</td><td className="px-4 py-3 text-right font-semibold">{money.format(Number(item.line_total_incl_vat))}</td></tr>)}</tbody></table></div></div> : null)}
        </section>

        <section className="ml-auto max-w-md space-y-2 rounded-2xl bg-slate-50 p-5 text-sm"><div className="flex justify-between"><span>Totaal excl. btw</span><strong>{money.format(Number(invoice.total_ex_vat))}</strong></div><div className="flex justify-between"><span>Btw</span><strong>{money.format(Number(invoice.vat_total))}</strong></div><div className="flex justify-between border-t border-slate-200 pt-3 text-lg"><span>Totaal incl. btw</span><strong>{money.format(Number(invoice.total_incl_vat))}</strong></div>{Number(invoice.amount_paid) > 0 ? <div className="flex justify-between text-emerald-700"><span>Reeds betaald</span><strong>− {money.format(Number(invoice.amount_paid))}</strong></div> : null}<div className="flex justify-between border-t border-slate-200 pt-3 text-lg"><span>Openstaand</span><strong>{money.format(Number(invoice.amount_outstanding))}</strong></div></section>

        {Number(invoice.amount_outstanding) > 0 && invoice.status !== "CREDITED" ? <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><div className="flex gap-3"><Clock3 className="mt-0.5 shrink-0 text-blue-700" size={20}/><div className="min-w-0 flex-1"><h3 className="font-semibold text-blue-950">Betaalgegevens</h3><p className="mt-2 text-sm leading-6 text-blue-900">Maak {money.format(Number(invoice.amount_outstanding))} over{company.iban ? <> naar <strong>{company.iban}</strong></> : null}{invoice.payment_reference ? <> onder vermelding van <strong>{invoice.payment_reference}</strong></> : null}. {invoice.due_date ? <>Betaal uiterlijk {displayDate(invoice.due_date)}.</> : null}</p>{paymentAvailable ? <button type="button" onClick={payOnline} disabled={paymentBusy} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"><CreditCard size={17}/>{paymentBusy ? "Betaling starten…" : `Betaal ${money.format(Number(invoice.amount_outstanding))} online`}</button> : null}{paymentError ? <p className="mt-3 text-sm font-medium text-red-700">{paymentError}</p> : null}</div></div></section> : null}

        {invoice.status === "PAID" ? <section className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800"><CheckCircle2 size={22}/><strong>Deze factuur is volledig betaald.</strong></section> : null}
        {invoice.notes ? <section><h3 className="text-sm font-semibold">Notitie</h3><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{invoice.notes}</p></section> : null}

        <section className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 print:hidden"><div className="flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={15}/> Beveiligde factuurlink van Vedantix</div><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><Printer size={16}/> Afdrukken / opslaan als PDF</button></section>
      </div>
    </main>
  </div>;
}
