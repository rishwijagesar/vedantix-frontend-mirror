import { useEffect, useState, type FormEvent } from "react";
import { Link2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { accountingRequest, type AccountingConfig, type AccountingPreview, type Ledger, type Mapping, type ExportRow } from "./ebookhouden-data";

const euro = (amount: number) => new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount);
const accountFields = [
  { key: "debtor" as const, label: "Debiteuren", help: "De rekening voor bedragen die klanten nog moeten betalen.", categories: ["DEB"], required: true },
  { key: "revenue" as const, label: "Omzet websites en diensten", help: "De omzetrekening waarop je verkoopfacturen wilt boeken.", categories: ["VW"], required: true },
  { key: "bank" as const, label: "Zakelijke bank (optioneel)", help: "Kies je bankrekening als die al in je administratie is ingericht.", categories: ["FIN"], required: false },
  { key: "mollie" as const, label: "Mollie tussenrekening (optioneel)", help: "Mollie klantbetalingen komen op deze tussenrekening. Kies Bank/kas om betalingen over te zetten; uitbetalingen en kosten verwerk je afzonderlijk.", categories: ["BAL", "FIN"], required: false },
];

export default function EboekhoudenModule() {
  const [config, setConfig] = useState<AccountingConfig | null>(null);
  const [preview, setPreview] = useState<AccountingPreview | null>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [mapping, setMapping] = useState<Mapping>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selected,setSelected] = useState<ExportRow | null>(null);
  const [paymentMode,setPaymentMode] = useState<'EXTERNAL' | 'VEDANTIX'>('EXTERNAL');
  const [paymentConfirmed,setPaymentConfirmed] = useState(false);
  const [filter,setFilter] = useState('ALL');

  async function load() {
    const data = await accountingRequest({ action: "preview" });
    if (!data.config || !data.preview) throw new Error("Het overzicht is niet volledig geladen.");
    setConfig(data.config); setMapping(data.config.mapping); setPreview(data.preview); setPaymentMode(data.config.payment_mode); setSelected(null);
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
      await load();
      setMessage("Rekeningen opgeslagen. De aansluiting is klaar voor controle van de eerste boeking; automatisch boeken is nog niet geactiveerd.");
    });
  }
  async function disconnect() {
    if (!window.confirm("De koppeling verbreken en het opgeslagen API-token verwijderen? Je facturen en boekhouding blijven bewaard.")) return;
    await run("disconnect", async () => { await accountingRequest({ action: "disconnect" }); setLedgers([]); await load(); setMessage("Koppeling verbroken en opgeslagen token verwijderd."); });
  }

  async function exportRow(row:ExportRow, action='export') {
    await run('export',async()=>{
      try {
        const data=await accountingRequest({action,kind:row.kind,id:row.id,review_hash:row.review_hash});
        setMessage(data.message || 'Boeking gecontroleerd.');
      } finally { await load(); }
    });
  }
  async function settings(enabled:boolean) {
    await run('settings',async()=>{await accountingRequest({action:'sync_settings',enabled,payment_mode:paymentMode});await load();setPaymentConfirmed(false);setMessage(enabled ? 'Automatisch verwerken staat aan voor nieuwe documenten vanaf nu. Oudere documenten zet je afzonderlijk over.' : 'Instellingen opgeslagen. Automatisch verwerken staat uit.');});
  }
  const labels:Record<string,string>={INVOICE:'Factuur',CREDIT:'Creditnota',PAYMENT:'Betaling',READY:'Klaar voor controle',BLOCKED:'Nog instellen',SENDING:'Wordt verwerkt',REVIEW:'Controleren',SYNCED:'Overgezet',CHANGED:'Wijziging controleren'};

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
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">3. Facturen en betalingen overzetten</h2><button type="button" disabled={Boolean(busy)} onClick={()=>run('preview',load)} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm disabled:opacity-40"><RefreshCw size={14}/> Vernieuwen</button></div>
      <p className="mt-2 text-sm leading-6 text-slate-500">Controleer een definitieve factuur en zet deze over naar e-Boekhouden. Het factuurnummer, de klant, omschrijvingen en btw gaan mee. Er wordt geen nieuwe factuur naar de klant gestuurd.</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">Bij de eerste boeking maken we een Vedantix-klantrelatie aan als die nog niet bestaat. Inkoopkosten, bonnetjes, Mollie kosten en uitbetalingen worden nog niet overgezet. Je bewijsstukken blijven beschikbaar onder Administratie.</p>
      {config?.last_sync_error ? <p role="alert" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{config.last_sync_error}</p> : null}
      {preview ? <>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">{[['Te controleren',preview.rows.filter(r=>r.state==='READY').length],['Overgezet',preview.rows.filter(r=>r.state==='SYNCED').length],['Aandacht nodig',preview.attention]].map(([label,value])=><div key={String(label)} className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-500">{label}</span><strong className="mt-1 block text-xl">{value}</strong></div>)}</div>
        <label className="mt-4 block text-sm font-medium">Toon<select value={filter} onChange={e=>setFilter(e.target.value)} className="ml-3 rounded-lg border p-2"><option value="ALL">Alles</option><option value="INVOICE">Facturen</option><option value="CREDIT">Creditnota’s</option><option value="PAYMENT">Betalingen</option></select></label>
        <div className="mt-4 space-y-3">{preview.rows.filter(r=>filter==='ALL'||r.kind===filter).map(row=><div key={row.kind+row.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="text-xs text-slate-500">{labels[row.kind]} · {row.date}</span><p className="font-semibold">{row.number}</p><p className="text-sm text-slate-500">{row.customer}</p></div><div className="text-right"><strong>{euro(row.amount)}</strong><p className={`text-xs ${row.state==='SYNCED'?'text-emerald-700':'text-slate-500'}`}>{labels[row.state]}{row.remote_id ? ` · Boeking ${row.remote_id}`:''}</p></div></div>{row.reason ? <p className="mt-2 text-sm text-amber-800">{row.reason}</p>:null}<div className="mt-3 flex flex-wrap gap-2">{row.state==='READY' ? <button disabled={Boolean(busy)||!config?.connected} onClick={()=>run("review",async()=>{const data=await accountingRequest({action:"test"});setLedgers(data.ledgers || []);setSelected(row);})} className="rounded-lg bg-slate-950 px-3 py-2 text-sm font-medium text-white disabled:opacity-40">Controleren en overzetten</button>:null}{['REVIEW','SENDING'].includes(row.state) ? <><button disabled={Boolean(busy)} onClick={()=>exportRow(row,'check_export')} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Boeking controleren</button><button disabled={Boolean(busy)} onClick={()=>{if(window.confirm('Controleer eerst in e-Boekhouden of deze boeking bestaat. Opnieuw proberen gebruikt hetzelfde unieke kenmerk. Wil je opnieuw proberen?'))void exportRow(row,'retry_export');}} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">Opnieuw proberen</button></>:null}</div></div>)}</div>
        {!preview.rows.length ? <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Er zijn nog geen definitieve facturen om over te zetten. Maak je eerste echte factuur definitief; deze verschijnt dan hier voor controle.</p>:null}
        <p className="mt-3 text-xs text-slate-500">Concepten, ingetrokken documenten en herkenbare testfacturen zijn uitgesloten ({preview.excluded_invoice_count} facturen). Nederlandse 9% en 21% btw worden ondersteund; afwijkende btw vraagt om controle.</p>
      </>:<p className="mt-4 text-sm text-slate-500">Overzicht laden…</p>}
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">4. Kies wat automatisch gaat</h2>
      <label className="mt-4 block text-sm font-medium">Hoe verwerk je klantbetalingen?<select value={paymentMode} onChange={e=>{setPaymentMode(e.target.value as 'EXTERNAL'|'VEDANTIX');setPaymentConfirmed(false);}} className="mt-2 w-full rounded-xl border p-3"><option value="EXTERNAL">In e-Boekhouden, bijvoorbeeld via mijn bankkoppeling</option><option value="VEDANTIX">Vedantix zet geregistreerde klantbetalingen over</option></select></label>
      <p className="mt-2 text-sm text-slate-500">{paymentMode==='EXTERNAL'?'Vedantix zet alleen facturen en creditnota’s over. Je koppelt ontvangen betalingen in e-Boekhouden aan de facturen.':'Bankbetalingen gaan naar de zakelijke bankrekening. Mollie betalingen gaan naar de Mollie tussenrekening. Koppel ze niet nogmaals als klantbetaling via een bankimport.'}</p>
      {paymentMode==='VEDANTIX' && paymentMode!==config?.payment_mode ? <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={paymentConfirmed} onChange={e=>setPaymentConfirmed(e.target.checked)}/>Ik zorg dat deze klantbetalingen niet ook via een andere koppeling worden geboekt.</label>:null}
      <button disabled={Boolean(busy)||!config?.connected||(paymentMode==='VEDANTIX'&&paymentMode!==config?.payment_mode&&!paymentConfirmed)} onClick={()=>settings(false)} className="mt-3 rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-40">Betalingskeuze opslaan</button><p className="mt-2 text-xs text-slate-500">Opslaan pauzeert automatisch overzetten. Je kunt dat hieronder weer inschakelen.</p>
      <div className="mt-5 rounded-xl bg-slate-50 p-4"><strong className="text-sm">{config?.sync_enabled?'Automatisch overzetten staat aan':'Automatisch overzetten staat uit'}</strong><p className="mt-1 text-sm leading-6 text-slate-500">Na de eerste gecontroleerde factuur kun je dit inschakelen. Nieuwe definitieve facturen, creditnota’s en eventueel betalingen worden dan iedere vijf minuten verwerkt, één boeking per ronde. Bestaande documenten zet je zelf over. Bij een onduidelijk antwoord stopt de verwerking voor controle.</p>{config?.sync_from?<p className="mt-2 text-xs text-slate-500">Vanaf {new Date(config.sync_from).toLocaleString('nl-NL')}</p>:null}<button disabled={Boolean(busy)||!config?.connected||(!config.sync_enabled&&(!preview?.first_invoice_synced||!!preview?.attention||paymentMode!==config.payment_mode))} onClick={()=>settings(!config?.sync_enabled)} className="mt-3 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{config?.sync_enabled?'Automatisch overzetten pauzeren':'Nieuwe documenten automatisch overzetten'}</button></div>
    </section>
    {selected ? <div role="dialog" aria-modal="true" aria-labelledby="booking-review-title" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4" onKeyDown={e=>{if(e.key==='Escape'&&!busy)setSelected(null);}}><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"><h2 id="booking-review-title" className="text-xl font-semibold">Boeking controleren</h2><p className="mt-2 text-sm text-slate-500">{labels[selected.kind]} {selected.number} · {selected.customer}</p><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt>Datum</dt><dd>{selected.date}</dd></div>{selected.kind!=='PAYMENT'?<><div className="flex justify-between"><dt>Exclusief btw</dt><dd>{euro(selected.base || 0)}</dd></div><div className="flex justify-between"><dt>Btw</dt><dd>{euro(selected.vat || 0)}</dd></div></>:null}<div className="flex justify-between font-semibold"><dt>Totaal</dt><dd>{euro(selected.amount)}</dd></div><div><dt>Boekhoudrekening</dt><dd className="text-slate-500">{ledgers.find(l=>l.id===selected.ledger_id)?.description || `Rekening ${selected.ledger_id} uit stap 2`}</dd></div>{selected.kind!=="PAYMENT"?<div><dt>Omzetrekening</dt><dd className="text-slate-500">{ledgers.find(l=>l.id===config?.mapping.revenue)?.description || `Rekening ${config?.mapping.revenue} uit stap 2`}</dd></div>:null}</dl><p className="mt-4 text-sm text-slate-500">Controleer ook of dit document al in e-Boekhouden staat. Na overzetten zie je het boekingsnummer hier terug.</p><div className="mt-5 flex flex-wrap gap-2"><button autoFocus disabled={Boolean(busy)} onClick={()=>exportRow(selected)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">{busy==='export'?'Boeking verwerken…':'Bevestigen en overzetten'}</button><button disabled={Boolean(busy)} onClick={()=>setSelected(null)} className="rounded-xl border px-4 py-2.5 text-sm">Annuleren</button></div></div></div>:null}
    {config?.connected ? <button type="button" disabled={Boolean(busy)} onClick={disconnect} className="text-sm font-medium text-red-700 disabled:opacity-40">Koppeling verbreken</button> : null}
  </div>;
}
