import { useEffect, useState } from "react";
import { ArrowLeft, Building2, FileText, Link2, Mail, Package, ReceiptText, RefreshCw, Repeat2, Users, WalletCards } from "lucide-react";
import { listCustomers, updateCustomer, type Customer } from "./control-center-data";
import { BillingDashboardCards, CatalogModule, CompanyProfileModule, InvoicesModule, QuotesModule } from "./SalesBillingModules";
import { SubscriptionsModule } from "./RecurringBillingModule";
import PublicQuoteLinksModule from "./PublicQuoteLinksModule";
import { PaymentsModule } from "./PaymentsModule";
import BillingEmailModule from "./BillingEmailModule";
import { refreshOverdueInvoices } from "./payments-data";

type Section = "overview" | "quotes" | "quote-links" | "invoices" | "payments" | "email" | "subscriptions" | "catalog" | "customers" | "company";
type BillingCustomer = Customer & { address_line1?: string | null; address_line2?: string | null; postal_code?: string | null; city?: string | null; country?: string | null; kvk_number?: string | null; vat_number?: string | null };

const sections = [
  { id: "overview" as const, label: "Overzicht", icon: ReceiptText },
  { id: "quotes" as const, label: "Offertes", icon: FileText },
  { id: "quote-links" as const, label: "Klantlinks", icon: Link2 },
  { id: "invoices" as const, label: "Facturen", icon: ReceiptText },
  { id: "payments" as const, label: "Betalingen", icon: WalletCards },
  { id: "email" as const, label: "E-mail & reminders", icon: Mail },
  { id: "subscriptions" as const, label: "Abonnementen", icon: Repeat2 },
  { id: "catalog" as const, label: "Catalogus", icon: Package },
  { id: "customers" as const, label: "Klantgegevens", icon: Users },
  { id: "company" as const, label: "Bedrijfsprofiel", icon: Building2 },
];

