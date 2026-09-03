import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BadgeEuro,
  Building2,
  Check,
  CircleDollarSign,
  CreditCard,
  Download,
  FileCheck2,
  FilePlus2,
  FileText,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import VedantixLogo from "@/components/VedantixLogo";
import type { Customer } from "./control-center-data";
import BillingPreviewModal from "./BillingPreviewModal";
import { renderBillingDocumentHtml } from "./billing-document";
import {
  addInvoiceItem,
  addQuoteItem,
  createCatalogProduct,
  createFullCreditNote,
  createInvoice,
  createQuote,
  deleteCatalogProduct,
  deleteInvoice,
  deleteInvoiceItem,
  deleteQuote,
  deleteQuoteItem,
  finalizeInvoice,
  getBillingDashboard,
  getCompanyProfile,
  getInvoice,
  getQuote,
  listCatalogProducts,
  listCreditNotes,
  listInvoiceItems,
  listInvoices,
  listQuoteItems,
  listQuotes,
  markInvoicePaid,
  priceExVatFromIncl,
  quoteToInvoice,
  setQuoteStatus,
  updateCatalogProduct,
  updateCompanyProfile,
  updateInvoice,
  updateInvoiceItem,
  updateQuote,
  updateQuoteItem,
  type BillingItem,
  type CatalogProduct,
  type CompanyProfile,
  type CreditNote,
  type DiscountType,
  type Invoice,
  type Quote,
} from "./sales-billing-data";

const money = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });

type BillingCustomer = Customer & {
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  kvk_number?: string | null;
  vat_number?: string | null;
};

