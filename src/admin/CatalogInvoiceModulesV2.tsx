import CustomerDocumentsPanel from "./CustomerDocumentsPanel";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Download, FileCheck2, FilePlus2, RefreshCw, Save, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Customer } from "./control-center-data";
import BillingPreviewModal from "./BillingPreviewModal";
import { renderBillingDocumentHtml } from "./billing-document";
import {
  BILLING_TYPE_LABELS,
  addInvoiceItem,
  createFullCreditNote,
  createInvoice,
  deleteInvoice,
  deleteInvoiceItem,
  finalizeInvoice,
  getCompanyProfile,
  getInvoice,
  listCreditNotes,
  listInvoiceItems,
  markInvoicePaid,
  updateInvoice,
  updateInvoiceItem,
  type BillingItem,
  type BillingType,
  type CompanyProfile,
  type CreditNote,
  type DiscountType,
  type Invoice,
} from "./sales-billing-data";

const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

type BillingCustomer = Customer & {
  address_line1?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  kvk_number?: string | null;
  vat_number?: string | null;
  iban?: string | null;
};

type CatalogProductEx = {
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
};

type InvoiceWithActive = Invoice & { is_active: boolean };

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

async function listCatalog(includeInactive = true): Promise<CatalogProductEx[]> {
  let query = supabase.from("product_catalog").select("*").order("sort_order").order("name");
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  fail(error);
  return (data ?? []).map((row) => ({
    ...row,
    price_ex_vat: Number(row.price_ex_vat ?? 0),
    price_incl_vat: Number(row.price_incl_vat ?? 0),
    vat_rate: Number(row.vat_rate ?? 0),
  })) as CatalogProductEx[];
}

async function listInvoicesWithActive(): Promise<InvoiceWithActive[]> {
  const { data, error } = await supabase.from("invoices").select("*").order("created_at", { ascending: false });
  fail(error);
  return (data ?? []).map((row) => ({ ...row, is_active: row.is_active !== false })) as InvoiceWithActive[];
}

async function getInvoiceWithActive(id: string): Promise<InvoiceWithActive> {
  const { data, error } = await supabase.from("invoices").select("*").eq("id", id).single();
  fail(error);
  return { ...data, is_active: data.is_active !== false } as InvoiceWithActive;
}

async function setInvoiceActive(id: string, isActive: boolean) {
  const { error } = await supabase.from("invoices").update({ is_active: isActive, updated_at: new Date().toISOString() }).eq("id", id);
  fail(error);
}

