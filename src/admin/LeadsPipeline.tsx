import AdminLayout from "./AdminLayout";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileText,
  Mail,
  MessageSquareText,
  Phone,
  Plus,
  RefreshCw,
  Target,
  UserRoundCheck,
  X,
} from "lucide-react";
import {
  LEAD_SOURCE_LABELS,
  LEAD_STAGE_LABELS,
  LEAD_STAGES,
  addLeadNote,
  changeLeadStage,
  createManualLead,
  createQuoteForLead,
  listLeadActivities,
  listSalesLeads,
  markLeadContacted,
  scheduleLeadFollowUp,
  type LeadActivity,
  type LeadSource,
  type LeadStage,
  type SalesLead,
} from "./leads-data";

function formatDate(value?: string | null, withTime = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("nl-NL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function scoreTone(score: number) {
  if (score >= 75) return "bg-red-50 text-red-700 ring-red-100";
  if (score >= 55) return "bg-amber-50 text-amber-700 ring-amber-100";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function stageTone(stage: LeadStage) {
  return {
    NEW: "bg-sky-50 text-sky-700",
    CONTACT: "bg-indigo-50 text-indigo-700",
    CONVERSATION: "bg-violet-50 text-violet-700",
    QUOTE: "bg-amber-50 text-amber-700",
    WON: "bg-emerald-50 text-emerald-700",
    LOST: "bg-slate-100 text-slate-600",
  }[stage];
}

function leadAuditScore(lead: SalesLead) {
  const value = lead.latest_audit?.results?.["overallScore"];
  return typeof value === "number" ? value : null;
}

function isFollowUpDue(lead: SalesLead) {
  if (!lead.next_follow_up_at || ["WON", "LOST"].includes(lead.stage)) return false;
  return new Date(lead.next_follow_up_at).getTime() <= Date.now();
}

export default function LeadsPipeline() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setLeads(await listSalesLeads());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Leads konden niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const selected = leads.find((lead) => lead.id === selectedId) ?? null;
  const stats = useMemo(() => ({
    open: leads.filter((lead) => !["WON", "LOST"].includes(lead.stage)).length,
    new: leads.filter((lead) => lead.stage === "NEW").length,
    due: leads.filter(isFollowUpDue).length,
    quote: leads.filter((lead) => lead.stage === "QUOTE").length,
    won: leads.filter((lead) => lead.stage === "WON").length,
  }), [leads]);

  return (
    <AdminLayout actions={<><button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Vernieuwen</button><button type="button" onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"><Plus size={14}/> Nieuwe lead</button></>}>

      <main className="mx-auto max-w-[1600px] p-4 md:p-7">
        <div className="mb-7">
          <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Sales</span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Leads & opvolging</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">Nieuwe Online Groei Audits verschijnen automatisch als lead. Beheer opvolging, gesprekken en offertes vanuit één pipeline.</p>
        </div>

        {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {([
            ["Open leads", stats.open, Target],
            ["Nieuw", stats.new, Plus],
            ["Opvolging nodig", stats.due, CalendarClock],
            ["Offertefase", stats.quote, FileText],
            ["Gewonnen", stats.won, CheckCircle2],
          ] as const).map(([label, value, Icon]) => (
            <article key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Icon size={17} className="mb-3 text-slate-500" />
              <p className="text-xs text-slate-500">{String(label)}</p>
              <strong className="mt-1 block text-2xl">{loading ? "—" : String(value)}</strong>
            </article>
          ))}
        </section>

        <section className="overflow-x-auto pb-4">
          <div className="grid min-w-[1740px] grid-cols-6 gap-4">
            {LEAD_STAGES.map((stage) => {
              const stageLeads = leads.filter((lead) => lead.stage === stage);
              return (
                <div key={stage} className="rounded-2xl border border-slate-200 bg-slate-100/70 p-3">
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stageTone(stage)}`}>{LEAD_STAGE_LABELS[stage]}</span></div>
                    <span className="text-xs font-semibold text-slate-400">{stageLeads.length}</span>
                  </div>
                  <div className="space-y-3">
                    {stageLeads.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 bg-white/60 px-3 py-8 text-center text-xs text-slate-400">Geen leads</div> : null}
                    {stageLeads.map((lead) => (
                      <button key={lead.id} type="button" onClick={() => setSelectedId(lead.id)} className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0"><strong className="block truncate text-sm">{lead.customer.company_name}</strong><span className="mt-0.5 block truncate text-xs text-slate-400">{lead.customer.contact_name || lead.customer.email || "Geen contactpersoon"}</span></div>
                          <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-bold ring-1 ${scoreTone(lead.score)}`}>{lead.score}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">{LEAD_SOURCE_LABELS[lead.source]}</span>
                          {leadAuditScore(lead) !== null ? <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-600">Audit {leadAuditScore(lead)}/100</span> : null}
                        </div>
                        {lead.website_url ? <span className="mt-3 block truncate text-xs text-slate-500">{lead.website_url.replace(/^https?:\/\//, "")}</span> : null}
                        {lead.next_follow_up_at ? <div className={`mt-3 flex items-center gap-1.5 text-xs ${isFollowUpDue(lead) ? "font-semibold text-red-600" : "text-slate-500"}`}><CalendarClock size={13} />{formatDate(lead.next_follow_up_at, true)}</div> : null}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {!loading && leads.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center"><Target className="mx-auto mb-3 text-slate-300" /><strong className="block">Nog geen leads</strong><p className="mt-1 text-sm text-slate-500">Een nieuwe Online Groei Audit wordt automatisch toegevoegd, of maak handmatig een lead aan.</p></div> : null}
      </main>

      {selected ? <LeadDetail lead={selected} onClose={() => setSelectedId(null)} onChanged={load} /> : null}
      {showCreate ? <CreateLeadModal onClose={() => setShowCreate(false)} onCreated={async (lead) => { setShowCreate(false); await load(); setSelectedId(lead.id); }} /> : null}
    </AdminLayout>
  );
}

function LeadDetail({ lead, onClose, onChanged }: { lead: SalesLead; onClose: () => void; onChanged: () => Promise<void> }) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState(toLocalInput(lead.next_follow_up_at));
  const [error, setError] = useState<string | null>(null);

  async function loadActivities() {
    try { setActivities(await listLeadActivities(lead.id)); } catch { setActivities([]); }
  }
  useEffect(() => { void loadActivities(); }, [lead.id]);
  useEffect(() => { setFollowUp(toLocalInput(lead.next_follow_up_at)); }, [lead.next_follow_up_at]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true); setError(null);
    try { await action(); await onChanged(); await loadActivities(); }
    catch (err) { setError(err instanceof Error ? err.message : "Actie mislukt."); }
    finally { setBusy(false); }
  }

  async function setStage(stage: LeadStage) {
    let lostReason: string | null = null;
    if (stage === "LOST") {
      lostReason = window.prompt("Waarom is deze lead verloren?", lead.lost_reason || "") ?? null;
      if (lostReason === null) return;
    }
    await run(() => changeLeadStage(lead.id, stage, lostReason));
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const clean = note.trim();
    if (!clean) return;
    await run(async () => { await addLeadNote(lead.id, clean); setNote(""); });
  }

  const auditScore = leadAuditScore(lead);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <aside className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white/95 p-5 backdrop-blur">
          <div><span className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Lead</span><h2 className="mt-1 text-2xl font-bold">{lead.customer.company_name}</h2><p className="mt-1 text-sm text-slate-500">{lead.customer.contact_name || lead.customer.email}</p></div>
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><X size={17} /></button>
        </div>

        <div className="space-y-6 p-5">
          {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-500">Leadscore</span><strong className="mt-1 block text-2xl">{lead.score}/100</strong></div>
            <div className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-500">Bron</span><strong className="mt-1 block text-sm">{LEAD_SOURCE_LABELS[lead.source]}</strong></div>
            <div className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-500">Audit</span><strong className="mt-1 block text-sm">{auditScore === null ? "Niet beschikbaar" : `${auditScore}/100`}</strong></div>
          </div>

          <section className="rounded-2xl border border-slate-200 p-4">
            <label className="text-xs font-semibold uppercase tracking-[.12em] text-slate-400">Verkoopfase</label>
            <select value={lead.stage} disabled={busy} onChange={(event) => void setStage(event.target.value as LeadStage)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-slate-400">
              {LEAD_STAGES.map((stage) => <option key={stage} value={stage}>{LEAD_STAGE_LABELS[stage]}</option>)}
            </select>
            {lead.stage === "LOST" && lead.lost_reason ? <p className="mt-2 text-xs text-slate-500">Reden: {lead.lost_reason}</p> : null}
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <h3 className="font-semibold">Contact</h3>
            <div className="mt-3 space-y-2 text-sm">
              {lead.customer.email ? <a className="flex items-center gap-2 text-slate-600 hover:text-slate-950" href={`mailto:${lead.customer.email}`}><Mail size={15} />{lead.customer.email}</a> : null}
              {lead.customer.phone ? <a className="flex items-center gap-2 text-slate-600 hover:text-slate-950" href={`tel:${lead.customer.phone}`}><Phone size={15} />{lead.customer.phone}</a> : null}
              {lead.website_url ? <a className="flex items-center gap-2 text-slate-600 hover:text-slate-950" href={lead.website_url} target="_blank" rel="noreferrer"><ExternalLink size={15} />{lead.website_url}</a> : null}
            </div>
            <button type="button" disabled={busy} onClick={() => void run(() => markLeadContacted(lead))} className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><UserRoundCheck size={14} /> Contactmoment registreren</button>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <h3 className="font-semibold">Opvolging</h3>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input type="datetime-local" value={followUp} onChange={(event) => setFollowUp(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
              <button type="button" disabled={busy} onClick={() => void run(() => scheduleLeadFollowUp(lead.id, followUp ? new Date(followUp).toISOString() : null))} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">Opslaan</button>
            </div>
            {lead.next_follow_up_at ? <p className={`mt-2 text-xs ${isFollowUpDue(lead) ? "font-semibold text-red-600" : "text-slate-500"}`}>Gepland: {formatDate(lead.next_follow_up_at, true)}</p> : null}
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Audit & offerte</h3><p className="mt-1 text-xs text-slate-500">Van analyse direct door naar commercieel voorstel.</p></div></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {lead.latest_audit?.public_token ? <a href={`/online-groei-audit?audit=${lead.latest_audit.public_token}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><ExternalLink size={14} /> Audit openen</a> : null}
              <button type="button" disabled={busy} onClick={() => void run(() => createQuoteForLead(lead))} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"><FileText size={14} /> {lead.latest_quote ? "Nieuwe offerte" : "Offerte maken"}</button>
              {lead.latest_quote ? <a href="/admin/billing?section=quotes" className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50"><ExternalLink size={14} /> {lead.latest_quote.quote_number || "Offerte"} · {lead.latest_quote.status}</a> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <h3 className="font-semibold">Notitie toevoegen</h3>
            <form onSubmit={submitNote} className="mt-3 flex gap-2">
              <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Bijv. terugbellen na 14:00" className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400" />
              <button disabled={busy || !note.trim()} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"><MessageSquareText size={15} /></button>
            </form>
          </section>

          <section>
            <h3 className="font-semibold">Activiteit</h3>
            <div className="mt-3 space-y-2">
              {activities.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">Nog geen activiteiten.</div> : activities.map((activity) => (
                <div key={activity.id} className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"><div className="flex items-center justify-between gap-3"><strong className="text-xs">{activity.activity_type.replaceAll("_", " ")}</strong><span className="text-[11px] text-slate-400">{formatDate(activity.created_at, true)}</span></div>{activity.body ? <p className="mt-1 text-sm text-slate-600">{activity.body}</p> : null}</div>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

function CreateLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (lead: SalesLead) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    try {
      const data = new FormData(event.currentTarget);
      const lead = await createManualLead({
        companyName: String(data.get("company") || ""),
        contactName: String(data.get("contact") || ""),
        email: String(data.get("email") || ""),
        phone: String(data.get("phone") || ""),
        websiteUrl: String(data.get("website") || ""),
        source: String(data.get("source") || "MANUAL") as LeadSource,
        note: String(data.get("note") || ""),
      });
      await onCreated(lead);
    } catch (err) { setError(err instanceof Error ? err.message : "Lead kon niet worden aangemaakt."); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <form onSubmit={submit} className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between"><div><h2 className="text-xl font-bold">Nieuwe lead</h2><p className="mt-1 text-sm text-slate-500">Handmatig een commerciële kans toevoegen.</p></div><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500"><X size={16} /></button></div>
        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Bedrijf" name="company" required />
          <Field label="Contactpersoon" name="contact" />
          <Field label="E-mail" name="email" type="email" required />
          <Field label="Telefoon" name="phone" />
          <Field label="Website" name="website" placeholder="https://..." />
          <label className="text-sm font-medium text-slate-700">Bron<select name="source" defaultValue="MANUAL" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="MANUAL">Handmatig</option><option value="CONTACT">Contactformulier</option><option value="WHATSAPP">WhatsApp</option><option value="OTHER">Overig</option></select></label>
        </div>
        <label className="mt-4 block text-sm font-medium text-slate-700">Notitie<textarea name="note" rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5" placeholder="Context of volgende actie" /></label>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Annuleren</button><button disabled={busy} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Opslaan..." : "Lead toevoegen"}</button></div>
      </form>
    </div>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="text-sm font-medium text-slate-700">{label}<input name={name} type={type} required={required} placeholder={placeholder} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400" /></label>;
}

