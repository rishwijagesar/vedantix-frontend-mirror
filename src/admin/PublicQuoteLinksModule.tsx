import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Link2, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getCompanyProfile } from "./sales-billing-data";
import type { Customer } from "./control-center-data";

type QuoteLinkRow = {
  id: string;
  quote_number: string;
  customer_id: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
  valid_until: string | null;
  public_token: string;
  updated_at: string;
};

type BillingCustomer = Customer & { company_name: string };

function statusClass(status: QuoteLinkRow["status"]) {
  if (status === "ACCEPTED") return "bg-emerald-50 text-emerald-700";
  if (status === "REJECTED" || status === "EXPIRED") return "bg-red-50 text-red-700";
  if (status === "SENT") return "bg-blue-50 text-blue-700";
  return "bg-slate-100 text-slate-600";
}

export default function PublicQuoteLinksModule({ customers }: { customers: BillingCustomer[] }) {
  const [quotes, setQuotes] = useState<QuoteLinkRow[]>([]);
  const [baseUrl, setBaseUrl] = useState("https://vedantix.nl");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [{ data, error: quoteError }, profile] = await Promise.all([
        supabase
          .from("quotes")
          .select("id,quote_number,customer_id,status,valid_until,public_token,updated_at")
          .order("updated_at", { ascending: false }),
        getCompanyProfile(),
      ]);
      if (quoteError) throw new Error(quoteError.message);
      setQuotes((data ?? []) as QuoteLinkRow[]);
      setBaseUrl((profile.website || "https://vedantix.nl").replace(/\/$/, ""));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Offertelinks konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  function linkFor(quote: QuoteLinkRow) {
    return `${baseUrl}/offerte/${quote.public_token}`;
  }

  async function copy(quote: QuoteLinkRow) {
    await navigator.clipboard.writeText(linkFor(quote));
    setCopied(quote.id);
    window.setTimeout(() => setCopied((current) => current === quote.id ? null : current), 1600);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Link2 size={18}/><h2 className="text-lg font-semibold">Klantlinks</h2></div>
          <p className="mt-1 text-sm text-slate-500">Beveiligde links waarmee een klant een verzonden offerte kan bekijken, accepteren of afwijzen.</p>
        </div>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Vernieuwen
        </button>
      </div>

      {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {loading && !quotes.length ? <div className="rounded-xl border border-dashed border-slate-200 px-5 py-9 text-center text-sm text-slate-500">Offertes laden…</div> : null}
      {!loading && !quotes.length && !error ? <div className="rounded-xl border border-dashed border-slate-200 px-5 py-9 text-center text-sm text-slate-500">Nog geen offertes.</div> : null}

      <div className="space-y-2">
        {quotes.map((quote) => {
          const customer = customers.find((item) => item.id === quote.customer_id);
          const enabled = ["SENT", "ACCEPTED", "REJECTED"].includes(quote.status) && Boolean(quote.public_token);
          const url = linkFor(quote);
          return (
            <article key={quote.id} className="grid gap-3 rounded-xl border border-slate-100 px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-sm">{quote.quote_number}</strong>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(quote.status)}`}>{quote.status}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{customer?.company_name || "Klant"}{quote.valid_until ? ` · geldig t/m ${quote.valid_until}` : ""}</p>
                {enabled ? <p className="mt-2 truncate font-mono text-xs text-slate-500">{url}</p> : <p className="mt-2 text-xs text-amber-700">De klantlink wordt actief zodra de offerte als verzonden is gemarkeerd.</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={!enabled} onClick={() => void copy(quote)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
                  {copied === quote.id ? <Check size={14}/> : <Copy size={14}/>} {copied === quote.id ? "Gekopieerd" : "Kopieer link"}
                </button>
                <a href={enabled ? url : undefined} target="_blank" rel="noreferrer" aria-disabled={!enabled} className={`inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold ${enabled ? "text-slate-700" : "pointer-events-none text-slate-300"}`}>
                  <ExternalLink size={14}/> Open
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