function Card({ title, subtitle, children, actions }: { title: string; subtitle?: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-slate-950">{title}</h2>{subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}</div>{actions}</div>{children}</section>;
}

function Field({ label, name, type = "text", defaultValue, value, onChange, placeholder, required, step }: { label: string; name: string; type?: string; defaultValue?: string | number | null; value?: string | number; onChange?: React.ChangeEventHandler<HTMLInputElement>; placeholder?: string; required?: boolean; step?: string }) {
  return <label className="text-sm font-medium text-slate-700">{label}<input name={name} type={type} defaultValue={defaultValue ?? undefined} value={value} onChange={onChange} placeholder={placeholder} required={required} step={step} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></label>;
}

function Status({ value }: { value: string }) {
  const positive = ["ACCEPTED", "PAID", "FINALIZED", "SENT"].includes(value);
  const danger = ["REJECTED", "OVERDUE", "CREDITED"].includes(value);
  const className = positive ? "bg-emerald-50 text-emerald-700" : danger ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{value}</span>;
}

function ErrorBox({ message }: { message: string | null }) {
  return message ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div> : null;
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-200 px-5 py-9 text-center text-sm text-slate-500">{children}</div>;
}

function DiscountFields({ prefix = "", type, value }: { prefix?: string; type: DiscountType; value: number }) {
  return <><label className="text-sm font-medium text-slate-700">Korting<select name={`${prefix}discount_type`} defaultValue={type} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="NONE">Geen</option><option value="PERCENTAGE">Percentage</option><option value="FIXED">Vast bedrag</option></select></label><Field label="Korting waarde" name={`${prefix}discount_value`} type="number" step="0.01" defaultValue={value} /></>;
}

function customerLabel(customer: BillingCustomer) {
  return customer.company_name + (customer.contact_name ? ` — ${customer.contact_name}` : "");
}

export function BillingDashboardCards() {
  const [data, setData] = useState<{ openQuotes: number; outstanding: number; overdue: number; monthRevenue: number } | null>(null);
  useEffect(() => { getBillingDashboard().then(setData).catch(() => setData(null)); }, []);
  const cards = [
    ["Open offertes", data?.openQuotes ?? "—", FileText, "Concept en verzonden"],
    ["Openstaand", data ? money.format(data.outstanding) : "—", CircleDollarSign, "Nog te ontvangen"],
    ["Achterstallig", data ? money.format(data.overdue) : "—", CreditCard, "Vervaldatum verstreken"],
    ["Gefactureerd deze maand", data ? money.format(data.monthRevenue) : "—", ReceiptText, "Gefinaliseerde facturen"],
  ] as const;
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{cards.map(([label, value, Icon, caption]) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"><Icon size={18} /></div><p className="text-sm text-slate-500">{label}</p><strong className="mt-1 block text-2xl font-bold">{value}</strong><span className="mt-1 block text-xs text-slate-400">{caption}</span></article>)}</section>;
}

export function CompanyProfileModule() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => { getCompanyProfile().then(setProfile).catch((e) => setError(e.message)); }, []);
  if (!profile) return <Card title="Bedrijfsprofiel"><Empty>{error || "Laden…"}</Empty></Card>;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setSaved(false);
    const f = new FormData(event.currentTarget);
    try {
      const next = await updateCompanyProfile({
        trade_name: String(f.get("trade_name") || "Vedantix"), legal_name: String(f.get("legal_name") || "") || null,
        address_line1: String(f.get("address_line1") || "") || null, address_line2: String(f.get("address_line2") || "") || null,
        postal_code: String(f.get("postal_code") || "") || null, city: String(f.get("city") || "") || null, country: String(f.get("country") || "Nederland"),
        kvk_number: String(f.get("kvk_number") || "") || null, vat_number: String(f.get("vat_number") || "") || null, iban: String(f.get("iban") || "") || null,
        bic: String(f.get("bic") || "") || null, email: String(f.get("email") || "info@vedantix.nl"), phone: String(f.get("phone") || "") || null,
        website: String(f.get("website") || "https://vedantix.nl"), terms_url: String(f.get("terms_url") || "") || null,
        default_payment_term_days: Number(f.get("default_payment_term_days") || 14), default_quote_valid_days: Number(f.get("default_quote_valid_days") || 30),
        default_vat_rate: Number(f.get("default_vat_rate") || 21), quote_prefix: String(f.get("quote_prefix") || "OFF"), invoice_prefix: String(f.get("invoice_prefix") || "FAC"), credit_prefix: String(f.get("credit_prefix") || "CR"),
      });
      setProfile(next); setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Opslaan mislukt"); }
  }

  return <div className="space-y-5"><Card title="Bedrijfsprofiel" subtitle="Deze gegevens worden als snapshot in nieuwe offertes en facturen opgenomen." actions={<div className="rounded-xl border border-slate-200 bg-white p-3"><VedantixLogo size="md" /></div>}><ErrorBox message={error} />{saved ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">Bedrijfsprofiel opgeslagen.</div> : null}<form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"><Field label="Handelsnaam" name="trade_name" defaultValue={profile.trade_name} required /><Field label="Juridische naam" name="legal_name" defaultValue={profile.legal_name} /><Field label="E-mail" name="email" type="email" defaultValue={profile.email} required /><Field label="Adres" name="address_line1" defaultValue={profile.address_line1} /><Field label="Adresregel 2" name="address_line2" defaultValue={profile.address_line2} /><div className="grid grid-cols-2 gap-3"><Field label="Postcode" name="postal_code" defaultValue={profile.postal_code} /><Field label="Plaats" name="city" defaultValue={profile.city} /></div><Field label="Land" name="country" defaultValue={profile.country} /><Field label="Telefoon" name="phone" defaultValue={profile.phone} /><Field label="Website" name="website" defaultValue={profile.website} /><Field label="KVK-nummer" name="kvk_number" defaultValue={profile.kvk_number} /><Field label="BTW-ID" name="vat_number" defaultValue={profile.vat_number} /><Field label="IBAN" name="iban" defaultValue={profile.iban} /><Field label="BIC" name="bic" defaultValue={profile.bic} /><Field label="Algemene voorwaarden URL" name="terms_url" defaultValue={profile.terms_url} /><Field label="Betaaltermijn (dagen)" name="default_payment_term_days" type="number" defaultValue={profile.default_payment_term_days} /><Field label="Offerte geldig (dagen)" name="default_quote_valid_days" type="number" defaultValue={profile.default_quote_valid_days} /><Field label="Standaard BTW %" name="default_vat_rate" type="number" step="0.01" defaultValue={profile.default_vat_rate} /><Field label="Offerteprefix" name="quote_prefix" defaultValue={profile.quote_prefix} /><Field label="Factuurprefix" name="invoice_prefix" defaultValue={profile.invoice_prefix} /><Field label="Creditprefix" name="credit_prefix" defaultValue={profile.credit_prefix} /><div className="md:col-span-2 xl:col-span-3"><button className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"><Save size={16} /> Profiel opslaan</button></div></form></Card></div>;
}

export function CatalogModule() {
  const [products, setProducts] = useState<CatalogProduct[]>([]); const [error, setError] = useState<string | null>(null); const [showNew, setShowNew] = useState(false);
  async function load() { try { setProducts(await listCatalogProducts(true)); } catch (e) { setError(e instanceof Error ? e.message : "Laden mislukt"); } }
  useEffect(() => { load(); }, []);
  async function create(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const f=new FormData(event.currentTarget); try { await createCatalogProduct({ code:String(f.get("code")||"").trim().toUpperCase(), name:String(f.get("name")||""), description:String(f.get("description")||"")||null, category:String(f.get("category")||"OVERIG"), billing_type:String(f.get("billing_type")||"ONE_TIME") as CatalogProduct["billing_type"], price_incl_vat:Number(f.get("price_incl_vat")||0), vat_rate:Number(f.get("vat_rate")||21), active:true, sort_order:products.length*10 }); setShowNew(false); await load(); } catch(e){ setError(e instanceof Error?e.message:"Opslaan mislukt"); } }
  return <div className="space-y-5"><Card title="Productcatalogus" subtitle="Pakketten en losse diensten voor offertes en facturen." actions={<button type="button" onClick={()=>setShowNew(!showNew)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={16}/> Nieuw product</button>}><ErrorBox message={error}/>{showNew ? <form onSubmit={create} className="mb-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-3"><Field label="Code" name="code" required/><Field label="Naam" name="name" required/><Field label="Categorie" name="category" defaultValue="OVERIG"/><Field label="Prijs incl. btw" name="price_incl_vat" type="number" step="0.01" required/><Field label="BTW %" name="vat_rate" type="number" step="0.01" defaultValue={21}/><label className="text-sm font-medium text-slate-700">Facturatie<select name="billing_type" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="ONE_TIME">Eenmalig</option><option value="MONTHLY">Maandelijks</option><option value="YEARLY">Jaarlijks</option></select></label><label className="md:col-span-3 text-sm font-medium text-slate-700">Omschrijving<textarea name="description" rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"/></label><div className="md:col-span-3"><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Product opslaan</button></div></form> : null}
    <div className="space-y-3">{products.map(product=><form key={product.id} onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await updateCatalogProduct(product.id,{name:String(f.get("name")),price_incl_vat:Number(f.get("price")),vat_rate:Number(f.get("vat")),billing_type:String(f.get("billing")) as CatalogProduct["billing_type"],active:f.get("active")==="on"});await load();}catch(err){setError(err instanceof Error?err.message:"Wijzigen mislukt")}}} className="grid gap-3 rounded-xl border border-slate-100 p-4 md:grid-cols-[110px_1fr_140px_100px_140px_90px_auto] md:items-end"><div><span className="text-xs text-slate-400">Code</span><strong className="block text-sm">{product.code}</strong></div><Field label="Naam" name="name" defaultValue={product.name}/><Field label="Incl. btw" name="price" type="number" step="0.01" defaultValue={product.price_incl_vat}/><Field label="BTW %" name="vat" type="number" step="0.01" defaultValue={product.vat_rate}/><label className="text-sm font-medium text-slate-700">Type<select name="billing" defaultValue={product.billing_type} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5"><option value="ONE_TIME">Eenmalig</option><option value="MONTHLY">Maand</option><option value="YEARLY">Jaar</option></select></label><label className="pb-2 text-sm text-slate-600"><input type="checkbox" name="active" defaultChecked={product.active} className="mr-2"/>Actief</label><div className="flex gap-2"><button title="Opslaan" className="rounded-lg border border-slate-200 p-2.5"><Save size={15}/></button><button type="button" title="Verwijderen" onClick={async()=>{if(confirm(`${product.name} verwijderen?`)){try{await deleteCatalogProduct(product.id);await load();}catch(err){setError(err instanceof Error?err.message:"Verwijderen mislukt")}}}} className="rounded-lg border border-red-100 p-2.5 text-red-600"><Trash2 size={15}/></button></div><div className="md:col-start-3 md:col-span-2 text-xs text-slate-400">Excl. btw: {money.format(priceExVatFromIncl(Number(product.price_incl_vat),Number(product.vat_rate)))}</div></form>)}</div></Card></div>;
}

function ItemForm({ kind, parentId, products, nextPosition, onDone }: { kind:"QUOTE"|"INVOICE"; parentId:string; products:CatalogProduct[]; nextPosition:number; onDone:()=>Promise<void> }) {
  const [productId,setProductId]=useState("");
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const product=products.find(p=>p.id===productId);const description=String(f.get("description")||product?.name||"");const vat=Number(f.get("vat_rate")||product?.vat_rate||21);const price=product ? priceExVatFromIncl(Number(product.price_incl_vat),vat) : Number(f.get("unit_price_ex_vat")||0);const payload={position:nextPosition,catalog_product_id:product?.id||null,code:product?.code||null,description,quantity:Number(f.get("quantity")||1),unit_price_ex_vat:price,vat_rate:vat,discount_type:String(f.get("discount_type")||"NONE") as DiscountType,discount_value:Number(f.get("discount_value")||0)};if(kind==="QUOTE")await addQuoteItem(parentId,payload);else await addInvoiceItem(parentId,payload);e.currentTarget.reset();setProductId("");await onDone();}
  const p=products.find(x=>x.id===productId);
  return <form onSubmit={submit} className="grid gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 md:grid-cols-6"><label className="md:col-span-2 text-sm font-medium text-slate-700">Catalogusproduct<select value={productId} onChange={e=>setProductId(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="">Handmatige regel</option>{products.filter(x=>x.active).map(x=><option key={x.id} value={x.id}>{x.name} — {money.format(Number(x.price_incl_vat))}</option>)}</select></label><label className="md:col-span-2 text-sm font-medium text-slate-700">Omschrijving<input name="description" placeholder={p?.name||"Dienst of product"} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"/></label><Field label="Aantal" name="quantity" type="number" step="0.01" defaultValue={1}/><Field label="Prijs excl. btw" name="unit_price_ex_vat" type="number" step="0.01" defaultValue={p?priceExVatFromIncl(Number(p.price_incl_vat),Number(p.vat_rate)):0}/><Field label="BTW %" name="vat_rate" type="number" step="0.01" defaultValue={p?.vat_rate||21}/><label className="text-sm font-medium text-slate-700">Korting<select name="discount_type" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="NONE">Geen</option><option value="PERCENTAGE">%</option><option value="FIXED">€</option></select></label><Field label="Korting waarde" name="discount_value" type="number" step="0.01" defaultValue={0}/><div className="flex items-end"><button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={15} className="mr-1 inline"/>Regel toevoegen</button></div></form>;
}

function ItemsEditor({ kind, items, draft, onRefresh }: { kind:"QUOTE"|"INVOICE"; items:BillingItem[]; draft:boolean; onRefresh:()=>Promise<void> }) {
  if(!items.length)return <Empty>Nog geen regels toegevoegd.</Empty>;
  return <div className="space-y-2">{items.map(item=><form key={item.id} onSubmit={async e=>{e.preventDefault();if(!draft)return;const f=new FormData(e.currentTarget);const changes={description:String(f.get("description")),quantity:Number(f.get("quantity")),unit_price_ex_vat:Number(f.get("unit_price")),vat_rate:Number(f.get("vat")),discount_type:String(f.get("discount_type")) as DiscountType,discount_value:Number(f.get("discount_value"))};if(kind==="QUOTE")await updateQuoteItem(item.id,changes);else await updateInvoiceItem(item.id,changes);await onRefresh();}} className="grid gap-2 rounded-xl border border-slate-100 p-3 md:grid-cols-[2fr_75px_120px_80px_110px_90px_120px_auto] md:items-end"><Field label="Omschrijving" name="description" defaultValue={item.description}/><Field label="Aantal" name="quantity" type="number" step="0.01" defaultValue={item.quantity}/><Field label="Prijs excl." name="unit_price" type="number" step="0.01" defaultValue={item.unit_price_ex_vat}/><Field label="BTW %" name="vat" type="number" step="0.01" defaultValue={item.vat_rate}/><label className="text-sm font-medium text-slate-700">Korting<select name="discount_type" defaultValue={item.discount_type} disabled={!draft} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-2 py-2.5"><option value="NONE">Geen</option><option value="PERCENTAGE">%</option><option value="FIXED">€</option></select></label><Field label="Waarde" name="discount_value" type="number" step="0.01" defaultValue={item.discount_value}/><div className="pb-2 text-right text-sm"><span className="block text-xs text-slate-400">Regeltotaal excl.</span><strong>{money.format(Number(item.line_total_ex_vat))}</strong></div>{draft?<div className="flex gap-1"><button title="Regel opslaan" className="rounded-lg border border-slate-200 p-2.5"><Save size={14}/></button><button type="button" onClick={async()=>{if(kind==="QUOTE")await deleteQuoteItem(item.id);else await deleteInvoiceItem(item.id);await onRefresh();}} className="rounded-lg border border-red-100 p-2.5 text-red-600"><Trash2 size={14}/></button></div>:<div className="pb-2 text-xs text-slate-400">Vergrendeld</div>}</form>)}</div>;
}

function Totals({ subtotal, lineDiscount, docDiscount, totalEx, vat, totalIncl }: { subtotal:number; lineDiscount:number; docDiscount:number; totalEx:number; vat:number; totalIncl:number }) {
  return <div className="ml-auto mt-5 w-full max-w-md space-y-2 rounded-xl bg-slate-50 p-4 text-sm"><div className="flex justify-between"><span>Subtotaal excl. btw</span><strong>{money.format(subtotal)}</strong></div>{lineDiscount>0?<div className="flex justify-between text-emerald-700"><span>Regelkortingen</span><strong>− {money.format(lineDiscount)}</strong></div>:null}{docDiscount>0?<div className="flex justify-between text-emerald-700"><span>Algemene korting</span><strong>− {money.format(docDiscount)}</strong></div>:null}<div className="flex justify-between"><span>Totaal excl. btw</span><strong>{money.format(totalEx)}</strong></div><div className="flex justify-between"><span>BTW</span><strong>{money.format(vat)}</strong></div><div className="flex justify-between border-t border-slate-300 pt-2 text-base"><span>Totaal incl. btw</span><strong>{money.format(totalIncl)}</strong></div></div>;
}

export function QuotesModule({ customers }: { customers: BillingCustomer[] }) {
  const [quotes,setQuotes]=useState<Quote[]>([]);const [products,setProducts]=useState<CatalogProduct[]>([]);const [profile,setProfile]=useState<CompanyProfile|null>(null);const [selected,setSelected]=useState<Quote|null>(null);const [items,setItems]=useState<BillingItem[]>([]);const [error,setError]=useState<string|null>(null);const [preview,setPreview]=useState("");
  async function load(){try{const [q,p,cp]=await Promise.all([listQuotes(),listCatalogProducts(false),getCompanyProfile()]);setQuotes(q);setProducts(p);setProfile(cp);}catch(e){setError(e instanceof Error?e.message:"Laden mislukt")}}
  async function open(q:Quote){setSelected(await getQuote(q.id));setItems(await listQuoteItems(q.id));}
  async function refresh(){if(selected){const q=await getQuote(selected.id);setSelected(q);setItems(await listQuoteItems(q.id));}await load();}
  useEffect(()=>{load()},[]);
  async function newQuote(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);try{const q=await createQuote(String(f.get("customer_id")));await load();await open(q);}catch(err){setError(err instanceof Error?err.message:"Aanmaken mislukt")}}
  if(selected){const c=customers.find(x=>x.id===selected.customer_id);return <div className="space-y-5"><button type="button" onClick={()=>setSelected(null)} className="text-sm font-semibold text-slate-600">← Terug naar offertes</button><Card title={`${selected.quote_number} — ${c?.company_name||"Klant"}`} subtitle={`Status ${selected.status}`} actions={<div className="flex flex-wrap gap-2"><Status value={selected.status}/><button type="button" onClick={()=>setPreview(renderBillingDocumentHtml("QUOTE",selected,items,profile))} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><Download size={14}/> PDF-preview</button></div>}><ErrorBox message={error}/><form onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await updateQuote(selected.id,{valid_until:String(f.get("valid_until"))||null,intro_text:String(f.get("intro_text"))||null,notes:String(f.get("notes"))||null,terms:String(f.get("terms"))||null,discount_type:String(f.get("discount_type")) as DiscountType,discount_value:Number(f.get("discount_value")||0)});await refresh();}catch(err){setError(err instanceof Error?err.message:"Opslaan mislukt")}}} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Field label="Offertedatum" name="quote_date" type="date" defaultValue={selected.quote_date}/><Field label="Geldig tot" name="valid_until" type="date" defaultValue={selected.valid_until}/><DiscountFields type={selected.discount_type} value={selected.discount_value}/><label className="md:col-span-2 text-sm font-medium text-slate-700">Intro<textarea name="intro_text" defaultValue={selected.intro_text||""} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label><label className="md:col-span-2 text-sm font-medium text-slate-700">Notities / voorwaarden<textarea name="notes" defaultValue={selected.notes||""} rows={3} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label><div className="md:col-span-2 xl:col-span-4"><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><Save size={15} className="mr-2 inline"/>Offerte opslaan</button></div></form><div className="mt-6"><h3 className="mb-3 font-semibold">Regels</h3><ItemsEditor kind="QUOTE" items={items} draft={selected.status==="DRAFT"} onRefresh={refresh}/>{selected.status==="DRAFT"?<div className="mt-3"><ItemForm kind="QUOTE" parentId={selected.id} products={products} nextPosition={items.length+1} onDone={refresh}/></div>:null}<Totals subtotal={Number(selected.subtotal_ex_vat)} lineDiscount={Number(selected.line_discount_ex_vat)} docDiscount={Number(selected.document_discount_ex_vat)} totalEx={Number(selected.total_ex_vat)} vat={Number(selected.vat_total)} totalIncl={Number(selected.total_incl_vat)}/></div><div className="mt-6 flex flex-wrap gap-2">{selected.status==="DRAFT"?<button type="button" onClick={async()=>{await setQuoteStatus(selected.id,"SENT");await refresh();}} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Markeer verzonden</button>:null}{selected.status==="SENT"?<><button type="button" onClick={async()=>{await setQuoteStatus(selected.id,"ACCEPTED");await refresh();}} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white">Geaccepteerd</button><button type="button" onClick={async()=>{await setQuoteStatus(selected.id,"REJECTED");await refresh();}} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700">Afgewezen</button></>:null}{selected.status==="ACCEPTED"?<button type="button" onClick={async()=>{const id=await quoteToInvoice(selected.id);alert(`Factuurconcept aangemaakt (${id}). Open Facturen om verder te gaan.`);}} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"><FileCheck2 size={15} className="mr-2 inline"/>Maak factuur</button>:null}</div></Card><BillingPreviewModal open={Boolean(preview)} html={preview} title={selected.quote_number} onClose={()=>setPreview("")}/></div>}
  return <div className="space-y-5"><Card title="Nieuwe offerte" subtitle="Selecteer een bestaande klant; bedrijfs- en klantgegevens worden direct als snapshot vastgelegd."><form onSubmit={newQuote} className="flex flex-wrap items-end gap-3"><label className="min-w-72 flex-1 text-sm font-medium text-slate-700">Klant<select name="customer_id" required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="">Selecteer klant</option>{customers.filter(c=>c.status!=="ARCHIVED").map(c=><option key={c.id} value={c.id}>{customerLabel(c)}</option>)}</select></label><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><FilePlus2 size={15} className="mr-2 inline"/>Offerte starten</button></form></Card><Card title="Offertes" subtitle={`${quotes.length} offerte(s)`}><ErrorBox message={error}/>{quotes.length? <div className="space-y-2">{quotes.map(q=><button type="button" onClick={()=>open(q)} key={q.id} className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl border border-slate-100 px-4 py-3 text-left hover:bg-slate-50"><div><strong className="text-sm">{q.quote_number}</strong><span className="block text-xs text-slate-400">{customers.find(c=>c.id===q.customer_id)?.company_name||"Klant"} · geldig t/m {q.valid_until||"—"}</span></div><strong>{money.format(Number(q.total_incl_vat))}</strong><Status value={q.status}/></button>)}</div>:<Empty>Nog geen offertes.</Empty>}</Card></div>;
}

export function InvoicesModule({ customers }: { customers: BillingCustomer[] }) {
  const [invoices,setInvoices]=useState<Invoice[]>([]);const [credits,setCredits]=useState<CreditNote[]>([]);const [products,setProducts]=useState<CatalogProduct[]>([]);const [profile,setProfile]=useState<CompanyProfile|null>(null);const [selected,setSelected]=useState<Invoice|null>(null);const [items,setItems]=useState<BillingItem[]>([]);const [error,setError]=useState<string|null>(null);const [preview,setPreview]=useState("");
  async function load(){try{const [i,c,p,cp]=await Promise.all([listInvoices(),listCreditNotes(),listCatalogProducts(false),getCompanyProfile()]);setInvoices(i);setCredits(c);setProducts(p);setProfile(cp);}catch(e){setError(e instanceof Error?e.message:"Laden mislukt")}}
  async function open(i:Invoice){setSelected(await getInvoice(i.id));setItems(await listInvoiceItems(i.id));}
  async function refresh(){if(selected){const i=await getInvoice(selected.id);setSelected(i);setItems(await listInvoiceItems(i.id));}await load();}
  useEffect(()=>{load()},[]);
  async function newInvoice(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);try{const i=await createInvoice(String(f.get("customer_id")));await load();await open(i);}catch(err){setError(err instanceof Error?err.message:"Aanmaken mislukt")}}
  if(selected){const draft=selected.status==="DRAFT";const c=customers.find(x=>x.id===selected.customer_id);const relatedCredits=credits.filter(x=>x.invoice_id===selected.id);return <div className="space-y-5"><button type="button" onClick={()=>setSelected(null)} className="text-sm font-semibold text-slate-600">← Terug naar facturen</button><Card title={`${selected.invoice_number||"Conceptfactuur"} — ${c?.company_name||"Klant"}`} subtitle={`Status ${selected.status}`} actions={<div className="flex gap-2"><Status value={selected.status}/><button type="button" onClick={()=>setPreview(renderBillingDocumentHtml("INVOICE",selected,items,profile))} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold"><Download size={14}/> PDF-preview</button></div>}><ErrorBox message={error}/>{draft?<form onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await updateInvoice(selected.id,{notes:String(f.get("notes"))||null,discount_type:String(f.get("discount_type")) as DiscountType,discount_value:Number(f.get("discount_value")||0)});await refresh();}catch(err){setError(err instanceof Error?err.message:"Opslaan mislukt")}}} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><DiscountFields type={selected.discount_type} value={selected.discount_value}/><label className="md:col-span-2 text-sm font-medium text-slate-700">Notities<textarea name="notes" defaultValue={selected.notes||""} rows={2} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5"/></label><div className="md:col-span-2 xl:col-span-4"><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><Save size={15} className="mr-2 inline"/>Concept opslaan</button></div></form>:<div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-4"><div><span className="block text-xs text-slate-400">Factuurdatum</span><strong>{selected.invoice_date||"—"}</strong></div><div><span className="block text-xs text-slate-400">Vervaldatum</span><strong>{selected.due_date||"—"}</strong></div><div><span className="block text-xs text-slate-400">Kenmerk</span><strong>{selected.payment_reference||"—"}</strong></div><div><span className="block text-xs text-slate-400">Betaald</span><strong>{money.format(Number(selected.amount_paid))}</strong></div></div>}<div className="mt-6"><h3 className="mb-3 font-semibold">Regels</h3><ItemsEditor kind="INVOICE" items={items} draft={draft} onRefresh={refresh}/>{draft?<div className="mt-3"><ItemForm kind="INVOICE" parentId={selected.id} products={products} nextPosition={items.length+1} onDone={refresh}/></div>:null}<Totals subtotal={Number(selected.subtotal_ex_vat)} lineDiscount={Number(selected.line_discount_ex_vat)} docDiscount={Number(selected.document_discount_ex_vat)} totalEx={Number(selected.total_ex_vat)} vat={Number(selected.vat_total)} totalIncl={Number(selected.total_incl_vat)}/></div><div className="mt-6 flex flex-wrap gap-2">{draft?<button type="button" disabled={!items.length} onClick={async()=>{if(confirm("Factuur finaliseren? Daarna zijn financiële regels niet meer aanpasbaar.")){try{const nr=await finalizeInvoice(selected.id);await refresh();alert(`Factuur ${nr} is gefinaliseerd.`);}catch(err){setError(err instanceof Error?err.message:"Finaliseren mislukt")}}}} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><FileCheck2 size={15} className="mr-2 inline"/>Finaliseer factuur</button>:null}{["FINALIZED","SENT","PARTIALLY_PAID","OVERDUE"].includes(selected.status)?<><button type="button" onClick={async()=>{await updateInvoice(selected.id,{status:"SENT",sent_at:new Date().toISOString()});await refresh();}} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Markeer verzonden</button><button type="button" onClick={async()=>{await markInvoicePaid(selected);await refresh();}} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"><Check size={15} className="mr-2 inline"/>Markeer betaald</button><button type="button" onClick={async()=>{const reason=prompt("Reden voor volledige creditnota?")||"Volledige creditering";if(confirm("Volledige creditnota maken?")){try{await createFullCreditNote(selected.id,reason);await refresh();}catch(err){setError(err instanceof Error?err.message:"Crediteren mislukt")}}}} className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700">Volledig crediteren</button></>:null}</div>{relatedCredits.length?<div className="mt-6"><h3 className="mb-2 font-semibold">Creditnota’s</h3>{relatedCredits.map(cr=><button type="button" key={cr.id} onClick={()=>setPreview(renderBillingDocumentHtml("CREDIT",cr,[],profile))} className="mr-2 rounded-lg border border-slate-200 px-3 py-2 text-sm">{cr.credit_number} · {money.format(Number(cr.total_incl_vat))}</button>)}</div>:null}</Card><BillingPreviewModal open={Boolean(preview)} html={preview} title={selected.invoice_number||"Conceptfactuur"} onClose={()=>setPreview("")}/></div>}
  return <div className="space-y-5"><Card title="Nieuwe factuur" subtitle="Je kunt ook vanuit een geaccepteerde offerte automatisch een factuurconcept maken."><form onSubmit={newInvoice} className="flex flex-wrap items-end gap-3"><label className="min-w-72 flex-1 text-sm font-medium text-slate-700">Klant<select name="customer_id" required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="">Selecteer klant</option>{customers.filter(c=>c.status!=="ARCHIVED").map(c=><option key={c.id} value={c.id}>{customerLabel(c)}</option>)}</select></label><button className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white"><FilePlus2 size={15} className="mr-2 inline"/>Factuurconcept starten</button></form></Card><Card title="Facturen" subtitle={`${invoices.length} factuur/factuurconcept(en)`}><ErrorBox message={error}/>{invoices.length?<div className="space-y-2">{invoices.map(i=><button type="button" onClick={()=>open(i)} key={i.id} className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-4 rounded-xl border border-slate-100 px-4 py-3 text-left hover:bg-slate-50"><div><strong className="text-sm">{i.invoice_number||"Concept"}</strong><span className="block text-xs text-slate-400">{customers.find(c=>c.id===i.customer_id)?.company_name||"Klant"} · vervalt {i.due_date||"—"}</span></div><strong>{money.format(Number(i.total_incl_vat))}</strong><Status value={i.status}/></button>)}</div>:<Empty>Nog geen facturen.</Empty>}</Card></div>;
}
