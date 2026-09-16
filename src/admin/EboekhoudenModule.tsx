import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Link2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { accountingRequest, type AccountingConfig, type AccountingPreview, type Ledger, type Mapping } from "./ebookhouden-data";

const euro = (amount: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
const accountFields = [
  { key: "debtor" as const, label: "Debiteuren", help: "De rekening voor bedragen die klanten nog moeten betalen.", categories: ["DEB"], required: true },
  { key: "revenue" as const, label: "Omzet websites en diensten", help: "De omzetrekening waarop je verkoopfacturen wilt boeken.", categories: ["VW"], required: true },
  { key: "bank" as const, label: "Zakelijke bank (optioneel)", help: "Kies je bankrekening als die al in je administratie is ingericht.", categories: ["FIN"], required: false },
  { key: "mollie" as const, label: "Mollie tussenrekening (optioneel)", help: "Voor het later afstemmen van klantbetalingen, uitbetalingen en kosten.", categories: ["BAL", "FIN"], required: false },
];

export default function EboekhoudenModule() {
  const [config, setConfig] = useState<AccountingConfig | null>(null);
  const [preview, setPreview] = useState<AccountingPreview | null>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const data = await accountingRequest({ action: "preview" });
    if (!data.config || !data.preview) throw new Error("Het overzicht is niet volledig geladen.");
    setConfig(data.config); setMapping(data.config.mapping); setPreview(data.preview);
  }
  useEffect(() => { let active = true; setBusy("load"); load().catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setBusy(""); }); return () => { active = false; }; }, []);

  async function run(name: string, fn: () => Promise<void>) {
    setBusy(name); setError(""); setMessage("");
    try { await fn(); } catch (e) { setError(e instanceof Error ? e.message : "Actie mislukt."); } finally { setBusy(""); }
  }
  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const token = String(new FormData(form).get("api_token") || "").trim();
    if (!token) { setError("Vul een API-token in."); return; }
    await run("connect", async () => {
      try {
        const data = await accountingRequest({ action: "connect", api_token: token });
        setLedgers(data.ledgers || []);
        await load();
        setMessage("Account verbonden. Kies hieronder de boekhoudrekeningen. Er zijn geen gegevens naar je boekhouding verzonden.");
      } finally { form.reset(); }
    });
  }
  async function test() {
    await run("test", async () => {
      const data = await accountingRequest({ action: "test" });
      setLedgers(data.ledgers || []); await load();
      setMessage(`Verbinding werkt. ${data.ledgers?.length || 0} boekhoudrekeningen opgehaald.`);
    });
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await run("mapping", async () => {
      const data = await accountingRequest({ action: "save_mapping", mapping });
      if (data.config) { setConfig(data.config); setMapping(data.config.mapping); }
      setMessage("Rekeningen opgeslagen. De aansluiting is klaar voor controle van de eerste boeking; automatisch boeken is nog niet geactiveerd.");
    });
  }
  async function disconnect() {
    if (!window.confirm("De koppeling verbreken en het opgeslagen API-token verwijderen? Je facturen en boekhouding blijven bewaard.")) return;
    await run("disconnect", async () => { await accountingRequest({ action: "disconnect" }); setLedgers([]); await load(); setMessage("Koppeling verbroken en opgeslagen token verwijderd."); });
  }

  return <div className="space-y-5">
    {error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
    {message ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p> : null}
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">1. Account verbinden</h2><p className="mt-1 text-sm text-slate-500">Maak in de instellingen van je e-Boekhouden-account een API-token aan voor Vedantix. Voer het hier in om de toegang tot jouw administratie te controleren.</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${config?.connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{config?.connected ? "Verbonden" : "Nog niet verbonden"}</span></div>
      <form onSubmit={connect} className="mt-5 max-w-2xl space-y-3">
        <label className="block text-sm font-medium">API-token<input type="password" name="api_token" required maxLength={4096} autoComplete="off" spellCheck={false} placeholder={config?.connected ? "Nieuw token om de verbinding te vervangen" : "Plak hier je e-Boekhouden API-token"} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
        <p className="flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck size={15} className="mt-0.5 shrink-0"/>Je token wordt versleuteld opgeslagen en na opslaan niet meer getoond. De verbindingstest leest alleen je boekhoudrekeningen.</p>
        <div className="flex flex-wrap gap-2"><button disabled={Boolean(busy)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{busy === "connect" ? <Loader2 size={16} className="animate-spin"/> : <Link2 size={16}/>} {config?.connected ? "Token vervangen en testen" : "Verbinden en testen"}</button><button type="button" disabled={Boolean(busy) || !config?.connected} onClick={test} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40"><RefreshCw size={16}/> Verbinding testen</button></div>
      </form>
      {config?.last_verified_at ? <p className="mt-3 text-xs text-slate-500">Laatst gecontroleerd: {new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(config.last_verified_at))}</p> : null}
      <a href="https://api.e-boekhouden.nl/scalar/" target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-medium text-blue-700 underline">Uitleg API-token en officiële documentatie</a>
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">2. Boekhoudrekeningen kiezen</h2><p className="mt-1 text-sm text-slate-500">Selecteer de rekeningen uit jouw e-Boekhouden-administratie. Deze instellingen maken nog geen boekingen aan.</p>
      {!config?.connected ? <p className="mt-4 text-sm text-slate-500">Verbind eerst je account om de beschikbare rekeningen op te halen.</p> : !ledgers.length ? <div className="mt-4"><button type="button" disabled={Boolean(busy)} onClick={test} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Rekeningen ophalen</button>{config.mapping.debtor && config.mapping.revenue ? <p className="mt-2 text-xs text-slate-500">Er zijn al rekeningen opgeslagen. Haal de lijst op om ze te bekijken of wijzigen.</p> : null}</div> : <form onSubmit={save} className="mt-5 space-y-4"><div className="grid gap-4 md:grid-cols-2">{accountFields.map(field => <label key={field.key} className="text-sm font-medium">{field.label}{field.required ? " *" : ""}<select required={field.required} value={mapping[field.key] ?? ""} onChange={event => setMapping(current => ({ ...current, [field.key]: event.target.value ? Number(event.target.value) : null }))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="">{field.required ? "Kies een rekening" : "Nog niet instellen"}</option>{ledgers.filter(ledger => field.categories.includes(ledger.category)).map(ledger => <option key={ledger.id} value={ledger.id}>{ledger.code} — {ledger.description}</option>)}</select><span className="mt-1 block text-xs font-normal leading-5 text-slate-500">{field.help}</span></label>)}</div><button disabled={Boolean(busy)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">Rekeningen opslaan</button></form>}
    </section>

    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">3. Gegevens voor de eerste controle</h2><button type="button" disabled={Boolean(busy)} onClick={() => run("preview", load)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40"><RefreshCw size={14}/> Overzicht vernieuwen</button></div>
      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><strong>Automatisch boeken is nog niet geactiveerd.</strong><p className="mt-1">Na het verbinden en instellen controleren we de eerste boeking en hoe betalingen worden verwerkt. Onderstaande gegevens zijn nog niet naar e-Boekhouden verzonden.</p></div>
      {busy === "load" ? <p className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="animate-spin" size={16}/> Overzicht laden…</p> : preview ? <>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">{[["Definitieve facturen", preview.invoices.length], ["Creditnota’s", preview.credits.length], ["Betalingen", preview.payment_count]].map(([label, value]) => <div key={String(label)} className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-500">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>)}</div>
        {preview.invoices.length ? <div className="mt-4 space-y-2">{preview.invoices.map(invoice => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 text-sm"><div><strong>{invoice.number}</strong><p className="text-xs text-slate-500">{invoice.title}</p></div><div className="text-right"><strong>{euro(invoice.amount)}</strong><span className="block text-xs text-slate-500">Nog niet gesynchroniseerd</span></div></div>)}</div> : <p className="mt-4 text-sm text-slate-500">Nog geen definitieve facturen om te controleren.</p>}
        <p className="mt-3 text-xs text-slate-500">Concepten, inactieve facturen en herkenbare testfacturen worden uitgesloten. Uitgesloten facturen: {preview.excluded_invoice_count}.</p>
      </> : null}
      {config?.stage === "REVIEW_REQUIRED" ? <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-700"><CheckCircle2 size={18}/> Account en rekeningkeuze zijn voorbereid voor de eerste controle.</p> : null}
    </section>
    {config?.connected ? <button type="button" disabled={Boolean(busy)} onClick={disconnect} className="text-sm font-medium text-red-700 disabled:opacity-40">Koppeling verbreken</button> : null}
  </div>;
}
