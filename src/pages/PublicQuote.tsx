import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, FileText, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type QuoteStatus = "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
type BillingType = "ONE_TIME" | "MONTHLY" | "YEARLY";

type QuoteItem = {
  position: number;
  code: string | null;
  description: string;
  billing_type: BillingType;
  quantity: number;
  unit_price_ex_vat: number;
  vat_rate: number;
  line_discount_ex_vat: number;
  line_total_ex_vat: number;
  line_vat: number;
  line_total_incl_vat: number;
};

type PublicQuoteData = {
  quote_number: string;
  status: QuoteStatus;
  quote_date: string;
  valid_until: string | null;
  title: string;
  intro_text: string | null;
  notes: string | null;
  terms: string | null;
  subtotal_ex_vat: number;
  document_discount_ex_vat: number;
  total_ex_vat: number;
  vat_total: number;
  total_incl_vat: number;
  responded_by_name: string | null;
  response_note: string | null;
  responded_at: string | null;
  company: Record<string, string>;
  customer: Record<string, string>;
  items: QuoteItem[];
};

const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const date = new Intl.DateTimeFormat("nl-NL", { day: "2-digit", month: "2-digit", year: "numeric" });

const billingLabels: Record<BillingType, string> = {
  ONE_TIME: "Eenmalig",
  MONTHLY: "Per maand",
  YEARLY: "Per jaar",
};

function formatDate(value?: string | null) {
  return value ? date.format(new Date(`${value}T12:00:00`)) : "—";
}

function customerName(customer: Record<string, string>) {
  return customer.company_name || customer.contact_name || "Klant";
}

