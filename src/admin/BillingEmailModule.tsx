import { useEffect, useMemo, useState } from "react";
import { Clock3, ExternalLink, Mail, RefreshCw, RotateCcw, Send } from "lucide-react";
import type { Customer } from "./control-center-data";
import {
  listInvoices,
  listQuotes,
  type Invoice,
  type Quote,
} from "./sales-billing-data";
import {
  listBillingEmails,
  queueDueInvoiceReminders,
  queueInvoiceEmail,
  queueQuoteEmail,
  retryBillingEmail,
  triggerBillingEmailDelivery,
  type BillingEmailRow,
} from "./billing-email-data";

type BillingCustomer = Customer & { email?: string | null };

const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

function statusClass(status: string) {
  if (status === "SENT") return "bg-emerald-50 text-emerald-700";
  if (status === "FAILED") return "bg-red-50 text-red-700";
  if (status === "QUEUED") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

export default function BillingEmailModule({ customers }: { customers: BillingCustomer[] }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [emails, setEmails] = useState<BillingEmailRow[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );

  async function load() {
    setError(null);
    try {
      const [nextQuotes, nextInvoices, nextEmails] = await Promise.all([
        listQuotes(),
        listInvoices(),
        listBillingEmails(),
      ]);
      setQuotes(nextQuotes);
      setInvoices(nextInvoices);
      setEmails(nextEmails);
    } catch (err) {
      setError(err instanceof Error ? err.message : "E-mailgegevens konden niet worden geladen.");
    }
  }

  useEffect(() => { load(); }, []);

  async function run(id: string, action: () => Promise<unknown>, success: string) {
    setBusy(id);
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Actie mislukt.");
    } finally {
      setBusy(null);
    }
  }

  async function sendQuote(quote: Quote) {
    await run(`quote-${quote.id}`, async () => {
      await queueQuoteEmail(quote.id);
      await triggerBillingEmailDelivery();
    }, `Offerte ${quote.quote_number} is aangeboden aan de mailwachtrij en direct verwerkt.`);
  }

  async function sendInvoice(invoice: Invoice) {
    await run(`invoice-${invoice.id}`, async () => {
      await queueInvoiceEmail(invoice.id);
      await triggerBillingEmailDelivery();
    }, `Factuur ${invoice.invoice_number} is aangeboden aan de mailwachtrij en direct verwerkt.`);
  }

  const sendableQuotes = quotes.filter((quote) => ["DRAFT", "SENT"].includes(quote.status));
  const sendableInvoices = invoices.filter((invoice) => invoice.invoice_number && invoice.status !== "DRAFT" && invoice.status !== "CREDITED");
  const queued = emails.filter((email) => email.status === "QUEUED").length;
  const failed = emails.filter((email) => email.status === "FAILED").length;

  return <div className="space-y-5">
    {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
    {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

    <section className="grid gap-4 sm:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Mail className="mb-3" size={19}/><span className="text-sm text-slate-500">Wachtrij</span><strong className="mt-1 block text-2xl">{queued}</strong></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><RotateCcw className="mb-3" size={19}/><span className="text-sm text-slate-500">Mislukt</span><strong className="mt-1 block text-2xl">{failed}</strong></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><Clock3 className="mb-3" size={19}/><span className="text-sm text-slate-500">Automatische reminders</span><strong className="mt-1 block text-base">Dagelijks</strong></article>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold">Verzenden</h2><p className="mt-1 text-sm text-slate-500">Verstuur offertes en gefinaliseerde facturen via Migadu. De klant krijgt een beveiligde Vedantix-link.</p></div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => run("reminders", async () => { const count = await queueDueInvoiceReminders(); await triggerBillingEmailDelivery(); return count; }, "Betaalherinneringen zijn gecontroleerd en de wachtrij is verwerkt.")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold disabled:opacity-50"><Clock3 size={15}/> Controleer reminders</button>
          <button type="button" onClick={() => run("delivery", triggerBillingEmailDelivery, "De mailwachtrij is direct verwerkt.")} disabled={busy !== null} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"><Send size={15}/> Verwerk wachtrij</button>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div><h3 className="mb-3 text-sm font-semibold">Offertes</h3><div className="space-y-2">{sendableQuotes.length ? sendableQuotes.map((quote) => {
          const customer = customerMap.get(quote.customer_id);
          return <div key={quote.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><strong className="text-sm">{quote.quote_number}</strong><span className="block text-xs text-slate-400">{customer?.company_name || "Klant"} · {customer?.email || "geen e-mail"} · {money.format(Number(quote.total_incl_vat))}</span></div><button type="button" disabled={busy !== null || !customer?.email} onClick={() => sendQuote(quote)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Send size={14}/>{quote.status === "SENT" ? "Opnieuw versturen" : "Verstuur offerte"}</button></div>;
        }) : <p className="text-sm text-slate-400">Geen verstuurbare offertes.</p>}</div></div>

        <div><h3 className="mb-3 text-sm font-semibold">Facturen</h3><div className="space-y-2">{sendableInvoices.length ? sendableInvoices.map((invoice) => {
          const customer = customerMap.get(invoice.customer_id);
          return <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><strong className="text-sm">{invoice.invoice_number}</strong><span className="block text-xs text-slate-400">{customer?.company_name || "Klant"} · {customer?.email || "geen e-mail"} · {money.format(Number(invoice.total_incl_vat))}</span></div><button type="button" disabled={busy !== null || !customer?.email} onClick={() => sendInvoice(invoice)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><Send size={14}/> Verstuur factuur</button></div>;
        }) : <p className="text-sm text-slate-400">Geen gefinaliseerde facturen.</p>}</div></div>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">E-mailhistorie</h2><p className="mt-1 text-sm text-slate-500">Uitgaande offertes, facturen en herinneringen.</p></div><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><RefreshCw size={14}/> Vernieuwen</button></div>
      {emails.length ? <div className="space-y-2">{emails.map((email) => <div key={email.id} className="grid gap-3 rounded-xl border border-slate-100 p-3 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{email.subject}</strong><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass(email.status)}`}>{email.status}</span><span className="text-[11px] font-semibold text-slate-400">{email.message_type}</span></div><span className="mt-1 block text-xs text-slate-400">{email.recipient_email} · poging {email.attempt_count} · {new Date(email.created_at).toLocaleString("nl-NL")}</span>{email.error_message ? <span className="mt-1 block text-xs text-red-600">{email.error_message}</span> : null}</div><div className="flex gap-2">{email.action_url ? <a href={email.action_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold"><ExternalLink size={13}/> Link</a> : null}{email.status === "FAILED" ? <button type="button" disabled={busy !== null} onClick={() => run(`retry-${email.id}`, async () => { await retryBillingEmail(email.id); await triggerBillingEmailDelivery(); }, "De e-mail is opnieuw aangeboden en verwerkt.")} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50"><RotateCcw size={13}/> Opnieuw</button> : null}</div></div>)}</div> : <p className="text-sm text-slate-400">Nog geen uitgaande billing-e-mails.</p>}
    </section>
  </div>;
}
