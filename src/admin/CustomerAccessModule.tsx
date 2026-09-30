import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Mail, RefreshCw, ShieldCheck, UserPlus } from "lucide-react";
import { clientAccessApi } from "./client-access-data";
import { ClientAccessError, invitationIsOpen, invitationStatus, type ClientAccessMutation, type ClientAccessOverview, type ClientInvitation, type ClientMember } from "./client-access-api";

type PendingAction = { body: ClientAccessMutation; title: string; description: string; email: string; siteName: string; button: string; success: string };
type WithoutRequestId<T> = T extends unknown ? Omit<T, "request_id"> : never;
const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50";
const buttonClass = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

function dateLabel(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("nl-NL", { dateStyle: "medium", timeStyle: "short" });
}

export default function CustomerAccessModule() {
  const [overview, setOverview] = useState<ClientAccessOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [denied, setDenied] = useState(false);
  const [siteSlug, setSiteSlug] = useState("");
  const [filter, setFilter] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [checkDelivery, setCheckDelivery] = useState(false);
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  const generation = useRef(0);

  const load = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true); setError("");
    try {
      const data = await clientAccessApi.list();
      if (current !== generation.current) return;
      setOverview(data); setDenied(false);
      setSiteSlug(selected => data.sites.some(site => site.slug === selected && site.active) ? selected : data.sites.find(site => site.active)?.slug || "");
    } catch (err) {
      if (current !== generation.current) return;
      setOverview(null);
      setDenied(err instanceof ClientAccessError && [401, 403].includes(err.status || 0));
      setError(err instanceof Error ? err.message : "Klanttoegang kon niet worden geladen.");
    } finally { if (current === generation.current) setLoading(false); }
  }, []);

  useEffect(() => { void load(); return () => { generation.current++; }; }, [load]);
  useEffect(() => { if (pending) confirmationHeading.current?.focus(); }, [pending]);

  const siteName = (slug: string) => overview?.sites.find(site => site.slug === slug)?.name || slug;
  const prepare = (action: Omit<PendingAction, "body"> & { body: WithoutRequestId<ClientAccessMutation> }) => {
    setError(""); setNotice("");
    setCheckDelivery(false);
    setPending({ ...action, body: { ...action.body, request_id: crypto.randomUUID() } as ClientAccessMutation });
  };

  function prepareInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selected = overview?.sites.find(site => site.slug === siteSlug && site.active);
    if (!selected || busy) return;
    const normalized = email.trim().toLowerCase();
    prepare({ body: { action: "invite", site_slug: selected.slug, email: normalized }, title: "Uitnodiging controleren", description: "Deze klant ontvangt een e-mail om met een eigen account deze website te beheren. Bestaande klanten gebruiken hun bestaande Vedantix-account.", email: normalized, siteName: selected.name, button: "Uitnodiging versturen", success: "De uitnodiging is verwerkt. Controleer hieronder de verzendstatus." });
  }

  function prepareRecovery(member: ClientMember) {
    prepare({ body: { action: "recovery", site_slug: member.site_slug, user_id: member.user_id }, title: "Herstelmail controleren", description: "Deze klant ontvangt een link om zelf een nieuw wachtwoord te kiezen. Het nieuwe wachtwoord geldt voor alle websites die met dit account worden beheerd.", email: member.email || "E-mailadres onbekend", siteName: siteName(member.site_slug), button: "Herstelmail versturen", success: "De aanvraag voor wachtwoordherstel is verwerkt." });
  }

  function prepareMembership(member: ClientMember) {
    prepare({ body: { action: "set_membership_active", site_slug: member.site_slug, user_id: member.user_id, active: !member.active }, title: member.active ? "Websitetoegang intrekken" : "Websitetoegang herstellen", description: member.active ? "De klant kan deze website hierna niet meer beheren. Toegang tot eventuele andere websites blijft behouden." : "De klant krijgt opnieuw beheerrechten voor deze website met het bestaande account.", email: member.email || "E-mailadres onbekend", siteName: siteName(member.site_slug), button: member.active ? "Toegang intrekken" : "Toegang herstellen", success: member.active ? "De websitetoegang is ingetrokken." : "De websitetoegang is hersteld." });
  }

  function prepareCancellation(invitation: ClientInvitation) {
    prepare({ body: { action: "cancel_invitation", invitation_id: invitation.id }, title: "Uitnodiging intrekken", description: "Deze openstaande uitnodiging kan hierna geen toegang meer geven. Controleer bestaande toegang afzonderlijk in het overzicht.", email: invitation.email, siteName: siteName(invitation.site_slug), button: "Uitnodiging intrekken", success: "De uitnodiging is ingetrokken." });
  }

  async function confirmAction() {
    if (!pending || busy) return;
    const action = pending;
    setBusy(true); setError("");
    try {
      await clientAccessApi.mutate(action.body);
      setNotice(action.success); setPending(null);
      if (action.body.action === "invite") setEmail("");
      await load();
    } catch (err) {
      // Keep the same request ID for a deliberate retry after a network failure.
      setCheckDelivery(err instanceof ClientAccessError && err.status === 202);
      setError(err instanceof Error ? err.message : "De actie kon niet worden bevestigd.");
    } finally { setBusy(false); }
  }

  const members = overview?.members.filter(member => !filter || member.site_slug === filter) || [];
  const invitations = overview?.invitations.filter(invitation => !filter || invitation.site_slug === filter) || [];
  const blocked = busy || loading || Boolean(pending);

  return <div className="space-y-6">
    <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-950"><ShieldCheck size={21} className="mt-0.5 shrink-0" /><p>Beheer klantaccounts per website. Klanten krijgen toegang tot hun eigen websitebeheer. Interne Vedantix-rollen blijven onder <strong>Team & toegang</strong>.</p></div>
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-slate-500">{overview ? `${overview.sites.length} websites · ${overview.members.filter(member => member.active).length} actieve koppelingen` : "Centrale klanttoegang"}</p><button type="button" className={buttonClass} onClick={() => void load()} disabled={blocked}><RefreshCw size={14} className={`mr-2 inline ${loading ? "animate-spin" : ""}`} />Vernieuwen</button></div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{notice}</div>}
    {loading && !overview && <p role="status" className="py-8 text-center text-sm text-slate-500">Klanttoegang laden…</p>}
    {pending && <section className="rounded-2xl border-2 border-blue-300 bg-white p-5 shadow-sm" aria-labelledby="client-access-confirm-title">
      <h2 id="client-access-confirm-title" ref={confirmationHeading} tabIndex={-1} className="text-lg font-semibold text-slate-950 outline-none">{pending.title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{pending.description}</p>
      <dl className="my-5 grid gap-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-[100px_1fr]"><dt className="text-slate-500">Website</dt><dd className="font-semibold">{pending.siteName}</dd><dt className="text-slate-500">E-mailadres</dt><dd className="break-all font-semibold">{pending.email}</dd></dl>
      <div className="flex flex-wrap gap-3"><button type="button" onClick={() => void confirmAction()} disabled={busy || loading} className="rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? "Bezig…" : checkDelivery ? "Status opnieuw controleren" : pending.button}</button><button type="button" className={buttonClass} disabled={busy} onClick={() => { setPending(null); setError(""); }}>Annuleren</button></div>
    </section>}
    {overview && !denied && <>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><UserPlus size={20} />Klant uitnodigen</h2><p className="mt-1 text-sm text-slate-500">Controleer de website en het persoonlijke e-mailadres vóór het versturen.</p>
        <form onSubmit={prepareInvite} className="mt-5 grid items-end gap-4 md:grid-cols-[1fr_1fr_auto]"><label className="text-sm font-medium text-slate-700">Website<select className={fieldClass} value={siteSlug} onChange={event => setSiteSlug(event.target.value)} required disabled={blocked}><option value="" disabled>Kies een actieve website</option>{overview.sites.map(site => <option key={site.slug} value={site.slug} disabled={!site.active}>{site.name}{site.active ? "" : " (nog niet actief)"}</option>)}</select></label><label className="text-sm font-medium text-slate-700">E-mailadres<input className={fieldClass} type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={254} disabled={blocked} /></label><button type="submit" disabled={blocked || !siteSlug} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Uitnodiging controleren</button></form>
        {!overview.sites.some(site => site.active) && <p className="mt-4 text-sm text-amber-800">Er is nog geen actieve klantwebsite gekoppeld. Uitnodigen is beschikbaar zodra een website is geactiveerd.</p>}
      </section>
      <div className="flex items-center gap-3"><label htmlFor="client-access-site-filter" className="text-sm font-medium text-slate-700">Toon website</label><select id="client-access-site-filter" value={filter} onChange={event => setFilter(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Alle websites</option>{overview.sites.map(site => <option key={site.slug} value={site.slug}>{site.name}</option>)}</select></div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Websitetoegang</h2><p className="mt-1 text-sm text-slate-500">Eén account kan voor meerdere websites een afzonderlijke toegang hebben.</p>
        {!members.length ? <p className="py-8 text-center text-sm text-slate-500">Nog geen klanttoegang voor deze selectie.</p> : <ul className="mt-5 divide-y divide-slate-100">{members.map(member => <li key={`${member.site_slug}:${member.user_id}`} className="flex flex-wrap items-center justify-between gap-4 py-4"><div className="min-w-0"><strong className="block break-all text-sm">{member.email || "E-mailadres niet beschikbaar"}</strong><span className="text-xs text-slate-500">{siteName(member.site_slug)}</span><span className={`ml-3 rounded-full px-2 py-1 text-[11px] font-semibold ${member.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{member.active ? "Actief" : "Ingetrokken"}</span></div><div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} disabled={blocked || !member.active || !member.email} onClick={() => prepareRecovery(member)}><Mail size={13} className="mr-1.5 inline" />Herstelmail</button><button type="button" className={buttonClass} disabled={blocked} onClick={() => prepareMembership(member)}>{member.active ? "Toegang intrekken" : "Toegang herstellen"}</button></div></li>)}</ul>}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-950">Uitnodigingen</h2><p className="mt-1 text-sm text-slate-500">Om opnieuw uit te nodigen, kies je hierboven hetzelfde e-mailadres en dezelfde website.</p>
        {!invitations.length ? <p className="py-8 text-center text-sm text-slate-500">Nog geen uitnodigingen voor deze selectie.</p> : <ul className="mt-5 divide-y divide-slate-100">{invitations.map(invitation => <li key={invitation.id} className="flex flex-wrap items-center justify-between gap-4 py-4"><div className="min-w-0"><strong className="block break-all text-sm">{invitation.email}</strong><p className="text-xs text-slate-500">{siteName(invitation.site_slug)} · {invitationStatus(invitation.status)}</p><p className="mt-1 text-xs text-slate-400">Aangemaakt: {dateLabel(invitation.created_at)}{invitation.sent_at && ` · Verstuurd: ${dateLabel(invitation.sent_at)}`}{invitation.expires_at && ` · Geldig tot: ${dateLabel(invitation.expires_at)}`}</p></div>{invitationIsOpen(invitation) && <button type="button" className={buttonClass} disabled={blocked} onClick={() => prepareCancellation(invitation)}>Uitnodiging intrekken</button>}</li>)}</ul>}
      </section>
    </>}
  </div>;
}
