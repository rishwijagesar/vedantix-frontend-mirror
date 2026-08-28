import { useMemo, useState, type ComponentType } from "react";
import {
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  Mail,
  Menu,
  MonitorSmartphone,
  Plus,
  Rocket,
  SearchCheck,
  Settings,
  ShieldCheck,
  Users,
  Workflow,
  X,
} from "lucide-react";
import "./control-center.css";

type SectionId =
  | "dashboard"
  | "customers"
  | "domains"
  | "websites"
  | "email"
  | "deployments"
  | "visibility"
  | "support"
  | "billing"
  | "automations"
  | "settings";

type NavItem = {
  id: SectionId;
  label: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  phase: "core" | "later";
};

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, phase: "core" },
  { id: "customers", label: "Klanten", icon: Users, phase: "core" },
  { id: "domains", label: "Domeinen", icon: Globe2, phase: "core" },
  { id: "websites", label: "Websites", icon: MonitorSmartphone, phase: "core" },
  { id: "email", label: "E-mail", icon: Mail, phase: "later" },
  { id: "deployments", label: "Deployments", icon: Rocket, phase: "later" },
  { id: "visibility", label: "SEO & AI", icon: SearchCheck, phase: "later" },
  { id: "support", label: "Support", icon: LifeBuoy, phase: "later" },
  { id: "billing", label: "Facturatie", icon: CreditCard, phase: "later" },
  { id: "automations", label: "Automatiseringen", icon: Workflow, phase: "later" },
  { id: "settings", label: "Instellingen", icon: Settings, phase: "later" },
];

const SECTION_TITLES: Record<SectionId, { title: string; subtitle: string }> = {
  dashboard: {
    title: "Control Center",
    subtitle: "Eén overzicht voor klanten, domeinen, websites en operationele status.",
  },
  customers: {
    title: "Klanten",
    subtitle: "Beheer bedrijven en koppel hun domeinen, websites en diensten.",
  },
  domains: {
    title: "Domeinen",
    subtitle: "DNS, e-mailauthenticatie, SSL en registrarstatus op één plek.",
  },
  websites: {
    title: "Websites",
    subtitle: "Koppel GitHub, Lovable en productieomgevingen per klant.",
  },
  email: {
    title: "E-mail",
    subtitle: "Migadu-domeinen, mailboxstatus en mailauthenticatie.",
  },
  deployments: {
    title: "Deployments",
    subtitle: "Publicaties, rollbackstatus en releasehistorie.",
  },
  visibility: {
    title: "SEO & AI-vindbaarheid",
    subtitle: "Technische checks voor zoekmachines en AI-systemen.",
  },
  support: {
    title: "Support",
    subtitle: "Tickets, wijzigingen en klantvragen.",
  },
  billing: {
    title: "Facturatie",
    subtitle: "Abonnementen, facturen en betaalstatus.",
  },
  automations: {
    title: "Automatiseringen",
    subtitle: "Herhaalbare controles en launch-workflows.",
  },
  settings: {
    title: "Instellingen",
    subtitle: "Integraties, gebruikers, rollen en bedrijfsinstellingen.",
  },
};

function MetricCard({
  label,
  value,
  caption,
  icon: Icon,
}: {
  label: string;
  value: string;
  caption: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}) {
  return (
    <article className="cc-metric-card">
      <div className="cc-metric-icon">
        <Icon size={18} strokeWidth={1.8} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{caption}</span>
      </div>
    </article>
  );
}

function EmptyModule({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <div className="cc-empty-state">
      <div className="cc-empty-icon">
        <Plus size={22} strokeWidth={1.8} />
      </div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel ? (
        <button className="cc-primary-button" type="button" disabled>
          <Plus size={16} />
          {actionLabel}
        </button>
      ) : null}
      <small>Database en authenticatie worden in de volgende backendstap gekoppeld.</small>
    </div>
  );
}

function Dashboard() {
  const launchChecks = [
    ["Domein", "DNS en registrar"],
    ["Website", "Lovable en GitHub"],
    ["E-mail", "MX, SPF, DKIM en DMARC"],
    ["Vindbaarheid", "robots, sitemap en llms"],
  ];

  return (
    <>
      <section className="cc-metrics-grid" aria-label="Bedrijfsoverzicht">
        <MetricCard label="Klanten" value="0" caption="Nog geen data gekoppeld" icon={Users} />
        <MetricCard label="Domeinen" value="0" caption="Monitoring wordt voorbereid" icon={Globe2} />
        <MetricCard label="Websites" value="0" caption="Lovable-koppeling volgt" icon={MonitorSmartphone} />
        <MetricCard label="Acties nodig" value="0" caption="Geen actieve waarschuwingen" icon={CircleAlert} />
      </section>

      <section className="cc-dashboard-grid">
        <article className="cc-panel cc-launch-panel">
          <div className="cc-panel-heading">
            <div>
              <span className="cc-kicker">Standaardprocedure</span>
              <h2>Launch readiness</h2>
            </div>
            <ShieldCheck size={22} />
          </div>
          <p className="cc-panel-copy">
            Elke klant krijgt straks dezelfde technische checklist voordat een website live gaat.
          </p>
          <div className="cc-check-list">
            {launchChecks.map(([title, description]) => (
              <div className="cc-check-row" key={title}>
                <div className="cc-check-status">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </div>
                <span className="cc-status-muted">Niet gekoppeld</span>
              </div>
            ))}
          </div>
        </article>

        <article className="cc-panel">
          <div className="cc-panel-heading">
            <div>
              <span className="cc-kicker">Architectuur</span>
              <h2>Providerstatus</h2>
            </div>
            <BarChart3 size={22} />
          </div>
          <div className="cc-provider-list">
            <div><span>Websitehosting</span><strong>Lovable</strong></div>
            <div><span>E-mail</span><strong>Migadu</strong></div>
            <div><span>DNS</span><strong>Los / Cloudflare-ready</strong></div>
            <div><span>Source control</span><strong>GitHub</strong></div>
            <div><span>Database</span><strong>Nog niet gekoppeld</strong></div>
          </div>
        </article>
      </section>
    </>
  );
}

