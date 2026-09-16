import { useEffect, useState } from "react";
import { CircleDollarSign, CreditCard, FileText, ReceiptText } from "lucide-react";
import { supabase } from "@/lib/supabase";

const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

type DashboardData = { openQuotes: number; outstanding: number; overdue: number; monthRevenue: number };

type InvoiceRow = {
  status: string;
  is_active?: boolean | null;
  total_incl_vat: number | string;
  amount_paid: number | string;
  due_date: string | null;
  finalized_at: string | null;
};

async function loadDashboard(): Promise<DashboardData> {
  const [{ data: quotes, error: quoteError }, { data: invoices, error: invoiceError }] = await Promise.all([
    supabase.from("quotes").select("status"),
    supabase.from("invoices").select("status,is_active,total_incl_vat,amount_paid,due_date,finalized_at").eq("is_active", true),
  ]);
  if (quoteError) throw new Error(quoteError.message);
  if (invoiceError) throw new Error(invoiceError.message);

  const activeInvoices = (invoices ?? []) as InvoiceRow[];
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const openQuotes = (quotes ?? []).filter((quote) => ["DRAFT", "SENT"].includes(String(quote.status))).length;
  const outstanding = activeInvoices
    .filter((invoice) => ["FINALIZED", "SENT", "PARTIALLY_PAID", "OVERDUE"].includes(invoice.status))
    .reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total_incl_vat) - Number(invoice.amount_paid)), 0);
  const overdue = activeInvoices
    .filter((invoice) => invoice.due_date && new Date(invoice.due_date) < now && !["PAID", "CREDITED"].includes(invoice.status))
    .reduce((sum, invoice) => sum + Math.max(0, Number(invoice.total_incl_vat) - Number(invoice.amount_paid)), 0);
  const monthRevenue = activeInvoices
    .filter((invoice) => invoice.finalized_at && new Date(invoice.finalized_at) >= monthStart && !["DRAFT", "CREDITED"].includes(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.total_incl_vat), 0);

  return { openQuotes, outstanding, overdue, monthRevenue };
}

export default function BillingDashboardCardsV2() {
  const [data, setData] = useState<DashboardData | null>(null);
  useEffect(() => { void loadDashboard().then(setData).catch(() => setData(null)); }, []);

  const cards = [
    ["Open offertes", data?.openQuotes ?? "—", FileText, "Concept en verzonden"],
    ["Openstaand", data ? money.format(data.outstanding) : "—", CircleDollarSign, "Alleen actieve facturen"],
    ["Achterstallig", data ? money.format(data.overdue) : "—", CreditCard, "Alleen actieve facturen"],
    ["Gefactureerd deze maand", data ? money.format(data.monthRevenue) : "—", ReceiptText, "Alleen actieve facturen"],
  ] as const;

  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon, caption]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"><Icon size={18}/></div><p className="text-sm text-slate-500">{label}</p><strong className="mt-1 block text-2xl font-bold">{value}</strong><span className="mt-1 block text-xs text-slate-400">{caption}</span></article>)}</section>;
}
