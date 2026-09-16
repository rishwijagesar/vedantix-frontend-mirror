import { useEffect, useState, type FormEvent } from "react";
import { Plus, Save, Trash2, Upload, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { contentUpdated, safeWebsiteUrl, safeLogoUrl } from "@/lib/public-content";

type ClientCase = {
  id: string; name: string; website_url: string | null; logo_url: string | null;
  branch: string; status_label: string; summary: string; outcome: string;
  published: boolean; show_on_home: boolean; show_on_results: boolean; sort_order: number;
};
const empty: Omit<ClientCase, "id"> = {
  name: "", website_url: "", logo_url: "", branch: "", status_label: "Live",
  summary: "", outcome: "", published: false, show_on_home: true, show_on_results: true, sort_order: 30,
};
const input = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm";

function CaseEditor({ value, onSaved, onCancel }: { value: Partial<ClientCase>; onSaved: () => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({ ...empty, ...value });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  function set<K extends keyof typeof form>(key: K, next: (typeof form)[K]) { setForm(current => ({ ...current, [key]: next })); }

  async function upload(file: File | undefined) {
    if (!file) return;
    setError(null); setUploading(true);
    try {
      const types: Record<string,string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/avif": "avif" };
      const ext = types[file.type];
      if (!ext || file.size > 5 * 1024 * 1024) throw new Error("Kies een PNG, JPG, WebP of AVIF van maximaal 5 MB.");
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("client-cases").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("client-cases").getPublicUrl(path);
      set("logo_url", data.publicUrl);
    } catch (e) { setError(e instanceof Error ? e.message : "Logo uploaden mislukt."); }
    finally { setUploading(false); }
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(null);
    try {
      const website = form.website_url?.trim() || null;
      const logo = form.logo_url?.trim() || null;
      if (website && !safeWebsiteUrl(website)) throw new Error("Gebruik een geldig websiteadres dat begint met https://.");
      if (logo && !safeLogoUrl(logo)) throw new Error("Gebruik een geldig https://-adres voor het logo of upload een afbeelding.");
      if (!form.name.trim() || !form.summary.trim()) throw new Error("Vul de klantnaam en beschrijving in.");
      const payload = {
        name: form.name.trim(), website_url: website, logo_url: logo,
        branch: form.branch.trim(), status_label: form.status_label.trim() || "Live",
        summary: form.summary.trim(), outcome: form.outcome.trim(), published: form.published,
        show_on_home: form.show_on_home, show_on_results: form.show_on_results,
        sort_order: Number(form.sort_order), updated_at: new Date().toISOString(),
      };
      const request = value.id ? supabase.from("client_cases").update(payload).eq("id", value.id) : supabase.from("client_cases").insert(payload);
      const { error: saveError } = await request.select("id").single();
      if (saveError) throw saveError;
      contentUpdated(); await onSaved();
    } catch (e) { setError(e instanceof Error ? e.message : "Opslaan mislukt."); }
    finally { setSaving(false); }
  }

  return <form onSubmit={save} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div><h2 className="text-lg font-semibold">{value.id ? "Klantcase bewerken" : "Nieuwe klantcase"}</h2><p className="mt-1 text-sm text-slate-500">Voeg een klant, het geleverde werk en het resultaat toe. Publiceer zodra de case klaar is.</p></div>
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    <div className="grid gap-4 md:grid-cols-2">
      <label className="text-sm font-medium">Klantnaam<input className={input} required maxLength={160} value={form.name} onChange={e => set("name", e.target.value)}/></label>
      <label className="text-sm font-medium">Website<input className={input} type="url" placeholder="https://klant.nl" value={form.website_url || ""} onChange={e => set("website_url", e.target.value)}/></label>
      <label className="text-sm font-medium">Branche<input className={input} placeholder="Bijvoorbeeld sport, horeca of dienstverlening" value={form.branch} onChange={e => set("branch", e.target.value)}/></label>
      <label className="text-sm font-medium">Label<input className={input} maxLength={60} value={form.status_label} onChange={e => set("status_label", e.target.value)}/></label>
      <label className="text-sm font-medium md:col-span-2">Beschrijving van de opdracht<textarea className={input} rows={3} required maxLength={3000} value={form.summary} onChange={e => set("summary", e.target.value)}/></label>
      <label className="text-sm font-medium md:col-span-2">Resultaat voor de klant<textarea className={input} rows={3} maxLength={3000} value={form.outcome} onChange={e => set("outcome", e.target.value)}/></label>
      <label className="text-sm font-medium">Logo-adres<input className={input} placeholder="https://..." value={form.logo_url || ""} onChange={e => set("logo_url", e.target.value)}/></label>
      <label className="text-sm font-medium">Of upload een logo<span className="mt-1.5 flex items-center gap-2 text-xs text-slate-500"><Upload size={14}/>PNG, JPG, WebP of AVIF · maximaal 5 MB</span><input type="file" accept="image/png,image/jpeg,image/webp,image/avif" className="mt-2 block w-full text-sm" disabled={uploading || saving} onChange={e => void upload(e.target.files?.[0])}/>{uploading ? <span className="text-xs">Uploaden…</span> : null}</label>
      <label className="text-sm font-medium">Volgorde<input className={input} type="number" step="1" value={form.sort_order} onChange={e => set("sort_order", Number(e.target.value))}/><span className="mt-1 block text-xs text-slate-500">Lage getallen worden als eerste getoond.</span></label>
    </div>
    <div className="flex flex-wrap gap-5 rounded-xl bg-slate-50 p-4 text-sm"><label><input type="checkbox" checked={form.published} onChange={e => set("published", e.target.checked)} className="mr-2"/>Publiceren op de website</label><label><input type="checkbox" checked={form.show_on_home} onChange={e => set("show_on_home", e.target.checked)} className="mr-2"/>Op de homepage</label><label><input type="checkbox" checked={form.show_on_results} onChange={e => set("show_on_results", e.target.checked)} className="mr-2"/>Op Resultaten</label></div>
    <aside className="rounded-xl border border-blue-100 bg-blue-50/40 p-4"><span className="text-xs font-semibold uppercase text-slate-400">Voorbeeld</span><div className="mt-3 flex items-center gap-3">{safeLogoUrl(form.logo_url) ? <img src={safeLogoUrl(form.logo_url)!} alt="" className="h-16 w-16 rounded-xl bg-white object-contain p-2"/> : null}<div><strong>{form.name || "Klantnaam"}</strong><p className="text-xs text-slate-500">{form.branch} · {form.status_label}</p></div></div><p className="mt-3 whitespace-pre-line text-sm text-slate-600">{form.summary || "De beschrijving verschijnt hier."}</p>{form.outcome ? <p className="mt-3 whitespace-pre-line text-sm font-semibold">{form.outcome}</p> : null}</aside>
    <div className="flex gap-3"><button disabled={saving || uploading} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16}/>{saving ? "Opslaan…" : form.published ? "Opslaan en publiceren" : "Opslaan als concept"}</button><button type="button" disabled={saving} onClick={onCancel} className="rounded-xl border px-4 py-2.5 text-sm">Annuleren</button></div>
  </form>;
}

export default function ClientCasesModule() {
  const [cases, setCases] = useState<ClientCase[]>([]);
  const [editing, setEditing] = useState<Partial<ClientCase> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  async function load() {
    const { data, error: loadError } = await supabase.from("client_cases").select("*").order("sort_order").order("created_at");
    if (loadError) throw loadError;
    setCases(data || []); setLoading(false);
  }
  useEffect(() => { void load().catch(e => { setError(e.message); setLoading(false); }); }, []);
  async function remove(item: ClientCase) {
    if (!window.confirm(`Klantcase "${item.name}" verwijderen? Deze verdwijnt ook van de website.`)) return;
    setError(null);
    const { error: deleteError } = await supabase.from("client_cases").delete().eq("id", item.id);
    if (deleteError) { setError(deleteError.message); return; }
    contentUpdated(); await load(); setNotice("Klantcase verwijderd.");
  }
  return <div className="space-y-5">
    <div className="flex flex-wrap justify-between gap-3"><p className="max-w-2xl text-sm text-slate-500">Beheer de klantcases op de homepage en de pagina Resultaten. Na opslaan verschijnen gepubliceerde wijzigingen automatisch.</p><button type="button" onClick={() => { setEditing({}); setNotice(null); }} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16}/>Nieuwe klantcase</button></div>
    {notice ? <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
    {error ? <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
    {editing ? <CaseEditor key={editing.id || "new"} value={editing} onCancel={() => setEditing(null)} onSaved={async () => { await load(); setEditing(null); setNotice("Klantcase opgeslagen. Gepubliceerde cases zijn zichtbaar op de website."); }}/> : null}
    {loading ? <p className="text-sm text-slate-500">Klantcases laden…</p> : null}
    {!loading && !cases.length ? <p className="rounded-2xl border border-dashed p-8 text-center text-slate-500">Nog geen klantcases. Voeg je eerste klant toe.</p> : null}
    <div className="grid gap-4 lg:grid-cols-2">{cases.map(item => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3">{safeLogoUrl(item.logo_url) ? <img src={safeLogoUrl(item.logo_url)!} alt="" className="h-14 w-14 rounded-xl bg-slate-50 object-contain p-2"/> : null}<div className="min-w-0 flex-1"><h3 className="font-semibold">{item.name}</h3><p className="text-xs text-slate-500">{item.branch}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${item.published ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{item.published ? "Gepubliceerd" : "Concept"}</span></div><p className="mt-4 line-clamp-3 text-sm text-slate-600">{item.summary}</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => { setEditing(item); setNotice(null); }} className="rounded-lg border px-3 py-2 text-sm">Bewerken</button>{safeWebsiteUrl(item.website_url) ? <a href={safeWebsiteUrl(item.website_url)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"><ExternalLink size={14}/>Website</a> : null}<button type="button" onClick={() => void remove(item)} className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-100 px-3 py-2 text-sm text-red-600"><Trash2 size={14}/>Verwijderen</button></div></article>)}</div>
  </div>;
}