function Customers() {
  return (
    <section className="cc-panel cc-module-panel">
      <div className="cc-panel-heading">
        <div>
          <span className="cc-kicker">Core module 01</span>
          <h2>Klantenregister</h2>
        </div>
      </div>
      <EmptyModule
        title="Nog geen klanten gekoppeld"
        description="De eerste databaseversie krijgt een klantrecord als centrale eigenaar van domeinen, websites en integraties."
        actionLabel="Nieuwe klant"
      />
    </section>
  );
}

function Domains() {
  return (
    <section className="cc-panel cc-module-panel">
      <div className="cc-panel-heading">
        <div>
          <span className="cc-kicker">Core module 02</span>
          <h2>Domeinbeheer</h2>
        </div>
      </div>
      <div className="cc-domain-capabilities">
        {[
          "Nameservers en DNS-provider herkennen",
          "MX-records en Migadu-status controleren",
          "SPF, DKIM en DMARC valideren",
          "SSL en domeinverloop bewaken",
          "Website-hostingrecord los van e-mail wijzigen",
        ].map((item) => (
          <div key={item}><CheckCircle2 size={16} />{item}</div>
        ))}
      </div>
      <EmptyModule
        title="Nog geen domeinen geïmporteerd"
        description="Bij import maken we eerst een DNS-snapshot. Mailrecords worden daarna als beschermd gemarkeerd tijdens een website-migratie."
        actionLabel="Domein toevoegen"
      />
    </section>
  );
}

function Websites() {
  return (
    <section className="cc-panel cc-module-panel">
      <div className="cc-panel-heading">
        <div>
          <span className="cc-kicker">Core module 03</span>
          <h2>Websitebeheer</h2>
        </div>
      </div>
      <div className="cc-flow">
        <div><strong>GitHub</strong><span>Source of truth</span></div>
        <ChevronRight size={18} />
        <div><strong>Lovable</strong><span>Build & hosting</span></div>
        <ChevronRight size={18} />
        <div><strong>Domein</strong><span>DNS cutover</span></div>
      </div>
      <EmptyModule
        title="Nog geen websites gekoppeld"
        description="Per website slaan we repository, Lovable-project, productie-URL, status en laatste deployment op."
        actionLabel="Website koppelen"
      />
    </section>
  );
}

function Placeholder({ section }: { section: SectionId }) {
  const content = SECTION_TITLES[section];
  return (
    <section className="cc-panel cc-module-panel">
      <div className="cc-placeholder">
        <ShieldCheck size={28} />
        <span className="cc-kicker">Volgende fase</span>
        <h2>{content.title}</h2>
        <p>{content.subtitle}</p>
        <small>Deze module wordt toegevoegd nadat Customers + Domains + Websites op de database staan.</small>
      </div>
    </section>
  );
}

export default function AdminControlCenter() {
  const [section, setSection] = useState<SectionId>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeMeta = SECTION_TITLES[section];

  const content = useMemo(() => {
    if (section === "dashboard") return <Dashboard />;
    if (section === "customers") return <Customers />;
    if (section === "domains") return <Domains />;
    if (section === "websites") return <Websites />;
    return <Placeholder section={section} />;
  }, [section]);

  const selectSection = (next: SectionId) => {
    setSection(next);
    setMobileOpen(false);
  };

  return (
    <div className="cc-app">
      <aside className={`cc-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="cc-brand">
          <div className="cc-brand-mark">V</div>
          <div>
            <strong>Vedantix</strong>
            <span>Control Center</span>
          </div>
          <button className="cc-mobile-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Menu sluiten">
            <X size={19} />
          </button>
        </div>

        <nav className="cc-nav" aria-label="Control Center navigatie">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.id === section;
            return (
              <button
                className={active ? "is-active" : ""}
                type="button"
                key={item.id}
                onClick={() => selectSection(item.id)}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.label}</span>
                {item.phase === "later" ? <small>Later</small> : null}
              </button>
            );
          })}
        </nav>

        <div className="cc-sidebar-footer">
          <div className="cc-environment-dot" />
          <div>
            <strong>Development</strong>
            <span>Niet gepubliceerd</span>
          </div>
        </div>
      </aside>

      {mobileOpen ? <button className="cc-backdrop" aria-label="Menu sluiten" type="button" onClick={() => setMobileOpen(false)} /> : null}

      <div className="cc-main-shell">
        <header className="cc-topbar">
          <button className="cc-menu-button" type="button" onClick={() => setMobileOpen(true)} aria-label="Menu openen">
            <Menu size={20} />
          </button>
          <div className="cc-topbar-copy">
            <span>Vedantix Operations</span>
            <strong>{activeMeta.title}</strong>
          </div>
          <div className="cc-topbar-actions">
            <span className="cc-security-chip"><ShieldCheck size={15} /> Auth volgt</span>
          </div>
        </header>

        <main className="cc-main">
          <div className="cc-page-heading">
            <div>
              <span className="cc-kicker">Vedantix Admin v2</span>
              <h1>{activeMeta.title}</h1>
              <p>{activeMeta.subtitle}</p>
            </div>
            {section === "customers" || section === "domains" || section === "websites" ? (
              <button className="cc-primary-button" type="button" disabled>
                <Plus size={16} /> Nieuwe toevoegen
              </button>
            ) : null}
          </div>
          {content}
        </main>
      </div>
    </div>
  );
}