export default function SalesBillingApp() {
  const [section, setSection] = useState<Section>("overview");
  const [customers, setCustomers] = useState<BillingCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadCustomers() {
    setLoading(true);
    try {
      try { await refreshOverdueInvoices(); } catch { /* staged migration compatibility */ }
      setCustomers((await listCustomers()) as BillingCustomer[]);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadCustomers(); }, []);

  const title = {
    overview: ["Sales & Billing", "Offertes, facturen, abonnementen, betalingen en documentgeneratie."],
    quotes: ["Offertes", "Maak en beheer Vedantix-offertes vanuit je klanten en catalogus."],
    "quote-links": ["Klantlinks", "Deel beveiligde offertelinks en laat klanten zelf accepteren of afwijzen."],
    invoices: ["Facturen", "Finaliseer facturen, volg betaalstatus en maak creditnota’s."],
    payments: ["Betalingen", "Registreer deelbetalingen, bekijk de volledige historie en volg achterstallige facturen."],
    email: ["E-mail & reminders", "Verstuur offertes en facturen via Migadu en beheer automatische betaalherinneringen."],
    subscriptions: ["Abonnementen", "Beheer maand- en jaarabonnementen en hun automatische factuurmomenten."],
    catalog: ["Catalogus", "Beheer pakketten, losse diensten, prijzen en btw."],
    customers: ["Klantgegevens", "Factuur- en offertegegevens per klant."],
    company: ["Bedrijfsprofiel", "Vedantix-gegevens die op nieuwe documenten worden vastgelegd."],
  }[section];

  return <div className="min-h-screen bg-slate-50 text-slate-950"><div className="flex min-h-screen">
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-950 p-5 text-white md:flex md:flex-col">
      <div className="mb-7"><strong className="block text-sm">Vedantix</strong><span className="text-xs text-slate-400">Control Center · Sales & Billing</span></div>
      <a href="/admin" className="mb-5 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"><ArrowLeft size={16}/> Control Center</a>
      <nav className="space-y-1">{sections.map(item=>{const Icon=item.icon;const active=section===item.id;return <button key={item.id} type="button" onClick={()=>setSection(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${active?"bg-white text-slate-950":"text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon size={17}/>{item.label}</button>})}</nav>
      <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">Offertes, facturen, betalingen en klantcommunicatie blijven als afzonderlijke auditbare stappen beschikbaar.</div>
    </aside>
    <div className="min-w-0 flex-1"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-7"><div><span className="text-xs font-medium uppercase tracking-[.16em] text-slate-400">Vedantix Operations</span><strong className="block text-sm md:hidden">Sales & Billing</strong></div><div className="flex gap-2"><a href="/admin" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 md:hidden">Control Center</a><button type="button" onClick={loadCustomers} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"><RefreshCw size={14} className={loading?"animate-spin":""}/> Vernieuwen</button></div></header>
      <main className="mx-auto max-w-7xl p-4 md:p-7"><div className="mb-7"><span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Vedantix Admin</span><h1 className="mt-1 text-3xl font-bold tracking-tight">{title[0]}</h1><p className="mt-2 text-sm text-slate-500">{title[1]}</p></div>
        {section==="overview"?<div className="space-y-6"><BillingDashboardCards/><div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-6"><button onClick={()=>setSection("quotes")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"><FileText className="mb-4"/><strong className="block text-lg">Nieuwe offerte</strong><span className="text-sm text-slate-500">Klant selecteren, pakket toevoegen, korting en btw automatisch.</span></button><button onClick={()=>setSection("invoices")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"><ReceiptText className="mb-4"/><strong className="block text-lg">Facturen</strong><span className="text-sm text-slate-500">Concept, finaliseren en crediteren.</span></button><button onClick={()=>setSection("payments")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"><WalletCards className="mb-4"/><strong className="block text-lg">Betalingen</strong><span className="text-sm text-slate-500">Deelbetalingen, historie en achterstallige facturen.</span></button><button onClick={()=>setSection("email")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"><Mail className="mb-4"/><strong className="block text-lg">E-mail</strong><span className="text-sm text-slate-500">Offertes, facturen en betaalherinneringen via Migadu.</span></button><button onClick={()=>setSection("subscriptions")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"><Repeat2 className="mb-4"/><strong className="block text-lg">Abonnementen</strong><span className="text-sm text-slate-500">Maand- en jaarfacturen automatisch laten ontstaan.</span></button><button onClick={()=>setSection("quote-links")} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm"><Link2 className="mb-4"/><strong className="block text-lg">Klantlinks</strong><span className="text-sm text-slate-500">Deel offertes veilig en registreer akkoord of afwijzing.</span></button></div></div>:null}
        {section==="quotes"?<QuotesModule customers={customers}/>:null}
        {section==="quote-links"?<PublicQuoteLinksModule customers={customers}/>:null}
        {section==="invoices"?<InvoicesModule customers={customers}/>:null}
        {section==="payments"?<PaymentsModule customers={customers}/>:null}
        {section==="email"?<BillingEmailModule customers={customers}/>:null}
        {section==="subscriptions"?<SubscriptionsModule customers={customers}/>:null}
        {section==="catalog"?<CatalogModule/>:null}
        {section==="customers"?<BillingCustomers customers={customers} onChanged={loadCustomers}/>:null}
        {section==="company"?<CompanyProfileModule/>:null}
      </main>
    </div>
  </div></div>;
}

function BillingCustomers({ customers, onChanged }: { customers: BillingCustomer[]; onChanged: ()=>Promise<void> }) {
  const [selected,setSelected]=useState<BillingCustomer|null>(null); const [error,setError]=useState<string|null>(null); const [saved,setSaved]=useState(false);
  if(!selected)return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Klantgegevens</h2><p className="mb-5 mt-1 text-sm text-slate-500">Vul adres-, KVK- en BTW-gegevens in voordat je een offerte of factuur maakt.</p><div className="space-y-2">{customers.map(c=><button key={c.id} type="button" onClick={()=>setSelected(c)} className="flex w-full items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-left hover:bg-slate-50"><div><strong className="text-sm">{c.company_name}</strong><span className="block text-xs text-slate-400">{c.email||"Geen e-mail"} · {c.city||"adres nog niet compleet"}</span></div><span className="text-xs font-semibold text-slate-500">Bewerken →</span></button>)}</div></section>;
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError(null);setSaved(false);const f=new FormData(e.currentTarget);try{await updateCustomer(selected!.id,{company_name:String(f.get("company_name")),contact_name:String(f.get("contact_name")||"")||null,email:String(f.get("email")||"")||null,phone:String(f.get("phone")||"")||null,address_line1:String(f.get("address_line1")||"")||null,address_line2:String(f.get("address_line2")||"")||null,postal_code:String(f.get("postal_code")||"")||null,city:String(f.get("city")||"")||null,country:String(f.get("country")||"Nederland"),kvk_number:String(f.get("kvk_number")||"")||null,vat_number:String(f.get("vat_number")||"")||null} as Partial<Customer>);await onChanged();setSaved(true);}catch(err){setError(err instanceof Error?err.message:"Opslaan mislukt")}}
  const input="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5";
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><button type="button" onClick={()=>setSelected(null)} className="mb-4 text-sm font-semibold text-slate-600">← Alle klanten</button><h2 className="text-lg font-semibold">{selected.company_name}</h2>{error?<div className="my-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>:null}{saved?<div className="my-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">Klantgegevens opgeslagen.</div>:null}<form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[["Bedrijfsnaam","company_name",selected.company_name],["Contactpersoon","contact_name",selected.contact_name],["E-mail","email",selected.email],["Telefoon","phone",selected.phone],["Adres","address_line1",selected.address_line1],["Adresregel 2","address_line2",selected.address_line2],["Postcode","postal_code",selected.postal_code],["Plaats","city",selected.city],["Land","country",selected.country||"Nederland"],["KVK-nummer","kvk_number",selected.kvk_number],["BTW-ID","vat_number",selected.vat_number]].map(([label,name,value])=><label key={String(name)} className="text-sm font-medium text-slate-700">{label}<input name={String(name)} defaultValue={String(value||"")} className={input}/></label>)}<div className="md:col-span-2 xl:col-span-3"><button className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white">Klantgegevens opslaan</button></div></form></section>;
}
