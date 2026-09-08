import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, CreditCard, ExternalLink, RefreshCw, ShieldCheck, TestTube2 } from "lucide-react";
import {
  getPaymentProviderConfig,
  listPaymentRequests,
  saveMollieCredentials,
  setPaymentProviderEnabled,
  testMollieCredentials,
  type PaymentProviderConfig,
  type PaymentRequest,
} from "./mollie-data";

const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

function badge(status: string) {
  const positive = status === "PAID";
  const warning = ["OPEN", "PENDING", "AUTHORIZED", "CREATING"].includes(status);
  return positive
    ? "bg-emerald-50 text-emerald-700"
    : warning
      ? "bg-amber-50 text-amber-700"
      : "bg-slate-100 text-slate-600";
}

export default function MolliePaymentsModule() {
  const [config, setConfig] = useState<PaymentProviderConfig | null>(null);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"TEST" | "LIVE">("TEST");

  async function load() {
    setError(null);
    const [nextConfig, nextRequests] = await Promise.all([getPaymentProviderConfig(), listPaymentRequests()]);
    setConfig(nextConfig);
    setMode(nextConfig.mode);
    setRequests(nextRequests);
  }

  useEffect(() => { load().catch((e) => setError(e instanceof Error ? e.message : "Mollie kon niet worden geladen.")); }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null); setMessage(null);
    try {
      const form = new FormData(event.currentTarget);
      const apiKey = String(form.get("api_key") || "").trim();
      if (!apiKey) throw new Error("Vul een Mollie API-key in.");
      const result = await saveMollieCredentials(apiKey, mode);
      event.currentTarget.reset();
      setMessage(`Mollie ${mode === "TEST" ? "test" : "live"}-key geverifieerd voor ${result.profile?.name || "het profiel"}.`);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Opslaan mislukt."); }
    finally { setBusy(false); }
  }

  async function test() {
    setBusy(true); setError(null); setMessage(null);
    try {
      const result = await testMollieCredentials();
      const ideal = Array.isArray(result.methods) && result.methods.some((m: { id?: string }) => m.id === "ideal");
      setMessage(`Mollie-verbinding werkt. iDEAL ${ideal ? "is beschikbaar" : "is nog niet actief op dit profiel"}.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Test mislukt."); }
    finally { setBusy(false); }
  }

  async function toggle() {
    if (!config) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      if (!config.credentials_configured && !config.enabled) throw new Error("Sla eerst een geldige Mollie API-key op.");
      const next = await setPaymentProviderEnabled(!config.enabled);
      setConfig(next);
      setMessage(next.enabled ? "Online betalen is ingeschakeld." : "Online betalen is uitgeschakeld.");
    } catch (e) { setError(e instanceof Error ? e.message : "Wijzigen mislukt."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h2 className="text-lg font-semibold">Mollie / iDEAL</h2><p className="mt-1 text-sm text-slate-500">Hosted checkout. API-keys worden uitsluitend in Supabase Vault opgeslagen.</p></div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${config?.enabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{config?.enabled ? "ACTIEF" : "UIT"}</div>
      </div>

      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex items-center gap-2"><ShieldCheck size={18}/><strong className="text-sm">API-configuratie</strong></div>
          <label className="text-sm font-medium text-slate-700">Modus<select value={mode} onChange={(e) => setMode(e.target.value as "TEST" | "LIVE")} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="TEST">Test</option><option value="LIVE">Live</option></select></label>
          <label className="mt-3 block text-sm font-medium text-slate-700">API-key<input name="api_key" type="password" autoComplete="off" placeholder={mode === "TEST" ? "test_..." : "live_..."} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"/></label>
          <div className="mt-4 flex flex-wrap gap-2"><button disabled={busy} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Opslaan & verifiëren</button><button type="button" disabled={busy || !config?.credentials_configured} onClick={test} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"><TestTube2 size={15}/> Verbinding testen</button></div>
        </form>

        <div className="rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2"><CreditCard size={18}/><strong className="text-sm">Status</strong></div>
          <div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Credentials</span><strong>{config?.credentials_configured ? "Geconfigureerd" : "Niet ingesteld"}</strong></div><div className="flex justify-between"><span className="text-slate-500">Modus</span><strong>{config?.mode || "—"}</strong></div><div className="flex justify-between"><span className="text-slate-500">Checkout</span><strong>{config?.enabled ? "Beschikbaar" : "Uitgeschakeld"}</strong></div></div>
          <button type="button" disabled={busy} onClick={toggle} className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold ${config?.enabled ? "border border-red-200 text-red-700" : "bg-slate-950 text-white"}`}>{config?.enabled ? "Online betalen uitschakelen" : "Online betalen inschakelen"}</button>
        </div>
      </div>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Payment requests</h2><p className="mt-1 text-sm text-slate-500">Mollie-checkouts en hun providerstatus.</p></div><button type="button" onClick={() => load().catch(() => undefined)} className="rounded-lg border border-slate-200 p-2 text-slate-600"><RefreshCw size={15}/></button></div>
      {requests.length ? <div className="space-y-2">{requests.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"><div><strong className="text-sm">{request.invoices?.invoice_number || "Factuur"}</strong><span className="block text-xs text-slate-400">{request.provider_payment_id || request.id} · {money.format(Number(request.amount))}</span></div><div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badge(request.status)}`}>{request.status}</span>{request.checkout_url ? <a href={request.checkout_url} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-2 text-slate-500"><ExternalLink size={14}/></a> : null}{request.status === "PAID" ? <CheckCircle2 size={17} className="text-emerald-600"/> : null}</div></div>)}</div> : <div className="rounded-xl border border-dashed border-slate-200 px-5 py-9 text-center text-sm text-slate-500">Nog geen Mollie-betalingen aangemaakt.</div>}
    </section>
  </div>;
}
