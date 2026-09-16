import EboekhoudenModule from "./EboekhoudenModule";
import { useSearchParams } from "@/lib/router-compat";
import { useEffect, useState, type ComponentType } from "react";
import {
  ArrowLeft,
  Building2,
  CreditCard,
  FileSignature,
  FileText,
  Link2,
  Mail,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  Repeat2,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";
import { listCustomers, type Customer } from "./control-center-data";
import { BillingDashboardCards, CompanyProfileModule, QuotesModule } from "./SalesBillingModules";
import { InvoicesModuleV2 } from "./CatalogInvoiceModulesV2";
import CatalogModuleV3 from "./CatalogModuleV3";
import { SubscriptionsModule } from "./RecurringBillingModule";
import PublicQuoteLinksModule from "./PublicQuoteLinksModule";
import { PaymentsModule } from "./PaymentsModule";
import BillingEmailModule from "./BillingEmailModule";
import MolliePaymentsModule from "./MolliePaymentsModule";
import ProductionReadinessModule from "./ProductionReadinessModule";
import ContractsModule from "./ContractsModule";
import BillingCustomersModule from "./BillingCustomersModule";
import { refreshOverdueInvoices } from "./payments-data";

type Section =
  | "overview"
  | "quotes"
  | "quote-links"
  | "contracts"
  | "invoices"
  | "payments"
  | "online-payments"
  | "accounting"
  | "email"
  | "production"
  | "subscriptions"
  | "catalog"
  | "customers"
  | "company";

type BillingCustomer = Customer & {
  address_line1?: string | null;
  address_line2?: string | null;
  postal_code?: string | null;
  city?: string | null;
  country?: string | null;
  kvk_number?: string | null;
  vat_number?: string | null;
  iban?: string | null;
};

const sections = [
  { id: "overview" as const, label: "Overzicht", icon: ReceiptText },
  { id: "quotes" as const, label: "Offertes", icon: FileText },
  { id: "quote-links" as const, label: "Offertelinks", icon: Link2 },
  { id: "contracts" as const, label: "Contracten", icon: FileSignature },
  { id: "invoices" as const, label: "Facturen", icon: ReceiptText },
  { id: "payments" as const, label: "Betalingen", icon: WalletCards },
  { id: "online-payments" as const, label: "Online betalen", icon: CreditCard },
  { id: "accounting" as const, label: "e-Boekhouden", icon: Link2 },
  { id: "email" as const, label: "E-mail & reminders", icon: Mail },
  { id: "production" as const, label: "Productie readiness", icon: ShieldCheck },
  { id: "subscriptions" as const, label: "Abonnementen", icon: Repeat2 },
  { id: "catalog" as const, label: "Catalogus", icon: Package },
  { id: "customers" as const, label: "Klantgegevens", icon: Users },
  { id: "company" as const, label: "Bedrijfsprofiel", icon: Building2 },
];

const titles: Record<Section, [string, string]> = {
  overview: ["Sales & Billing", "Offertes, contracten, facturen, abonnementen, betalingen en documentgeneratie."],
  quotes: ["Offertes", "Maak en beheer Vedantix-offertes vanuit je klanten en catalogus."],
  "quote-links": ["Offertelinks", "Deel beveiligde offertelinks en laat klanten zelf accepteren of afwijzen."],
  contracts: ["Contracten", "Maak versioned overeenkomsten, laat beide partijen elektronisch tekenen en bewaar een audit trail."],
  invoices: ["Facturen", "Maak concepten met actuele catalogusprijzen, finaliseer facturen en beheer actieve/inactieve records."],
  payments: ["Betalingen", "Registreer deelbetalingen, bekijk de volledige historie en volg achterstallige facturen."],
  "online-payments": ["Online betalen", "Beheer Mollie/iDEAL en volg hosted checkout-betalingen zonder API-keys in de browser."],
  accounting: ["e-Boekhouden", "Verbind je administratie, kies boekhoudrekeningen en controleer de gegevens voor synchronisatie."],
  email: ["E-mail & reminders", "Verstuur offertes en facturen via Migadu en beheer automatische betaalherinneringen."],
  production: ["Productie readiness", "Valideer de AWS serverless productie-release voordat klantcommunicatie en betalingen actief zijn."],
  subscriptions: ["Abonnementen", "Beheer maand- en jaarabonnementen en hun automatische factuurmomenten."],
  catalog: ["Catalogus", "Beheer pakketten en diensten met prijzen excl. btw; de incl.-btw prijs wordt direct herberekend."],
  customers: ["Klantgegevens", "Factuur-, offerte- en contractgegevens per klant, inclusief IBAN."],
  company: ["Bedrijfsprofiel", "Vedantix-gegevens die op nieuwe documenten worden vastgelegd."],
};

function DashboardAction({ icon: Icon, title, description, onClick }: { icon: ComponentType<{ className?: string }>; title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Icon className="mb-4" />
      <strong className="block text-lg">{title}</strong>
      <span className="text-sm text-slate-500">{description}</span>
    </button>
  );
}

export default function SalesBillingApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedSection = searchParams.get("section");
  const section: Section = sections.some(item => item.id === requestedSection) ? requestedSection as Section : "overview";
  function setSection(next: Section) {
    const params = new URLSearchParams(searchParams);
    if (next === "overview") params.delete("section"); else params.set("section", next);
    setSearchParams(params);
  }
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

  useEffect(() => { void loadCustomers(); }, []);
  const title = titles[section];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-950 p-5 text-white md:flex md:flex-col">
          <div className="mb-7"><strong className="block text-sm">Vedantix</strong><span className="text-xs text-slate-400">Control Center · Sales & Billing</span></div>
          <a href="/admin" className="mb-5 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"><ArrowLeft size={16}/> Control Center</a>
          <nav className="space-y-1">
            {sections.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return <button key={item.id} type="button" onClick={() => setSection(item.id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon size={17}/>{item.label}</button>;
            })}
            <a href="/admin/previews" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-slate-300 hover:bg-white/10 hover:text-white"><Link2 size={17}/>Website previews</a>
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">Offertes, contracten, facturen, betalingen en klantcommunicatie blijven als afzonderlijke auditbare stappen beschikbaar.</div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-7">
            <div><span className="text-xs font-medium uppercase tracking-[.16em] text-slate-400">Vedantix Operations</span><strong className="block text-sm md:hidden">Sales & Billing</strong></div>
            <div className="flex gap-2"><a href="/admin" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 md:hidden">Control Center</a><button type="button" onClick={() => void loadCustomers()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Vernieuwen</button></div>
          </header>

          <nav aria-label="Sales & Billing onderdelen" className="border-b border-slate-200 bg-white px-4 py-3 md:hidden">
            <label className="block text-xs font-semibold text-slate-500" htmlFor="billing-section">Onderdeel</label>
            <select id="billing-section" value={section} onChange={event => setSection(event.target.value as Section)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold">
              {sections.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </nav>

          <main className="mx-auto max-w-7xl p-4 md:p-7">
            <div className="mb-7"><span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Vedantix Admin</span><h1 className="mt-1 text-3xl font-bold tracking-tight">{title[0]}</h1><p className="mt-2 text-sm text-slate-500">{title[1]}</p></div>

            {section === "overview" ? (
              <div className="space-y-6">
                <BillingDashboardCards />
                <div className="grid gap-5 lg:grid-cols-3 xl:grid-cols-4">
                  <DashboardAction icon={Plus} title="Nieuwe klant" description="Leg klantgegevens vast en start daarna direct met contract of factuur." onClick={() => setSection("customers")} />
                  <DashboardAction icon={FileText} title="Nieuwe offerte" description="Klant selecteren, pakket toevoegen, korting en btw automatisch." onClick={() => setSection("quotes")} />
                  <DashboardAction icon={FileSignature} title="Contracten" description="Contracten bekijken, downloaden, aanmaken en ondertekenen." onClick={() => setSection("contracts")} />
                  <DashboardAction icon={ReceiptText} title="Nieuwe factuur" description="Direct factureren of vanuit een geaccepteerde offerte." onClick={() => setSection("invoices")} />
                  <DashboardAction icon={WalletCards} title="Betalingen" description="Deelbetalingen, historie en achterstallige facturen." onClick={() => setSection("payments")} />
                  <DashboardAction icon={CreditCard} title="Online betalen" description="Mollie/iDEAL checkout en paymentstatus." onClick={() => setSection("online-payments")} />
                  <DashboardAction icon={Link2} title="e-Boekhouden" description="Account verbinden en boekhoudrekeningen instellen." onClick={() => setSection("accounting")} />
                  <DashboardAction icon={Mail} title="E-mail" description="Offertes, facturen en betaalherinneringen via Migadu." onClick={() => setSection("email")} />
                  <DashboardAction icon={ShieldCheck} title="Productie readiness" description="Controleer AWS release en commerce-activatie." onClick={() => setSection("production")} />
                  <DashboardAction icon={Repeat2} title="Abonnementen" description="Maand- en jaarfacturen automatisch laten ontstaan." onClick={() => setSection("subscriptions")} />
                  <DashboardAction icon={Link2} title="Offertelinks" description="Deel offertes veilig en registreer akkoord of afwijzing." onClick={() => setSection("quote-links")} />
                  <DashboardAction icon={Link2} title="Website previews" description="Maak tijdelijke, intrekbare klantlinks voor websitepreviews." onClick={() => window.location.assign("/admin/previews")} />
                </div>
              </div>
            ) : null}

            {section === "quotes" ? <QuotesModule customers={customers}/> : null}
            {section === "quote-links" ? <PublicQuoteLinksModule customers={customers}/> : null}
            {section === "contracts" ? <ContractsModule customers={customers}/> : null}
            {section === "invoices" ? <InvoicesModuleV2 customers={customers}/> : null}
            {section === "payments" ? <PaymentsModule customers={customers}/> : null}
            {section === "online-payments" ? <MolliePaymentsModule/> : null}
            {section === "accounting" ? <EboekhoudenModule/> : null}
            {section === "email" ? <BillingEmailModule customers={customers}/> : null}
            {section === "production" ? <ProductionReadinessModule/> : null}
            {section === "subscriptions" ? <SubscriptionsModule customers={customers}/> : null}
            {section === "catalog" ? <CatalogModuleV3/> : null}
            {section === "customers" ? <BillingCustomersModule customers={customers} onChanged={loadCustomers}/> : null}
            {section === "company" ? <CompanyProfileModule/> : null}
          </main>
        </div>
      </div>
    </div>
  );
}

