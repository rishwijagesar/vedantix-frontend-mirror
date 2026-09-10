import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, Link2, RefreshCw, RotateCcw, Save, ShieldCheck, XCircle } from "lucide-react";
import { listCustomers, listWebsites, updateWebsite, type Customer, type Website } from "./control-center-data";
import { createWebsitePreviewLink, listWebsitePreviewLinks, publicPreviewUrl, revokeWebsitePreviewLink, type WebsitePreviewLink } from "./preview-links-data";

function isActive(link: WebsitePreviewLink | undefined) {
  return Boolean(link && !link.revoked_at && new Date(link.expires_at).getTime() > Date.now());
}

function fmt(value: string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function WebsitePreviewsAdmin() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [links, setLinks] = useState<WebsitePreviewLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [nextWebsites, nextCustomers, nextLinks] = await Promise.all([
        listWebsites(),
        listCustomers(),
        listWebsitePreviewLinks(),
      ]);
      setWebsites(nextWebsites);
      setCustomers(nextCustomers);
      setLinks(nextLinks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Previewbeheer kon niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const latestByWebsite = useMemo(() => {
    const map = new Map<string, WebsitePreviewLink>();
    for (const link of links) if (!map.has(link.website_id)) map.set(link.website_id, link);
    return map;
  }, [links]);

  const customerName = (id: string) => customers.find((customer) => customer.id === id)?.company_name || "Onbekende klant";

  async function savePreviewUrl(event: FormEvent<HTMLFormElement>, website: Website) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const previewUrl = String(form.get("preview_url") || "").trim();
    if (previewUrl && !/^https:\/\//i.test(previewUrl)) {
      setError("De preview-URL moet met https:// beginnen.");
      return;
    }
    setBusy(`save:${website.id}`); setError(null); setMessage(null);
    try {
      await updateWebsite(website.id, { preview_url: previewUrl || null });
      setMessage(`Preview-URL voor ${website.name} opgeslagen.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview-URL opslaan mislukt.");
    } finally { setBusy(null); }
  }

  async function createLink(website: Website, validDays: number) {
    setBusy(`create:${website.id}`); setError(null); setMessage(null);
    try {
      await createWebsitePreviewLink(website.id, validDays);
      setMessage(`Nieuwe previewlink voor ${website.name} aangemaakt. Eerdere actieve links zijn ingetrokken.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Previewlink aanmaken mislukt.");
    } finally { setBusy(null); }
  }

  async function revoke(link: WebsitePreviewLink, websiteName: string) {
    setBusy(`revoke:${link.id}`); setError(null); setMessage(null);
    try {
      await revokeWebsitePreviewLink(link.id);
      setMessage(`Previewlink voor ${websiteName} ingetrokken.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Previewlink intrekken mislukt.");
    } finally { setBusy(null); }
  }

  async function copyLink(link: WebsitePreviewLink) {
    const url = publicPreviewUrl(link.public_token);
    await navigator.clipboard.writeText(url);
    setCopied(link.id);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return <div className="min-h-screen bg-slate-50 text-slate-950">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-7">
        <div><span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Vedantix Operations</span><strong className="block text-sm">Customer Preview</strong></div>
        <div className="flex gap-2"><a href="/admin" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"><ArrowLeft size={15}/> Control Center</a><button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Vernieuwen</button></div>
      </div>
    </header>

    <main className="mx-auto max-w-7xl p-4 md:p-7">
      <div className="mb-7"><span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Beveiligde klantlinks</span><h1 className="mt-1 text-3xl font-bold tracking-tight">Website previews</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">De klant krijgt een tijdelijke Vedantix-link. Het echte preview-adres blijft gekoppeld aan de website en kan later zonder een nieuwe publieke slug worden gewijzigd. Een nieuwe link trekt de vorige automatisch in.</p></div>

      {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      {websites.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Nog geen websites gekoppeld.</div> : <div className="space-y-5">{websites.map((website) => {
        const link = latestByWebsite.get(website.id);
        const active = isActive(link);
        return <section key={website.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Link2 size={18}/><h2 className="text-lg font-semibold">{website.name}</h2></div><p className="mt-1 text-sm text-slate-500">{customerName(website.customer_id)} · {website.status}</p></div>{active ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Link actief</span> : <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Geen actieve link</span>}</div>

          <form onSubmit={(event) => savePreviewUrl(event, website)} className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="text-sm font-medium text-slate-700">Preview-URL<input name="preview_url" type="url" defaultValue={website.preview_url || ""} placeholder="https://preview.example.com" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
            <div className="flex items-end"><button disabled={busy === `save:${website.id}`} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"><Save size={15}/> Opslaan</button></div>
          </form>

          <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
            {link ? <div className="grid gap-4 lg:grid-cols-[1fr_auto]"><div><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16}/>{active ? "Huidige klantlink" : link.revoked_at ? "Laatste link is ingetrokken" : "Laatste link is verlopen"}</div><p className="mt-2 break-all text-xs text-slate-500">{publicPreviewUrl(link.public_token)}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400"><span>Geldig tot {fmt(link.expires_at)}</span><span>{link.open_count}× geopend</span><span>Laatst geopend {fmt(link.last_opened_at)}</span></div></div><div className="flex flex-wrap items-center gap-2">{active ? <><button type="button" onClick={() => copyLink(link)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">{copied === link.id ? <Check size={15}/> : <Copy size={15}/>} {copied === link.id ? "Gekopieerd" : "Kopieer"}</button><a href={publicPreviewUrl(link.public_token)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"><ExternalLink size={15}/> Open</a><button type="button" disabled={busy === `revoke:${link.id}`} onClick={() => revoke(link, website.name)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700"><XCircle size={15}/> Intrekken</button></> : null}</div></div> : <p className="text-sm text-slate-500">Nog geen klantlink aangemaakt.</p>}

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4"><span className="mr-1 text-xs font-medium text-slate-500">Nieuwe link:</span>{[7,14,30].map((days) => <button key={days} type="button" disabled={!website.preview_url || busy === `create:${website.id}`} onClick={() => createLink(website, days)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"><RotateCcw size={13}/>{days} dagen</button>)}</div>
          </div>
        </section>;
      })}</div>}
    </main>
  </div>;
}
