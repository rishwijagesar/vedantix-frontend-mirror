import { contentUpdated } from "../lib/public-content";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { BillingType } from "./sales-billing-data";

const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

type CatalogProduct = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  billing_type: BillingType;
  price_ex_vat: number;
  price_incl_vat: number;
  vat_rate: number;
  active: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
};

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

function inclVat(exVat: number, vatRate: number) {
  if (!Number.isFinite(exVat) || !Number.isFinite(vatRate)) return 0;
  return Math.round((exVat * (1 + vatRate / 100) + Number.EPSILON) * 100) / 100;
}

async function listCatalog(): Promise<CatalogProduct[]> {
  const { data, error } = await supabase.from("product_catalog").select("*").order("sort_order").order("name");
  fail(error);
  return (data ?? []).map((row) => ({
    ...row,
    price_ex_vat: Number(row.price_ex_vat ?? 0),
    price_incl_vat: Number(row.price_incl_vat ?? 0),
    vat_rate: Number(row.vat_rate ?? 0),
  })) as CatalogProduct[];
}

function ErrorBox({ error }: { error: string | null }) {
  return error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null;
}

function NewProductForm({ onDone, onCancel }: { onDone: () => Promise<void>; onCancel: () => void }) {
  const [priceExVat, setPriceExVat] = useState(0);
  const [vatRate, setVatRate] = useState(21);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const priceInclVat = useMemo(() => inclVat(priceExVat, vatRate), [priceExVat, vatRate]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError(null);
    try {
      const { error: insertError } = await supabase.from("product_catalog").insert({
        code: String(form.get("code") || "").trim().toUpperCase(),
        name: String(form.get("name") || "").trim(),
        description: String(form.get("description") || "").trim() || null,
        category: String(form.get("category") || "OVERIG").trim() || "OVERIG",
        billing_type: String(form.get("billing_type") || "ONE_TIME"),
        price_ex_vat: priceExVat,
        vat_rate: vatRate,
        active: true,
        sort_order: Number(form.get("sort_order") || 0),
        metadata: { public_package: form.get("website_public") === "on" },
      });
      fail(insertError);
      contentUpdated();
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Product opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return <form onSubmit={submit} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
    <div className="md:col-span-3"><ErrorBox error={error}/></div>
    <label className="text-sm font-medium">Code<input name="code" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
    <label className="text-sm font-medium">Naam<input name="name" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
    <label className="text-sm font-medium">Categorie<select name="category" defaultValue="ADDON" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="WEBSITE">Websitepakket</option><option value="GROWTH">Groeidienst</option><option value="HOSTING">Hosting</option><option value="ADDON">Losse uitbreiding</option></select></label>
    <label className="text-sm font-medium">Prijs excl. btw<input name="price_ex_vat" type="number" min="0" step="0.01" value={priceExVat} onChange={(e) => setPriceExVat(Number(e.target.value))} required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
    <label className="text-sm font-medium">BTW %<input name="vat_rate" type="number" min="0" step="0.01" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5"><span className="block text-xs font-medium text-slate-500">Prijs incl. btw</span><strong className="mt-1 block text-lg">{money.format(priceInclVat)}</strong></div>
    <label className="text-sm font-medium">Facturatie<select name="billing_type" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="ONE_TIME">Eenmalig</option><option value="MONTHLY">Maandelijks</option><option value="YEARLY">Jaarlijks</option></select></label>
    <label className="text-sm font-medium">Volgorde<input name="sort_order" type="number" defaultValue="0" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
    <label className="md:col-span-3 text-sm font-medium"><input type="checkbox" name="website_public" className="mr-2"/>Toon dit product op de website</label>
    <label className="md:col-span-3 text-sm font-medium">Omschrijving<textarea name="description" rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
    <div className="md:col-span-3 flex gap-2"><button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={15}/>{saving ? "Opslaan…" : "Product opslaan"}</button><button type="button" onClick={onCancel} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Annuleren</button></div>
  </form>;
}

function CatalogRow({ product, onChanged, onDeleted, onError }: { product: CatalogProduct; onChanged: (product: CatalogProduct) => void; onDeleted: (id: string) => void; onError: (message: string) => void }) {
  const [name, setName] = useState(product.name);
  const [priceExVat, setPriceExVat] = useState(product.price_ex_vat);
  const [vatRate, setVatRate] = useState(product.vat_rate);
  const [billingType, setBillingType] = useState<BillingType>(product.billing_type);
  const [active, setActive] = useState(product.active);
  const [websitePublic, setWebsitePublic] = useState(product.metadata?.["public_package"] === true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(product.name);
    setPriceExVat(product.price_ex_vat);
    setVatRate(product.vat_rate);
    setBillingType(product.billing_type);
    setActive(product.active);
    setWebsitePublic(product.metadata?.["public_package"] === true);
  }, [product]);

  const calculatedInclVat = useMemo(() => inclVat(priceExVat, vatRate), [priceExVat, vatRate]);
  const dirty = name !== product.name || priceExVat !== product.price_ex_vat || vatRate !== product.vat_rate || billingType !== product.billing_type || active !== product.active || websitePublic !== (product.metadata?.["public_package"] === true);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const { data, error } = await supabase.from("product_catalog").update({
        name: name.trim(),
        price_ex_vat: priceExVat,
        vat_rate: vatRate,
        billing_type: billingType,
        active,
        metadata: { ...product.metadata, public_package: websitePublic },
      }).eq("id", product.id).select("*").single();
      fail(error);
      onChanged({
        ...data,
        price_ex_vat: Number(data.price_ex_vat ?? 0),
        price_incl_vat: Number(data.price_incl_vat ?? 0),
        vat_rate: Number(data.vat_rate ?? 0),
      } as CatalogProduct);
      contentUpdated();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Wijzigen mislukt.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`${product.name} verwijderen?`)) return;
    try {
      const { error } = await supabase.from("product_catalog").delete().eq("id", product.id);
      fail(error);
      onDeleted(product.id);
      contentUpdated();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Verwijderen mislukt.");
    }
  }

  return <div className={`grid gap-3 rounded-xl border p-4 md:grid-cols-[110px_1fr_150px_110px_150px_90px_auto] md:items-end ${dirty ? "border-amber-200 bg-amber-50/40" : "border-slate-100 bg-white"}`}>
    <div><span className="text-xs text-slate-400">Code</span><strong className="block text-sm">{product.code}</strong></div>
    <label className="text-sm font-medium">Naam<input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"/></label>
    <label className="text-sm font-medium">Excl. btw<input type="number" min="0" step="0.01" value={priceExVat} onChange={(e) => setPriceExVat(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"/><span className="mt-1 block text-[11px] text-slate-500">Incl. btw: <strong>{money.format(calculatedInclVat)}</strong></span></label>
    <label className="text-sm font-medium">BTW %<input type="number" min="0" step="0.01" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"/></label>
    <label className="text-sm font-medium">Type<select value={billingType} onChange={(e) => setBillingType(e.target.value as BillingType)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5"><option value="ONE_TIME">Eenmalig</option><option value="MONTHLY">Maand</option><option value="YEARLY">Jaar</option></select></label>
    <div className="space-y-2 pb-2 text-xs text-slate-600"><label className="block"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="mr-1"/>Actief</label><label className="block"><input type="checkbox" checked={websitePublic} onChange={(e) => setWebsitePublic(e.target.checked)} className="mr-1"/>Op website</label></div>
    <div className="flex min-w-36 flex-col gap-1.5"><button type="button" disabled={!dirty || saving} onClick={() => void save()} className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-3 py-2.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"><Save size={14}/>{saving ? "Opslaan…" : saved ? "Opgeslagen" : "Opslaan"}</button><button type="button" onClick={() => void remove()} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600"><Trash2 size={14}/>Verwijderen</button></div>
  </div>;
}

export default function CatalogModuleV3() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setProducts(await listCatalog());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Catalogus laden mislukt.");
    }
  }

  useEffect(() => { void load(); }, []);

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Productcatalogus</h2><p className="mt-1 text-sm text-slate-500">Wijzig de prijs excl. btw of het BTW-percentage. De prijs incl. btw wordt direct opnieuw berekend; pas met Opslaan wordt de wijziging definitief. Actieve producten met “Op website” verschijnen automatisch op de prijzenpagina, inclusief de actuele btw-bedragen.</p></div><button type="button" onClick={() => setShowNew((value) => !value)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Nieuw product</button></div>
      <ErrorBox error={error}/>
      {showNew ? <NewProductForm onCancel={() => setShowNew(false)} onDone={async () => { setShowNew(false); await load(); }}/> : null}
      <div className="space-y-3">{products.map((product) => <CatalogRow key={product.id} product={product} onChanged={(next) => setProducts((current) => current.map((item) => item.id === next.id ? next : item))} onDeleted={(id) => setProducts((current) => current.filter((item) => item.id !== id))} onError={setError}/>)}</div>
    </section>
  </div>;
}
