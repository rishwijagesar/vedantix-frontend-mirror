import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from '@/lib/router-compat';
import { loadCustomerMargins, saveCustomerCost, saveMarginProfile } from './customer-margin-data';
import { annualCents, categories, money, periodLabels, summarizeCustomer, today, type CustomerCost, type MarginData, type MarginProfile, type Period } from './customer-margin-model';

const panel = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';
const input = 'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm';
const button = 'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium disabled:opacity-50';
const primary = 'rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50';
const monthly = (annual: number) => money(annual / 1200);
const errorText = (e: unknown) => e instanceof Error ? e.message : 'Er ging iets mis. Probeer opnieuw.';

function Field({ title, children }: { title: string; children: ReactNode }) {
  return <label className="block text-sm font-medium text-slate-800">{title}{children}</label>;
}
function PeriodSelect({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return <select className={input} value={value} onChange={e => onChange(e.target.value as Period)}>{Object.entries(periodLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>;
}
function Metric({ title, value, note, negative = false }: { title: string; value: string; note: string; negative?: boolean }) {
  return <div className={panel}><p className="text-sm text-slate-500">{title}</p><p className={`mt-3 text-2xl font-bold tracking-tight ${negative ? 'text-rose-700' : 'text-slate-950'}`}>{value}</p><p className="mt-2 text-xs leading-relaxed text-slate-500">{note}</p></div>;
}

function CostEditor({ data, previous, customerId, busy, onSave, onCancel }: {
  data: MarginData; previous?: CustomerCost; customerId: string; busy: boolean;
  onSave: (cost: Omit<CustomerCost, 'id' | 'revision' | 'updated_at'>, ids: string[], previous?: CustomerCost) => Promise<void>; onCancel: () => void;
}) {
  const [name, setName] = useState(previous?.name || '');
  const [supplier, setSupplier] = useState(previous?.supplier || '');
  const [category, setCategory] = useState<keyof typeof categories>(previous?.category || 'hosting');
  const [amount, setAmount] = useState(previous ? String(previous.amount) : '');
  const [period, setPeriod] = useState<Period>(previous?.period || 'MONTHLY');
  const [notes, setNotes] = useState(previous?.notes || '');
  const [ids, setIds] = useState(previous ? data.allocations.filter(a => a.cost_id === previous.id).map(a => a.customer_id) : customerId ? [customerId] : []);
  const [error, setError] = useState('');
  const parsed = Number(amount);
  const valid = amount.trim() !== '' && Number.isFinite(parsed) && parsed >= 0 && parsed <= 99999999 && Math.abs(parsed * 100 - Math.round(parsed * 100)) < 0.000001;
  const share = valid && ids.length ? monthly(annualCents(parsed, period) / ids.length) : null;
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    if (!valid || !ids.length || !name.trim()) { setError('Vul een naam, geldig bedrag en minstens één klant in.'); return; }
    try { await onSave({ name: name.trim(), supplier: supplier.trim(), category, amount: parsed, period, notes, archived: previous?.archived || false }, ids, previous); }
    catch (e) { setError(errorText(e)); }
  }
  return <form className={panel} onSubmit={submit} aria-label={previous ? 'Kostenpost bewerken' : 'Kostenpost toevoegen'}>
    <h2 className="text-lg font-semibold">{previous ? 'Kostenpost bewerken' : 'Kostenpost toevoegen'}</h2>
    <p className="mt-1 text-sm text-slate-500">Neem de terugkerende kosten over van je leveranciersfactuur. Een gedeeld abonnement voer je één keer in.</p>
    <fieldset disabled={busy} className="mt-5 space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field title="Naam kostenpost"><input className={input} value={name} onChange={e => setName(e.target.value)} maxLength={200} required placeholder="Bijvoorbeeld: mailhosting" /></Field>
        <Field title="Leverancier"><input className={input} value={supplier} onChange={e => setSupplier(e.target.value)} maxLength={200} placeholder="Bijvoorbeeld: Migadu" /></Field>
        <Field title="Soort kosten"><select className={input} value={category} onChange={e => setCategory(e.target.value as keyof typeof categories)}>{Object.entries(categories).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3"><Field title="Bedrag excl. btw (€)"><input className={input} type="number" min="0" max="99999999" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required /></Field><Field title="Betaaltermijn"><PeriodSelect value={period} onChange={setPeriod} /></Field></div>
      </div>
      <fieldset><legend className="text-sm font-medium">Voor welke klanten betaal je dit?</legend>
        <p className="mb-3 mt-1 text-xs text-slate-500">Bij meerdere klanten verdelen we het bedrag gelijk. Je selectie blijft vast totdat je deze aanpast.</p>
        <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 sm:grid-cols-2">{data.customers.map(c => <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={ids.includes(c.id)} onChange={e => setIds(e.target.checked ? [...ids, c.id] : ids.filter(id => id !== c.id))} />{c.company_name}</label>)}</div>
        {share && <p className="mt-2 text-sm text-blue-700">Gemiddeld circa {share} per maand per klant · {ids.length} geselecteerd</p>}
      </fieldset>
      <Field title="Toelichting (optioneel)"><textarea className={input} rows={2} maxLength={2000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Wat is inbegrepen en waarop is het bedrag gebaseerd?" /></Field>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <div className="flex flex-wrap gap-2"><button className={primary} type="submit">{busy ? 'Opslaan…' : 'Kosten opslaan'}</button><button className={button} type="button" onClick={onCancel}>Annuleren</button></div>
    </fieldset>
  </form>;
}

function RevenueEditor({ profile, annual, busy, onSave }: { profile?: MarginProfile; annual: number | null; busy: boolean; onSave: (changes: Partial<MarginProfile>) => Promise<void> }) {
  const [amount, setAmount] = useState(profile?.revenue_amount != null ? String(profile.revenue_amount) : annual !== null ? String(annual / 100) : '');
  const [period, setPeriod] = useState<Period>(profile?.revenue_amount != null ? profile.revenue_period : 'YEARLY');
  const [note, setNote] = useState(profile?.revenue_note || '');
  const [error, setError] = useState('');
  async function submit(e: FormEvent) {
    e.preventDefault(); setError('');
    try { await onSave({ revenue_amount: Number(amount), revenue_period: period, revenue_note: note }); } catch (e) { setError(errorText(e)); }
  }
  return <form onSubmit={submit} aria-label="Terugkerende opbrengst instellen" className="mt-4 border-t border-slate-200 pt-4">
    <fieldset disabled={busy}>
      <h3 className="font-semibold">Terugkerende prijsafspraak bevestigen</h3>
      <p className="mb-3 mt-1 text-xs leading-relaxed text-slate-500">Gebruik het bedrag dat de klant voortaan betaalt. Dit is alleen voor dit overzicht; facturen en abonnementen wijzigen niet.</p>
      <div className="grid gap-3 sm:grid-cols-2"><Field title="Opbrengst excl. btw (€)"><input type="number" className={input} min="0" max="99999999" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} /></Field><Field title="Periode opbrengst"><PeriodSelect value={period} onChange={setPeriod} /></Field></div>
      <Field title="Toelichting prijsafspraak"><input className={input} maxLength={2000} value={note} onChange={e => setNote(e.target.value)} placeholder="Bijvoorbeeld: web- en mailhosting, afgesproken jaarprijs" /></Field>
      {error && <p role="alert" className="mt-2 text-sm text-rose-700">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2"><button type="submit" className={primary}>Prijsafspraak opslaan</button>{profile?.revenue_amount != null && <button className={button} type="button" onClick={async () => { setError(''); try { await onSave({ revenue_amount: null, revenue_note: '' }); } catch (e) { setError(errorText(e)); } }}>Weer uit abonnementen / facturen halen</button>}</div>
    </fieldset>
  </form>;
}

export default function CustomerMarginModule() {
  const [params] = useSearchParams();
  const [selected, setSelected] = useState(params.get('customer') || '');
  const [data, setData] = useState<MarginData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [allStatuses, setAllStatuses] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<CustomerCost | 'new' | null>(null);
  const asOf = today();
  async function reload() {
    setLoading(true); setError('');
    try { setData(await loadCustomerMargins()); }
    catch (e) { setData(null); setError(errorText(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void reload(); }, []);
  const calculated = useMemo(() => {
    if (!data) return { rows: [], error: '' };
    try { return { rows: data.customers.map(c => summarizeCustomer(c, data, asOf)), error: '' }; }
    catch (e) { return { rows: [], error: errorText(e) }; }
  }, [data, asOf]);
  const rows = calculated.rows.filter(r => (allStatuses || r.customer.status === 'ACTIVE') && r.customer.company_name.toLowerCase().includes(search.toLowerCase()));
  const detail = calculated.rows.find(r => r.customer.id === selected);
  const confirmed = rows.length > 0 && rows.every(r => r.complete);
  const annualRevenue = rows.reduce((n, r) => n + (r.revenue.annual || 0), 0);
  const annualCost = rows.reduce((n, r) => n + r.annualCost, 0);
  async function mutate(action: () => Promise<void>, message: string) {
    setBusy(true); setNotice('');
    try { await action(); setEditor(null); await reload(); setNotice(message); }
    finally { setBusy(false); }
  }
  async function changeProfile(changes: Partial<MarginProfile>) {
    if (!data || !detail) return;
    await mutate(() => saveMarginProfile(detail.customer.id, changes, data.profiles.find(p => p.id === detail.customer.id)), 'Klantgegevens opgeslagen.');
  }
  if (loading) return <div className={panel} role="status">Klantcijfers laden…</div>;
  if (!data || calculated.error) return <div className={panel}><p role="alert" className="text-rose-700">{error || calculated.error}</p><button className={`${button} mt-3`} onClick={() => void reload()}>Opnieuw proberen</button></div>;
  const costs = data.costs.filter(c => (showArchived || !c.archived) && (!selected || data.allocations.some(a => a.cost_id === c.id && a.customer_id === selected)));
  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-2xl text-sm leading-relaxed text-slate-600">Wat levert een klant iedere maand op, en wat betaal jij ervoor? Alle bedragen zijn excl. btw. Jaar- en kwartaalbedragen rekenen we om naar een maandgemiddelde.</p><div className="flex gap-2"><button className={button} disabled={busy} onClick={() => void reload()}>Cijfers vernieuwen</button><button className={primary} disabled={busy} onClick={() => { setEditor('new'); setNotice(''); }}>+ Kosten toevoegen</button></div></div>
    {notice && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
    {editor && <CostEditor key={editor === 'new' ? 'new' : editor.id} data={data} previous={editor === 'new' ? undefined : editor} customerId={selected} busy={busy} onCancel={() => setEditor(null)} onSave={(cost, ids, previous) => mutate(() => saveCustomerCost(cost, ids, previous), 'Kosten opgeslagen. Controleer de kosten van de betrokken klanten opnieuw.')} />}
    <div className="grid gap-4 md:grid-cols-3">
      <Metric title="Terugkerende opbrengst / maand" value={rows.some(r => r.revenue.annual !== null) ? monthly(annualRevenue) : 'Nog onbekend'} note={`${rows.length} getoonde klanten${rows.some(r => !r.revenue.confirmed) ? ' · deels indicatief of ontbrekend' : ' · op basis van prijsafspraken'}`} />
      <Metric title="Ingevoerde kosten / maand" value={monthly(annualCost)} note={rows.every(r => r.costsReviewed) && rows.length ? 'Kosten gecontroleerd voor de getoonde klanten' : 'Kosten zijn nog niet voor alle klanten gecontroleerd'} />
      <Metric title="Marge na ingevoerde kosten / maand" value={confirmed ? monthly(annualRevenue - annualCost) : 'Nog onvolledig'} negative={confirmed && annualRevenue < annualCost} note={confirmed ? `${money((annualRevenue - annualCost) / 100)} per jaar · vóór eigen uren en belasting` : 'Bevestig per klant de opbrengst en controleer de kosten'} />
    </div>
    <section className={panel} aria-label="Rendement per klant">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Per klant</h2><div className="flex flex-wrap items-center gap-3"><input aria-label="Zoek klant" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Zoek klant…" value={search} onChange={e => setSearch(e.target.value)} /><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={allStatuses} onChange={e => setAllStatuses(e.target.checked)} />Ook leads en inactieve klanten</label></div></div>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-xs text-slate-500"><th className="p-3">Klant</th><th className="p-3 text-right">Opbrengst / mnd</th><th className="p-3 text-right">Kosten / mnd</th><th className="p-3 text-right">Marge / mnd</th><th className="p-3">Controle</th></tr></thead><tbody>{rows.map(r => <tr key={r.customer.id} className={`border-b border-slate-100 ${selected === r.customer.id ? 'bg-blue-50' : ''}`}><td className="p-3"><button className="text-left font-semibold text-blue-700 underline-offset-4 hover:underline" onClick={() => { setSelected(r.customer.id); setEditor(null); }}>{r.customer.company_name}</button></td><td className="whitespace-nowrap p-3 text-right">{r.revenue.annual === null ? '—' : monthly(r.revenue.annual)}{r.revenue.source === 'INVOICE' && <span className="block text-xs text-amber-700">Indicatie</span>}</td><td className="whitespace-nowrap p-3 text-right">{r.costRows.length || r.costsReviewed ? monthly(r.annualCost) : 'Nog invullen'}</td><td className={`whitespace-nowrap p-3 text-right font-semibold ${r.complete && r.annualMargin! < 0 ? 'text-rose-700' : ''}`}>{r.complete ? monthly(r.annualMargin!) : '—'}</td><td className={`p-3 text-xs ${!r.complete ? 'text-amber-800' : r.annualMargin! < 0 ? 'text-rose-700' : 'text-emerald-800'}`}>{r.status}</td></tr>)}</tbody></table></div>
      {!rows.length && <p className="py-5 text-sm text-slate-500">Geen klanten in deze selectie.</p>}
      <p className="mt-3 text-xs text-slate-500">Klik op een klant om de prijsafspraak, kosten en verdeling te bekijken.</p>
    </section>
    {detail && <section className={panel} aria-label="Klantdetails">
      <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">{detail.customer.company_name}</h2><button className={button} disabled={busy} onClick={() => { setSelected(''); setEditor(null); }}>Alle kosten tonen</button></div>
      <div className="mt-5 grid gap-6 lg:grid-cols-2"><div>
        <p className="text-sm font-semibold">Opbrengst: {detail.revenue.annual === null ? 'nog onbekend' : `${monthly(detail.revenue.annual)} per maand`}</p><p className="mt-2 text-sm leading-relaxed text-slate-500">{detail.revenue.description}</p>
        <RevenueEditor key={`${detail.customer.id}-${data.profiles.find(p => p.id === detail.customer.id)?.revision || 0}`} profile={data.profiles.find(p => p.id === detail.customer.id)} annual={detail.revenue.annual} busy={busy} onSave={changeProfile} />
      </div><div className="rounded-xl bg-slate-50 p-4">
        <h3 className="font-semibold">Jouw kosten voor deze klant</h3>
        {detail.costRows.map(r => <div key={r.cost.id} className="mt-3 flex justify-between gap-4 text-sm"><span>{r.cost.name}<span className="block text-xs text-slate-500">{categories[r.cost.category]}{r.customerCount > 1 ? ` · gedeeld door ${r.customerCount}` : ''}</span></span><strong className="whitespace-nowrap">{monthly(r.annual)} / mnd</strong></div>)}
        {!detail.costRows.length && <p className="mt-3 text-sm text-slate-500">Nog geen kosten ingevoerd. Voeg hosting, e-mail, domeinen en andere terugkerende kosten toe.</p>}
        <div className="mt-4 border-t border-slate-200 pt-4 text-sm"><p className="flex justify-between gap-3"><span>Ingevoerde kosten</span><strong>{monthly(detail.annualCost)} / mnd</strong></p><p className="mt-1 text-right text-xs text-slate-500">{money(detail.annualCost / 100)} per jaar</p></div>
        <button className={`${button} mt-4`} disabled={busy} onClick={() => setEditor('new')}>Kosten voor deze klant toevoegen</button>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">Heb je alle terugkerende kosten verwerkt? Bevestig dit hieronder. Ook € 0 moet je bewust controleren. Bij een wijziging vragen we je opnieuw te controleren.</p>
        <button className={`${detail.costsReviewed ? button : primary} mt-3`} disabled={busy} onClick={async () => { setError(''); try { await changeProfile({ costs_reviewed: !detail.costsReviewed }); } catch (e) { setError(errorText(e)); } }}>{detail.costsReviewed ? 'Kosten gecontroleerd · opnieuw openzetten' : 'Alle kosten gecontroleerd'}</button>
        {detail.complete && <div className={`mt-5 rounded-xl p-4 ${detail.annualMargin! < 0 ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-900'}`}><strong>{detail.annualMargin! < 0 ? 'Deze klant kost meer dan hij oplevert' : 'Marge na ingevoerde kosten'}</strong><p className="mt-2 text-2xl font-bold">{monthly(detail.annualMargin!)} / maand</p><p className="mt-1 text-xs">{money(detail.annualMargin! / 100)} per jaar{detail.marginPercent !== null ? ` · ${detail.marginPercent.toFixed(1).replace('.', ',')}% van de opbrengst` : ''}</p></div>}
      </div></div>
    </section>}
    <section className={panel} aria-label="Terugkerende kosten">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">{detail ? `Kosten gekoppeld aan ${detail.customer.company_name}` : 'Alle terugkerende kosten'}</h2><label className="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />Ook gestopte kosten</label></div>
      {!costs.length && <p className="rounded-xl bg-slate-50 p-5 text-sm leading-relaxed text-slate-500">Nog geen kostenposten in dit overzicht. Begin met je hosting- en mailabonnement. Je kunt een bedrag per maand, kwartaal of jaar invoeren.</p>}
      <div className="space-y-3">{costs.map(cost => {
        const ids = data.allocations.filter(a => a.cost_id === cost.id).map(a => a.customer_id);
        return <article key={cost.id} className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap justify-between gap-3"><div><h3 className="font-semibold">{cost.name}{cost.archived ? ' · Gestopt' : ''}</h3><p className="mt-1 text-sm text-slate-500">{cost.supplier ? `${cost.supplier} · ` : ''}{categories[cost.category]}</p><p className="mt-2 text-sm"><strong>{money(Number(cost.amount))}</strong> {periodLabels[cost.period].toLowerCase()} · {monthly(annualCents(cost.amount, cost.period))} / maand totaal</p></div><div className="flex items-start gap-2"><button className={button} disabled={busy} onClick={() => setEditor(cost)}>Bewerken</button><button className={button} disabled={busy} onClick={async () => { setError(''); try { await mutate(() => saveCustomerCost({ ...cost, archived: !cost.archived }, ids, cost), cost.archived ? 'Kostenpost weer actief.' : 'Kostenpost gestopt. Je kunt deze later weer activeren.'); } catch (e) { setError(errorText(e)); } }}>{cost.archived ? 'Activeren' : 'Stopzetten'}</button></div></div><p className="mt-3 text-xs leading-relaxed text-slate-500">{ids.length > 1 ? 'Gelijk verdeeld over: ' : 'Voor: '}{ids.map(id => data.customers.find(c => c.id === id)?.company_name || 'Onbekende klant').join(', ')}</p>{cost.notes && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{cost.notes}</p>}</article>;
      })}</div>
    </section>
    <p className="text-xs leading-relaxed text-slate-500">Dit is een planning op basis van de huidige afspraken, geen belastingberekening. Eenmalige websiteverkopen tellen niet mee als terugkerende opbrengst. Eigen uren en overige bedrijfskosten tellen alleen mee als je ze invoert. Leverancierskosten worden hier handmatig bijgehouden. Werkelijke aankopen en bewijsstukken beheer je per kwartaal in <a className="text-blue-700 underline" href="/admin/billing?section=administration">Administratie</a>.</p>
  </div>;
}