function Panel({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">{title}</h2>{subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}</div>{actions}</div>{children}</section>;
}

function ErrorBox({ error }: { error: string | null }) {
  return error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null;
}

function Status({ invoice }: { invoice: InvoiceWithActive }) {
  if (!invoice.is_active) return <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">INACTIEF</span>;
  const positive = ["PAID", "FINALIZED", "SENT"].includes(invoice.status);
  const danger = ["OVERDUE", "CREDITED"].includes(invoice.status);
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${positive ? "bg-emerald-50 text-emerald-700" : danger ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600"}`}>{invoice.status}</span>;
}

export function CatalogModuleV2() {
  const [products, setProducts] = useState<CatalogProductEx[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try { setProducts(await listCatalog(true)); setError(null); }
    catch (err) { setError(err instanceof Error ? err.message : "Catalogus laden mislukt."); }
  }
  useEffect(() => { void load(); }, []);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    const payload = {
      code: String(f.get("code") || "").trim().toUpperCase(),
      name: String(f.get("name") || "").trim(),
      description: String(f.get("description") || "").trim() || null,
      category: String(f.get("category") || "OVERIG").trim() || "OVERIG",
      billing_type: String(f.get("billing_type") || "ONE_TIME"),
      price_ex_vat: Number(f.get("price_ex_vat") || 0),
      vat_rate: Number(f.get("vat_rate") || 21),
      active: true,
      sort_order: products.length * 10,
    };
    try {
      const { error: insertError } = await supabase.from("product_catalog").insert(payload);
      fail(insertError);
      setShowNew(false);
      await load();
    } catch (err) { setError(err instanceof Error ? err.message : "Product opslaan mislukt."); }
  }

  return <div className="space-y-5">
    <Panel title="Productcatalogus" subtitle="Alle catalogusprijzen zijn excl. btw. BTW en incl.-btw bedrag worden automatisch berekend." actions={<button type="button" onClick={() => setShowNew((v) => !v)} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Nieuw product</button>}>
      <ErrorBox error={error}/>
      {showNew ? <form onSubmit={create} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3">
        <label className="text-sm font-medium">Code<input name="code" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
        <label className="text-sm font-medium">Naam<input name="name" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
        <label className="text-sm font-medium">Categorie<input name="category" defaultValue="OVERIG" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
        <label className="text-sm font-medium">Prijs excl. btw<input name="price_ex_vat" type="number" min="0" step="0.01" required className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
        <label className="text-sm font-medium">BTW %<input name="vat_rate" type="number" min="0" step="0.01" defaultValue="21" className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
        <label className="text-sm font-medium">Facturatie<select name="billing_type" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="ONE_TIME">Eenmalig</option><option value="MONTHLY">Maandelijks</option><option value="YEARLY">Jaarlijks</option></select></label>
        <label className="md:col-span-3 text-sm font-medium">Omschrijving<textarea name="description" rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
        <div className="md:col-span-3"><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Product opslaan</button></div>
      </form> : null}

      <div className="space-y-3">{products.map((product) => <form key={product.id} onSubmit={async (event) => {
        event.preventDefault();
        const f = new FormData(event.currentTarget);
        try {
          const { error: updateError } = await supabase.from("product_catalog").update({
            name: String(f.get("name") || "").trim(),
            price_ex_vat: Number(f.get("price_ex_vat") || 0),
            vat_rate: Number(f.get("vat_rate") || 0),
            billing_type: String(f.get("billing_type") || "ONE_TIME"),
            active: f.get("active") === "on",
          }).eq("id", product.id);
          fail(updateError);
          await load();
        } catch (err) { setError(err instanceof Error ? err.message : "Wijzigen mislukt."); }
      }} className="grid gap-3 rounded-xl border border-slate-100 p-4 md:grid-cols-[110px_1fr_150px_100px_150px_90px_auto] md:items-end">
        <div><span className="text-xs text-slate-400">Code</span><strong className="block text-sm">{product.code}</strong></div>
        <label className="text-sm font-medium">Naam<input name="name" defaultValue={product.name} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
        <label className="text-sm font-medium">Excl. btw<input name="price_ex_vat" type="number" step="0.01" defaultValue={product.price_ex_vat} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/><span className="mt-1 block text-[11px] text-slate-400">Incl.: {money.format(product.price_incl_vat)}</span></label>
        <label className="text-sm font-medium">BTW %<input name="vat_rate" type="number" step="0.01" defaultValue={product.vat_rate} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
        <label className="text-sm font-medium">Type<select name="billing_type" defaultValue={product.billing_type} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5"><option value="ONE_TIME">Eenmalig</option><option value="MONTHLY">Maand</option><option value="YEARLY">Jaar</option></select></label>
        <label className="pb-2 text-sm text-slate-600"><input type="checkbox" name="active" defaultChecked={product.active} className="mr-2"/>Actief</label>
        <div className="flex gap-2"><button title="Opslaan" className="rounded-lg border border-slate-200 p-2.5"><Save size={15}/></button><button type="button" title="Verwijderen" onClick={async () => { if (!confirm(`${product.name} verwijderen?`)) return; try { const { error: deleteError } = await supabase.from("product_catalog").delete().eq("id", product.id); fail(deleteError); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Verwijderen mislukt."); } }} className="rounded-lg border border-red-100 p-2.5 text-red-600"><Trash2 size={15}/></button></div>
      </form>)}</div>
    </Panel>
  </div>;
}

function InvoiceItemForm({ invoiceId, products, position, onDone }: { invoiceId: string; products: CatalogProductEx[]; position: number; onDone: () => Promise<void> }) {
  const [productId, setProductId] = useState("");
  const [description, setDescription] = useState("");
  const [billingType, setBillingType] = useState<BillingType>("ONE_TIME");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [vatRate, setVatRate] = useState(21);
  const [busy, setBusy] = useState(false);

  function choose(id: string) {
    setProductId(id);
    const product = products.find((p) => p.id === id);
    if (!product) { setDescription(""); setBillingType("ONE_TIME"); setUnitPrice(0); setVatRate(21); return; }
    setDescription(product.name);
    setBillingType(product.billing_type);
    setUnitPrice(product.price_ex_vat);
    setVatRate(product.vat_rate);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!description.trim()) return;
    setBusy(true);
    try {
      const product = products.find((p) => p.id === productId);
      await addInvoiceItem(invoiceId, {
        position,
        catalog_product_id: product?.id || null,
        code: product?.code || null,
        description: description.trim(),
        billing_type: billingType,
        quantity,
        unit_price_ex_vat: unitPrice,
        vat_rate: vatRate,
        discount_type: "NONE",
        discount_value: 0,
      });
      setProductId(""); setDescription(""); setBillingType("ONE_TIME"); setQuantity(1); setUnitPrice(0); setVatRate(21);
      await onDone();
    } finally { setBusy(false); }
  }

  return <Panel title="Kosten toevoegen" subtitle="De dropdown gebruikt altijd de actuele catalogusprijs excl. btw."><form onSubmit={submit} className="grid gap-3 lg:grid-cols-4 xl:grid-cols-7">
    <label className="lg:col-span-2 text-sm font-medium">Product / dienst<select value={productId} onChange={(e) => choose(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="">Handmatige regel</option>{products.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.name} — {money.format(p.price_ex_vat)} excl. btw · {BILLING_TYPE_LABELS[p.billing_type]}</option>)}</select></label>
    <label className="lg:col-span-2 text-sm font-medium">Omschrijving<input value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
    <label className="text-sm font-medium">Aantal<input type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
    <label className="text-sm font-medium">Prijs excl. btw<input type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
    <label className="text-sm font-medium">BTW %<input type="number" min="0" step="0.01" value={vatRate} onChange={(e) => setVatRate(Number(e.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
    <label className="text-sm font-medium">Betaaltype<select value={billingType} onChange={(e) => setBillingType(e.target.value as BillingType)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="ONE_TIME">Eenmalig</option><option value="MONTHLY">Maandelijks</option><option value="YEARLY">Jaarlijks</option></select></label>
    <div className="self-end"><button disabled={busy} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Toevoegen</button></div>
  </form></Panel>;
}

function InvoiceLines({ invoice, items, products, onDone, onError }: { invoice: InvoiceWithActive; items: BillingItem[]; products: CatalogProductEx[]; onDone: () => Promise<void>; onError: (message: string) => void }) {
  const draft = invoice.status === "DRAFT";
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  async function syncOne(item: BillingItem) {
    const product = item.catalog_product_id ? productMap.get(item.catalog_product_id) : null;
    if (!product) return;
    await updateInvoiceItem(item.id, {
      code: product.code,
      description: product.name,
      billing_type: product.billing_type,
      unit_price_ex_vat: product.price_ex_vat,
      vat_rate: product.vat_rate,
    });
  }

  async function syncAll() {
    try {
      await Promise.all(items.filter((item) => item.catalog_product_id && productMap.has(item.catalog_product_id)).map(syncOne));
      await onDone();
    } catch (err) { onError(err instanceof Error ? err.message : "Catalogusprijzen verversen mislukt."); }
  }

  return <section className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Factuurregels</h3><p className="text-sm text-slate-500">Bestaande regels blijven snapshots. Bij een concept kun je actuele catalogusprijzen bewust verversen.</p></div>{draft && items.some((item) => item.catalog_product_id) ? <button type="button" onClick={() => void syncAll()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><RefreshCw size={14}/>Alle catalogusprijzen verversen</button> : null}</div>
    {items.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 p-7 text-center text-sm text-slate-500">Nog geen factuurregels.</div> : null}
    {items.map((item) => {
      const product = item.catalog_product_id ? productMap.get(item.catalog_product_id) : null;
      const stale = Boolean(product && (Math.abs(Number(item.unit_price_ex_vat) - product.price_ex_vat) > 0.009 || Number(item.vat_rate) !== product.vat_rate || item.billing_type !== product.billing_type));
      return <form key={item.id} onSubmit={async (event) => {
        event.preventDefault();
        if (!draft) return;
        const f = new FormData(event.currentTarget);
        try {
          await updateInvoiceItem(item.id, {
            description: String(f.get("description") || ""),
            billing_type: String(f.get("billing_type") || "ONE_TIME") as BillingType,
            quantity: Number(f.get("quantity") || 0),
            unit_price_ex_vat: Number(f.get("unit_price_ex_vat") || 0),
            vat_rate: Number(f.get("vat_rate") || 0),
            discount_type: String(f.get("discount_type") || "NONE") as DiscountType,
            discount_value: Number(f.get("discount_value") || 0),
          });
          await onDone();
        } catch (err) { onError(err instanceof Error ? err.message : "Regel opslaan mislukt."); }
      }} className={`rounded-xl border p-4 ${stale ? "border-amber-300 bg-amber-50/40" : "border-slate-100"}`}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.8fr_130px_120px_120px_140px_140px_auto] xl:items-end">
          <label className="text-sm font-medium">Omschrijving<input name="description" defaultValue={item.description} disabled={!draft} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-50"/></label>
          <label className="text-sm font-medium">Aantal<input name="quantity" type="number" step="0.01" defaultValue={item.quantity} disabled={!draft} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-50"/></label>
          <label className="text-sm font-medium">Prijs excl.<input name="unit_price_ex_vat" type="number" step="0.01" defaultValue={item.unit_price_ex_vat} disabled={!draft} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-50"/></label>
          <label className="text-sm font-medium">BTW %<input name="vat_rate" type="number" step="0.01" defaultValue={item.vat_rate} disabled={!draft} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 disabled:bg-slate-50"/></label>
          <label className="text-sm font-medium">Type<select name="billing_type" defaultValue={item.billing_type} disabled={!draft} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 disabled:bg-slate-50"><option value="ONE_TIME">Eenmalig</option><option value="MONTHLY">Maand</option><option value="YEARLY">Jaar</option></select></label>
          <div><span className="text-xs text-slate-400">Regeltotaal incl.</span><strong className="mt-2 block text-sm">{money.format(Number(item.line_total_incl_vat || 0))}</strong></div>
          {draft ? <div className="flex gap-2"><button title="Opslaan" className="rounded-lg border border-slate-200 p-2.5"><Save size={15}/></button><button type="button" title="Verwijderen" onClick={async () => { try { await deleteInvoiceItem(item.id); await onDone(); } catch (err) { onError(err instanceof Error ? err.message : "Verwijderen mislukt."); } }} className="rounded-lg border border-red-100 p-2.5 text-red-600"><Trash2 size={15}/></button></div> : null}
        </div>
        <input type="hidden" name="discount_type" value={item.discount_type}/><input type="hidden" name="discount_value" value={item.discount_value}/>
        {product ? <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="text-slate-500">Catalogus: {product.name} · {money.format(product.price_ex_vat)} excl.</span>{stale && draft ? <button type="button" onClick={async () => { try { await syncOne(item); await onDone(); } catch (err) { onError(err instanceof Error ? err.message : "Prijs verversen mislukt."); } }} className="rounded-md bg-amber-100 px-2 py-1 font-semibold text-amber-800">Prijs uit catalogus verversen</button> : <span className="font-medium text-emerald-700">Actueel</span>}</div> : null}
      </form>;
    })}
  </section>;
}

export function InvoicesModuleV2({ customers }: { customers: BillingCustomer[] }) {
  const [invoices, setInvoices] = useState<InvoiceWithActive[]>([]);
  const [credits, setCredits] = useState<CreditNote[]>([]);
  const [products, setProducts] = useState<CatalogProductEx[]>([]);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [selected, setSelected] = useState<InvoiceWithActive | null>(null);
  const [items, setItems] = useState<BillingItem[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState("");

  async function load() {
    try {
      const [nextInvoices, nextCredits, nextProducts, nextProfile] = await Promise.all([listInvoicesWithActive(), listCreditNotes(), listCatalog(false), getCompanyProfile()]);
      setInvoices(nextInvoices); setCredits(nextCredits); setProducts(nextProducts); setProfile(nextProfile); setError(null);
    } catch (err) { setError(err instanceof Error ? err.message : "Facturen laden mislukt."); }
  }
  async function open(invoice: InvoiceWithActive) { setSelected(await getInvoiceWithActive(invoice.id)); setItems(await listInvoiceItems(invoice.id)); }
  async function refresh() {
    await load();
    if (selected) { setSelected(await getInvoiceWithActive(selected.id)); setItems(await listInvoiceItems(selected.id)); }
  }
  useEffect(() => { void load(); }, []);

  async function newInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const f = new FormData(event.currentTarget);
      const invoice = await createInvoice(String(f.get("customer_id")));
      await load();
      await open({ ...(invoice as InvoiceWithActive), is_active: true });
    } catch (err) { setError(err instanceof Error ? err.message : "Factuurconcept aanmaken mislukt."); }
  }

  if (selected) {
    const draft = selected.status === "DRAFT";
    const customer = customers.find((c) => c.id === selected.customer_id);
    const relatedCredits = credits.filter((credit) => credit.invoice_id === selected.id);
    return <div className="space-y-5">
      <button type="button" onClick={() => setSelected(null)} className="text-sm font-semibold text-slate-600">← Terug naar facturen</button>
      <Panel title={`${selected.invoice_number || "Conceptfactuur"} — ${customer?.company_name || "Klant"}`} subtitle={`Financiële status: ${selected.status}`} actions={<div className="flex flex-wrap gap-2"><Status invoice={selected}/><button type="button" onClick={() => setPreview(renderBillingDocumentHtml("INVOICE", selected, items, profile))} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><Download size={14}/>PDF-preview</button></div>}>
        <ErrorBox error={error}/>
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={async () => { try { await setInvoiceActive(selected.id, !selected.is_active); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : "Status wijzigen mislukt."); } }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">{selected.is_active ? "Inactief zetten" : "Heractiveren"}</button>
            {draft ? <button type="button" onClick={async () => { if (!confirm("Dit factuurconcept definitief verwijderen?")) return; try { await deleteInvoice(selected.id); setSelected(null); setItems([]); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Verwijderen mislukt. Alleen conceptfacturen kunnen worden verwijderd."); } }} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"><Trash2 size={14}/>Concept verwijderen</button> : null}
          </div>

          {draft ? <form onSubmit={async (event) => { event.preventDefault(); const f = new FormData(event.currentTarget); try { await updateInvoice(selected.id, { notes: String(f.get("notes") || "") || null, discount_type: String(f.get("discount_type") || "NONE") as DiscountType, discount_value: Number(f.get("discount_value") || 0) }); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : "Opslaan mislukt."); } }} className="grid gap-3 rounded-2xl border border-slate-200 p-4 md:grid-cols-4">
            <label className="text-sm font-medium">Korting<select name="discount_type" defaultValue={selected.discount_type} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="NONE">Geen</option><option value="PERCENTAGE">Percentage</option><option value="FIXED">Vast bedrag</option></select></label>
            <label className="text-sm font-medium">Kortingwaarde<input name="discount_value" type="number" step="0.01" defaultValue={selected.discount_value} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
            <label className="md:col-span-2 text-sm font-medium">Notities<textarea name="notes" defaultValue={selected.notes || ""} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label>
            <div className="md:col-span-4"><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Concept opslaan</button></div>
          </form> : null}

          {draft ? <InvoiceItemForm invoiceId={selected.id} products={products} position={items.length + 1} onDone={refresh}/> : null}
          <InvoiceLines invoice={selected} items={items} products={products} onDone={refresh} onError={setError}/>

          <div className="ml-auto w-full max-w-md space-y-2 rounded-xl bg-slate-50 p-4 text-sm"><div className="flex justify-between"><span>Subtotaal excl. btw</span><strong>{money.format(Number(selected.subtotal_ex_vat))}</strong></div><div className="flex justify-between"><span>Totaal excl. btw</span><strong>{money.format(Number(selected.total_ex_vat))}</strong></div><div className="flex justify-between"><span>BTW</span><strong>{money.format(Number(selected.vat_total))}</strong></div><div className="flex justify-between border-t border-slate-300 pt-2 text-base"><span>Totaal incl. btw</span><strong>{money.format(Number(selected.total_incl_vat))}</strong></div></div>

          <div className="flex flex-wrap gap-2">
            {draft ? <button type="button" disabled={!items.length} onClick={async () => { if (!confirm("Factuur finaliseren? Daarna zijn financiële regels niet meer aanpasbaar.")) return; try { const number = await finalizeInvoice(selected.id); await refresh(); alert(`Factuur ${number} is gefinaliseerd.`); } catch (err) { setError(err instanceof Error ? err.message : "Finaliseren mislukt."); } }} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><FileCheck2 size={15} className="mr-2 inline"/>Finaliseer factuur</button> : null}
            {["FINALIZED", "SENT", "PARTIALLY_PAID", "OVERDUE"].includes(selected.status) ? <><button type="button" onClick={async () => { try { await updateInvoice(selected.id, { status: "SENT", sent_at: new Date().toISOString() }); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : "Status wijzigen mislukt."); } }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Markeer verzonden</button><button type="button" onClick={async () => { try { await markInvoicePaid(selected); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : "Betaling registreren mislukt."); } }} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"><Check size={15} className="mr-2 inline"/>Markeer betaald</button><button type="button" onClick={async () => { const reason = prompt("Reden voor volledige creditnota?") || "Volledige creditering"; if (!confirm("Volledige creditnota maken?")) return; try { await createFullCreditNote(selected.id, reason); await refresh(); } catch (err) { setError(err instanceof Error ? err.message : "Crediteren mislukt."); } }} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700">Volledig crediteren</button></> : null}
          </div>

          {relatedCredits.length ? <div><h3 className="mb-2 font-semibold">Creditnota’s</h3>{relatedCredits.map((credit) => <button type="button" key={credit.id} onClick={() => setPreview(renderBillingDocumentHtml("CREDIT", credit, [], profile))} className="mr-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">{credit.credit_number} · {money.format(Number(credit.total_incl_vat))}</button>)}</div> : null}
        </div>
      </Panel>
      <CustomerDocumentsPanel key={selected.id} customerId={selected.customer_id} invoiceId={selected.id}/>
      <BillingPreviewModal open={Boolean(preview)} html={preview} title={selected.invoice_number || "Conceptfactuur"} onClose={() => setPreview("")}/>
    </div>;
  }

  const visibleInvoices = invoices.filter((invoice) => showInactive || invoice.is_active);
  return <div className="space-y-5">
    <Panel title="Nieuwe factuur" subtitle="Nieuwe regels gebruiken direct de actuele catalogusprijs excl. btw."><form onSubmit={newInvoice} className="flex flex-wrap items-end gap-3"><label className="min-w-72 flex-1 text-sm font-medium">Klant<select name="customer_id" required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="">Selecteer klant</option>{customers.filter((customer) => customer.status !== "ARCHIVED").map((customer) => <option key={customer.id} value={customer.id}>{customer.company_name}{customer.contact_name ? ` — ${customer.contact_name}` : ""}</option>)}</select></label><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><FilePlus2 size={15} className="mr-2 inline"/>Factuurconcept starten</button></form></Panel>
    <Panel title="Facturen" subtitle={`${visibleInvoices.length} zichtbaar · ${invoices.length} totaal`} actions={<label className="text-xs font-medium text-slate-600"><input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="mr-2"/>Toon inactieve facturen</label>}>
      <ErrorBox error={error}/>
      {visibleInvoices.length ? <div className="space-y-2">{visibleInvoices.map((invoice) => <button type="button" onClick={() => void open(invoice)} key={invoice.id} className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl border px-4 py-3 text-left hover:bg-slate-50 ${invoice.is_active ? "border-slate-100" : "border-slate-200 bg-slate-50 opacity-70"}`}><div><strong className="text-sm">{invoice.invoice_number || "Concept"}</strong><span className="block text-xs text-slate-400">{customers.find((customer) => customer.id === invoice.customer_id)?.company_name || "Klant"} · vervalt {invoice.due_date || "—"}</span></div><strong>{money.format(Number(invoice.total_incl_vat))}</strong><Status invoice={invoice}/></button>)}</div> : <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">Nog geen facturen.</div>}
    </Panel>
  </div>;
}