export default function PublicQuote({ token }: { token: string }) {
  const [quote, setQuote] = useState<PublicQuoteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [busyAction, setBusyAction] = useState<"ACCEPT" | "REJECT" | null>(null);

  const load = async () => {
    setLoading(true);
    setError("");
    const { data, error: rpcError } = await supabase.rpc("get_public_quote", { p_token: token });
    if (rpcError) {
      setError("De offerte kon niet worden geladen.");
      setQuote(null);
    } else if (!data) {
      setError("Deze offertelink bestaat niet of is niet meer beschikbaar.");
      setQuote(null);
    } else {
      const next = data as PublicQuoteData;
      setQuote(next);
      setName(next.responded_by_name || next.customer.contact_name || "");
      setNote(next.response_note || "");
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [token]);

  const recurring = useMemo(() => {
    if (!quote) return { monthly: 0, yearly: 0 };
    return quote.items.reduce(
      (result, item) => {
        if (item.billing_type === "MONTHLY") result.monthly += Number(item.line_total_incl_vat || 0);
        if (item.billing_type === "YEARLY") result.yearly += Number(item.line_total_incl_vat || 0);
        return result;
      },
      { monthly: 0, yearly: 0 },
    );
  }, [quote]);

  const respond = async (action: "ACCEPT" | "REJECT") => {
    if (!quote || quote.status !== "SENT") return;
    if (action === "ACCEPT" && !name.trim()) {
      setError("Vul je naam in voordat je akkoord geeft.");
      return;
    }
    setBusyAction(action);
    setError("");
    const { error: rpcError } = await supabase.rpc("respond_to_public_quote", {
      p_token: token,
      p_action: action,
      p_name: name.trim() || null,
      p_note: note.trim() || null,
    });
    if (rpcError) {
      setError(rpcError.message.includes("expired") ? "De geldigheidsduur van deze offerte is verlopen." : "Je reactie kon niet worden opgeslagen. Probeer het opnieuw.");
    } else {
      await load();
    }
    setBusyAction(null);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto flex max-w-3xl items-center justify-center rounded-3xl border border-slate-200 bg-white p-16 shadow-sm">
          <Loader2 className="animate-spin text-slate-500" size={28} />
        </div>
      </main>
    );
  }

  if (!quote) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <FileText className="mx-auto mb-4 text-slate-400" size={34} />
          <h1 className="text-2xl font-bold text-slate-950">Offerte niet beschikbaar</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  const company = quote.company || {};
  const customer = quote.customer || {};
  const canRespond = quote.status === "SENT";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:py-16">
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-950 px-6 py-7 text-white sm:px-9">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <div className="text-xl font-black tracking-tight">{company.trade_name || "Vedantix"}</div>
                <p className="mt-1 text-sm text-slate-400">Professionele websites & online groei</p>
              </div>
              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Offerte</div>
                <strong className="mt-1 block text-lg">{quote.quote_number}</strong>
              </div>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Voor</p>
              <h1 className="mt-2 text-2xl font-bold">{customerName(customer)}</h1>
              {customer.contact_name && customer.company_name ? <p className="mt-1 text-sm text-slate-500">t.a.v. {customer.contact_name}</p> : null}
              <div className="mt-3 text-sm leading-6 text-slate-500">
                {customer.address_line1 ? <div>{customer.address_line1}</div> : null}
                {customer.address_line2 ? <div>{customer.address_line2}</div> : null}
                {customer.postal_code || customer.city ? <div>{[customer.postal_code, customer.city].filter(Boolean).join(" ")}</div> : null}
              </div>
            </div>
            <dl className="grid min-w-52 grid-cols-2 gap-x-5 gap-y-2 text-sm">
              <dt className="text-slate-400">Offertedatum</dt><dd className="text-right font-medium">{formatDate(quote.quote_date)}</dd>
              <dt className="text-slate-400">Geldig t/m</dt><dd className="text-right font-medium">{formatDate(quote.valid_until)}</dd>
            </dl>
          </div>

          <div className="px-6 pb-6 sm:px-9 sm:pb-9">
            <h2 className="text-xl font-bold">{quote.title || "Offerte"}</h2>
            {quote.intro_text ? <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">{quote.intro_text}</p> : null}

            <div className="mt-7 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3">Omschrijving</th><th className="px-4 py-3">Frequentie</th><th className="px-4 py-3 text-right">Aantal</th><th className="px-4 py-3 text-right">Excl. btw</th><th className="px-4 py-3 text-right">Incl. btw</th></tr>
                </thead>
                <tbody>
                  {quote.items.map((item, index) => (
                    <tr className="border-t border-slate-100" key={`${item.position}-${index}`}>
                      <td className="px-4 py-4 font-medium">{item.description}</td>
                      <td className="px-4 py-4 text-slate-500">{billingLabels[item.billing_type || "ONE_TIME"]}</td>
                      <td className="px-4 py-4 text-right text-slate-500">{Number(item.quantity)}</td>
                      <td className="px-4 py-4 text-right">{money.format(Number(item.line_total_ex_vat))}</td>
                      <td className="px-4 py-4 text-right font-semibold">{money.format(Number(item.line_total_incl_vat))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 ml-auto max-w-sm space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Totaal excl. btw</span><strong>{money.format(Number(quote.total_ex_vat))}</strong></div>
              <div className="flex justify-between"><span className="text-slate-500">Btw</span><strong>{money.format(Number(quote.vat_total))}</strong></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base"><span className="font-semibold">Totaal incl. btw</span><strong>{money.format(Number(quote.total_incl_vat))}</strong></div>
              {recurring.monthly > 0 ? <div className="flex justify-between text-slate-600"><span>Daarvan maandelijks</span><span>{money.format(recurring.monthly)}</span></div> : null}
              {recurring.yearly > 0 ? <div className="flex justify-between text-slate-600"><span>Daarvan jaarlijks</span><span>{money.format(recurring.yearly)}</span></div> : null}
            </div>

            {quote.notes ? <div className="mt-7 rounded-2xl bg-slate-50 p-5"><strong className="text-sm">Opmerking</strong><p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{quote.notes}</p></div> : null}
            {quote.terms ? <div className="mt-5 text-xs leading-6 text-slate-500"><strong className="text-slate-700">Voorwaarden</strong><p className="mt-1 whitespace-pre-line">{quote.terms}</p></div> : null}
          </div>
        </section>

        {quote.status === "ACCEPTED" ? (
          <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 text-emerald-950">
            <div className="flex gap-4"><CheckCircle2 className="shrink-0" /><div><h2 className="font-bold">Offerte geaccepteerd</h2><p className="mt-1 text-sm text-emerald-800">Bedankt{quote.responded_by_name ? `, ${quote.responded_by_name}` : ""}. Vedantix kan de opdracht nu verder inplannen.</p></div></div>
          </section>
        ) : quote.status === "REJECTED" ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-7 text-slate-800">
            <div className="flex gap-4"><XCircle className="shrink-0 text-slate-400" /><div><h2 className="font-bold">Offerte afgewezen</h2><p className="mt-1 text-sm text-slate-500">Je reactie is opgeslagen. Neem gerust contact op als je de scope wilt aanpassen.</p></div></div>
          </section>
        ) : quote.status === "EXPIRED" ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-7 text-amber-950">
            <div className="flex gap-4"><Clock3 className="shrink-0" /><div><h2 className="font-bold">Offerte verlopen</h2><p className="mt-1 text-sm text-amber-800">Deze offerte kan niet meer online worden geaccepteerd. Neem contact op met Vedantix voor een actuele versie.</p></div></div>
          </section>
        ) : null}

        {canRespond ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Reageer op deze offerte</h2>
            <p className="mt-2 text-sm text-slate-500">Je reactie wordt direct bij de offerte geregistreerd.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Naam<input className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400" value={name} onChange={(event) => setName(event.target.value)} maxLength={160} placeholder="Je volledige naam" /></label>
              <label className="text-sm font-medium sm:row-span-2">Opmerking (optioneel)<textarea className="mt-1.5 min-h-28 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400" value={note} onChange={(event) => setNote(event.target.value)} maxLength={2000} placeholder="Eventuele toelichting" /></label>
            </div>
            {error ? <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" disabled={Boolean(busyAction)} onClick={() => void respond("ACCEPT")} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {busyAction === "ACCEPT" ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />} Akkoord met offerte
              </button>
              <button type="button" disabled={Boolean(busyAction)} onClick={() => void respond("REJECT")} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                {busyAction === "REJECT" ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />} Offerte afwijzen
              </button>
            </div>
          </section>
        ) : error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        <footer className="px-2 pb-4 text-center text-xs text-slate-400">
          {company.email || "info@vedantix.nl"} · {company.website || "https://vedantix.nl"}
        </footer>
      </div>
    </main>
  );
}
