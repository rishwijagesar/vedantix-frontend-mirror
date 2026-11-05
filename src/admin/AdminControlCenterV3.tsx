import AdminLayout from "./AdminLayout";
import WebsitesModule from "./WebsitesModule";
import CustomerAccessModule from "./CustomerAccessModule";
import { operationSection, type OperationSection } from "./admin-navigation";
import { useSearchParams } from "@/lib/router-compat";
import ClientCasesModule from "./ClientCasesModule";
import MailManagement from "./MailManagement";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Globe2,
  Mail,
  MonitorSmartphone,
  Plus,
  RefreshCw,
  ScanLine,
  Settings,
  Trash2,
  Users,
} from "lucide-react";
import {
  createCustomer,
  createDomain,
  deleteCustomer,
  deleteDomain,
  getOverview,
  listCustomers,
  listDomains,
  listWebsites,
  type Customer,
  type Domain,
  type Overview,
  type Website,
} from "./control-center-data";
import { scanDomainHealth, type DomainHealthCheck } from "./domain-health";
import {
  cancelStaffInvite,
  inviteStaff,
  listStaffInvites,
  listStaffUsers,
  updateStaffUser,
  type StaffInvite,
  type StaffRole,
  type StaffUser,
} from "./staff-data";
import MonitoringConsole from "./MonitoringConsole";
import MigaduCredentialModal from "./MigaduCredentialModal";
import { BillingDashboardCards } from "./SalesBillingModules";
import "./control-center.css";

type Section = OperationSection;

function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const className = {
    neutral: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    danger: "bg-red-50 text-red-700",
  }[tone];
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-200 px-5 py-10 text-center text-sm text-slate-500">{children}</div>;
}

function Input({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

export default function AdminControlCenterV3() {
  const [searchParams] = useSearchParams();
  const section = operationSection(searchParams.get("section"));
  const [overview, setOverview] = useState<Overview>({ customers: 0, domains: 0, websites: 0, checksNeedingAttention: 0 });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [nextOverview, nextCustomers, nextDomains, nextWebsites] = await Promise.all([
        getOverview(),
        listCustomers(),
        listDomains(),
        listWebsites(),
      ]);
      setOverview(nextOverview);
      setCustomers(nextCustomers);
      setDomains(nextDomains);
      setWebsites(nextWebsites);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Data kon niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setShowForm(false);
  }, [section]);

  const domainsByCustomer = useMemo(() => {
    const map = new Map<string, Domain[]>();
    for (const domain of domains) map.set(domain.customer_id, [...(map.get(domain.customer_id) ?? []), domain]);
    return map;
  }, [domains]);

  const activeTitle: Record<Section, [string, string]> = {
    dashboard: ["Dashboard", "Operationeel overzicht van Vedantix en klantinfrastructuur."],
    "client-cases": ["Klantcases", "Klantverhalen, logo’s en resultaten op de website beheren."],
    customers: ["Klanten", "Centrale eigenaar van domeinen, websites en integraties."],
    domains: ["Domeinen", "DNS, e-mailprovider, status en technische gezondheid."],
    websites: ["Websites", "Websites beheren, snelheid meten en Google Analytics bekijken."],
    "customer-access": ["Klanttoegang", "Klantaccounts en toegang tot afzonderlijke websites beheren."],
    health: ["E-mail & DNS", "Beheer mailboxen en controleer de mailinstellingen van je domeinen."],
    monitoring: ["Monitoring", "Autonome domein-, e-mail- en websitecontrole met alerts en notification delivery."],
    staff: ["Team & toegang", "Toegang, rollen en uitnodigingen voor het Control Center."],
  };

  const title = activeTitle[section];

  return (
    <AdminLayout actions={<button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"><RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Vernieuwen</button>}>
          <main className="mx-auto max-w-7xl p-4 md:p-7">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div><span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Vedantix Admin</span><h1 className="mt-1 text-3xl font-bold tracking-tight">{title[0]}</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">{title[1]}</p></div>
              {section === "customers" || section === "domains" || section === "websites" ? (
                <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"><Plus size={16} /> Nieuwe toevoegen</button>
              ) : null}
            </div>

            {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            {section === "dashboard" ? <Dashboard overview={overview} customers={customers} domains={domains} websites={websites} loading={loading} /> : null}
            {section === "client-cases" ? <ClientCasesModule /> : null}
            {section === "customers" ? <CustomersModule customers={customers} showForm={showForm} onDone={async () => { setShowForm(false); await load(); }} /> : null}
            {section === "domains" ? <DomainsModule domains={domains} customers={customers} showForm={showForm} onDone={async () => { setShowForm(false); await load(); }} /> : null}
            {section === "websites" ? <WebsitesModule websites={websites} customers={customers} domainsByCustomer={domainsByCustomer} showForm={showForm} onDone={async () => { setShowForm(false); await load(); }} /> : null}
            {section === "health" ? <HealthModule domains={domains} onChanged={load} /> : null}
            {section === "monitoring" ? <MonitoringModule /> : null}
            {section === "staff" ? <StaffModule /> : null}
            {section === "customer-access" ? <CustomerAccessModule /> : null}
          </main>
    </AdminLayout>
  );
}

function Dashboard({ overview, customers, domains, websites, loading }: { overview: Overview; customers: Customer[]; domains: Domain[]; websites: Website[]; loading: boolean }) {
  const cards = [
    ["Klanten", overview.customers, Users, "Actieve en historische klantrecords"],
    ["Domeinen", overview.domains, Globe2, "DNS- en mailconfiguraties"],
    ["Websites", overview.websites, MonitorSmartphone, "GitHub/Lovable-projecten"],
    ["Acties nodig", overview.checksNeedingAttention, CircleAlert, "Actuele warnings en failures"],
  ] as const;
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, caption]) => <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}><div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"><Icon size={18} /></div><p className="text-sm text-slate-500">{label}</p><strong className="mt-1 block text-3xl font-bold">{loading ? "—" : value}</strong><span className="mt-1 block text-xs text-slate-400">{caption}</span></article>)}
      </section>
      <section aria-label="Monitoringstatus" className="rounded-2xl border border-(--cc-border) bg-(--cc-panel) px-5 py-4 shadow-sm">
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div><dt className="text-xs text-(--cc-muted)">Automatische monitoring</dt><dd className="mt-1 text-sm font-semibold text-(--cc-success)">ACTIEF</dd></div>
          <div><dt className="text-xs text-(--cc-muted)">Laatste run</dt><dd className="mt-1 text-sm font-semibold">{overview.lastMonitoringAt ? new Date(overview.lastMonitoringAt).toLocaleString("nl-NL") : "Nog geen run"}</dd></div>
          <div><dt className="text-xs text-(--cc-muted)">Status</dt><dd className="mt-1 break-words text-sm font-semibold">{overview.lastMonitoringStatus || "UNKNOWN"}</dd></div>
          <div><dt className="text-xs text-(--cc-muted)">Planning</dt><dd className="mt-1 text-sm font-semibold">Dagelijks automatisch</dd></div>
        </dl>
      </section>
      <BillingDashboardCards />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Beheerde omgeving" subtitle="Echte data uit Supabase; geen demo-records.">{customers.length === 0 ? <Empty>Nog geen klanten.</Empty> : <div className="space-y-3">{customers.slice(0, 6).map((customer) => <div key={customer.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"><div><strong className="text-sm">{customer.company_name}</strong><span className="mt-0.5 block text-xs text-slate-400">{customer.email || "Geen e-mail"}</span></div><Badge tone={customer.status === "ACTIVE" ? "success" : "neutral"}>{customer.status}</Badge></div>)}</div>}</Panel>
        <Panel title="Providerstatus" subtitle="Vaste Vedantix-stack."><div className="space-y-3 text-sm"><ProviderRow label="Websitehosting" value="Lovable" /><ProviderRow label="Source control" value="GitHub" /><ProviderRow label="Database & Auth" value="Supabase" /><ProviderRow label="E-mail" value="Migadu" /><ProviderRow label="DNS Vedantix" value={domains[0]?.dns_provider || "Nog onbekend"} /><ProviderRow label="Website records" value={`${websites.length} gekoppeld`} /></div></Panel>
      </div>
    </div>
  );
}

function ProviderRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0"><span className="text-slate-500">{label}</span><strong>{value}</strong></div>;
}

function CustomersModule({ customers, showForm, onDone }: { customers: Customer[]; showForm: boolean; onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      await createCustomer({ company_name: String(form.get("company_name") || ""), contact_name: String(form.get("contact_name") || "") || null, email: String(form.get("email") || "") || null, status: "ACTIVE" });
      event.currentTarget.reset();
      await onDone();
    } finally { setBusy(false); }
  }
  return <div className="space-y-5">{showForm ? <Panel title="Nieuwe klant"><form className="grid gap-4 md:grid-cols-2" onSubmit={submit}><Input name="company_name" label="Bedrijfsnaam" required /><Input name="contact_name" label="Contactpersoon" /><Input name="email" label="E-mail" type="email" /><div className="flex items-end"><button disabled={busy} className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">{busy ? "Opslaan…" : "Klant opslaan"}</button></div></form></Panel> : null}<Panel title="Klantenregister" subtitle={`${customers.length} klant(en)`}>{customers.length === 0 ? <Empty>Nog geen klanten.</Empty> : <div className="space-y-2">{customers.map((customer) => <div key={customer.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"><div><strong className="text-sm">{customer.company_name}</strong><span className="block text-xs text-slate-400">{customer.email || customer.contact_name || "—"}</span></div><div className="flex items-center gap-2"><Badge tone={customer.status === "ACTIVE" ? "success" : "neutral"}>{customer.status}</Badge><button type="button" onClick={async () => { if (confirm(`Klant ${customer.company_name} verwijderen? Gekoppelde domeinen en websites worden ook verwijderd.`)) { await deleteCustomer(customer.id); await onDone(); } }} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div></div>)}</div>}</Panel></div>;
}

function DomainsModule({ domains, customers, showForm, onDone }: { domains: Domain[]; customers: Customer[]; showForm: boolean; onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      const provider = String(form.get("email_provider") || "") || null;
      await createDomain({ customer_id: String(form.get("customer_id")), domain_name: String(form.get("domain_name")), registrar: String(form.get("registrar") || "") || null, dns_provider: String(form.get("dns_provider") || "") || null, email_provider: provider, status: "UNKNOWN" });
      event.currentTarget.reset();
      await onDone();
    } finally { setBusy(false); }
  }
  const customerName = (id: string) => customers.find((customer) => customer.id === id)?.company_name || "Onbekend";
  return <div className="space-y-5">{showForm ? <Panel title="Domein toevoegen"><form className="grid gap-4 md:grid-cols-2" onSubmit={submit}><label className="text-sm font-medium">Klant<select name="customer_id" required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="">Selecteer klant</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.company_name}</option>)}</select></label><Input name="domain_name" label="Domein" placeholder="voorbeeld.nl" required /><Input name="registrar" label="Registrar" /><Input name="dns_provider" label="DNS-provider" /><Input name="email_provider" label="E-mailprovider" placeholder="Migadu" /><div className="flex items-end"><button disabled={busy} className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">{busy ? "Opslaan…" : "Domein opslaan"}</button></div></form></Panel> : null}<Panel title="Domeinen" subtitle={`${domains.length} domein(en)`}>{domains.length === 0 ? <Empty>Nog geen domeinen.</Empty> : <div className="grid gap-3">{domains.map((domain) => <div key={domain.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"><div><strong className="text-sm">{domain.domain_name}</strong><span className="block text-xs text-slate-400">{customerName(domain.customer_id)} · {domain.dns_provider || "DNS onbekend"} · {domain.email_provider || "mail onbekend"}</span></div><div className="flex items-center gap-2"><Badge tone={domain.status === "HEALTHY" ? "success" : domain.status === "WARNING" ? "warning" : domain.status === "ERROR" ? "danger" : "neutral"}>{domain.status}</Badge><button type="button" onClick={async () => { if (confirm(`${domain.domain_name} verwijderen?`)) { await deleteDomain(domain.id); await onDone(); } }} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div></div>)}</div>}</Panel></div>;
}

function snapshotChecks(domain: Domain): DomainHealthCheck[] {
  const snapshot = domain.last_dns_snapshot as { checks?: DomainHealthCheck[] } | null;
  return Array.isArray(snapshot?.checks) ? snapshot.checks : [];
}

function HealthModule({ domains, onChanged }: { domains: Domain[]; onChanged: () => Promise<void> }) {
  const [scanning, setScanning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function scan(domain: Domain) {
    setScanning(domain.id);
    setMessage(null);
    try {
      const result = await scanDomainHealth(domain.id);
      setMessage(`${result.domain}: ${result.status}`);
      await onChanged();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Scan mislukt.");
    } finally {
      setScanning(null);
    }
  }

  return (
    <div className="space-y-5">
      <MailManagement domains={domains} onChanged={onChanged} />
      {message ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      {domains.length === 0 ? <Panel title="Domein-health"><Empty>Nog geen domeinen.</Empty></Panel> : domains.map((domain) => {
        const checks = snapshotChecks(domain);
        return (
          <Panel key={domain.id} title={domain.domain_name} subtitle={`${domain.email_provider || "Geen mailprovider"} · laatste scan ${domain.last_dns_snapshot_at ? new Date(domain.last_dns_snapshot_at).toLocaleString("nl-NL") : "nog niet uitgevoerd"}`}>
            <p className="mb-3 text-xs text-(--cc-muted)">Domeinen worden ook dagelijks automatisch gecontroleerd.</p>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <Badge tone={domain.status === "HEALTHY" ? "success" : domain.status === "WARNING" ? "warning" : domain.status === "ERROR" ? "danger" : "neutral"}>{domain.status}</Badge>
              <button type="button" onClick={() => scan(domain)} disabled={scanning === domain.id} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><ScanLine size={15} /> {scanning === domain.id ? "Scannen…" : "Scan opnieuw"}</button>
            </div>
            {checks.length === 0 ? <Empty>Nog geen automatische healthscan opgeslagen.</Empty> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{checks.map((check) => <div key={check.check_type} className="rounded-xl border border-slate-100 p-4"><div className="mb-2 flex items-center justify-between"><strong className="text-sm">{check.check_type}</strong><Badge tone={check.status === "PASS" ? "success" : check.status === "WARNING" || check.status === "UNKNOWN" ? "warning" : "danger"}>{check.status}</Badge></div><p className="text-xs leading-5 text-slate-500">{check.summary}</p></div>)}</div>}
          </Panel>
        );
      })}
    </div>
  );
}

function StaffModule() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [invites, setInvites] = useState<StaffInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function loadStaff() {
    setLoading(true);
    setMessage(null);
    try {
      const [nextStaff, nextInvites] = await Promise.all([listStaffUsers(), listStaffInvites()]);
      setStaff(nextStaff);
      setInvites(nextInvites);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Staff kon niet worden geladen.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "");
    const role = String(form.get("role") || "READ_ONLY") as StaffRole;
    try {
      await inviteStaff(email, role);
      event.currentTarget.reset();
      setMessage("Uitnodiging geregistreerd. Na bevestigde login wordt de rol automatisch geactiveerd.");
      await loadStaff();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Uitnodigen mislukt.");
    }
  }

  return (
    <div className="space-y-5">
      {message ? <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">{message}</div> : null}
      <Panel title="Staff uitnodigen" subtitle="Alleen admins kunnen uitnodigingen en rollen beheren.">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]" onSubmit={submit}>
          <Input name="email" label="E-mailadres" type="email" required />
          <label className="text-sm font-medium text-slate-700">Rol<select name="role" defaultValue="READ_ONLY" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="READ_ONLY">READ_ONLY</option><option value="OPERATOR">OPERATOR</option><option value="ADMIN">ADMIN</option></select></label>
          <div className="flex items-end"><button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">Uitnodigen</button></div>
        </form>
      </Panel>

      <Panel title="Actieve staff" subtitle={loading ? "Laden…" : `${staff.length} account(s)`}>
        {staff.length === 0 ? <Empty>Nog geen staff-accounts.</Empty> : <div className="space-y-3">{staff.map((user) => <div key={user.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"><div><strong className="text-sm">{user.user_id.slice(0, 8)}…</strong><span className="block text-xs text-slate-400">Aangemaakt {new Date(user.created_at).toLocaleDateString("nl-NL")}</span></div><div className="flex flex-wrap items-center gap-2"><select value={user.role} onChange={async (event) => { try { await updateStaffUser(user.user_id, { role: event.target.value as StaffRole }); await loadStaff(); } catch (err) { setMessage(err instanceof Error ? err.message : "Rol wijzigen mislukt."); } }} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs"><option value="READ_ONLY">READ_ONLY</option><option value="OPERATOR">OPERATOR</option><option value="ADMIN">ADMIN</option></select><button type="button" onClick={async () => { try { await updateStaffUser(user.user_id, { active: !user.active }); await loadStaff(); } catch (err) { setMessage(err instanceof Error ? err.message : "Status wijzigen mislukt."); } }} className={`rounded-lg px-3 py-2 text-xs font-semibold ${user.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{user.active ? "Actief" : "Inactief"}</button></div></div>)}</div>}
      </Panel>

      <Panel title="Uitnodigingen" subtitle="Openstaande en geaccepteerde staff-uitnodigingen.">
        {invites.length === 0 ? <Empty>Nog geen uitnodigingen.</Empty> : <div className="space-y-3">{invites.map((invite) => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"><div><strong className="text-sm">{invite.email}</strong><span className="block text-xs text-slate-400">{invite.accepted_at ? `Geaccepteerd ${new Date(invite.accepted_at).toLocaleString("nl-NL")}` : "Nog niet geaccepteerd"}</span></div><div className="flex items-center gap-2"><Badge tone={invite.accepted_at ? "success" : invite.active ? "warning" : "neutral"}>{invite.accepted_at ? "ACCEPTED" : invite.active ? "PENDING" : "CANCELLED"}</Badge><Badge>{invite.role}</Badge>{invite.active ? <button type="button" onClick={async () => { await cancelStaffInvite(invite.id); await loadStaff(); }} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button> : null}</div></div>)}</div>}
      </Panel>
    </div>
  );
}

function HealthLine({ label, ok, pending }: { label: string; ok: boolean; pending?: boolean }) {
  return <div className="flex items-center justify-between"><span className="text-slate-500">{label}</span><span className={`inline-flex items-center gap-1 text-xs font-medium ${ok ? "text-emerald-700" : pending ? "text-amber-700" : "text-slate-400"}`}>{ok ? <CheckCircle2 size={14} /> : pending ? <Activity size={14} /> : <CircleAlert size={14} />}{ok ? "OK" : pending ? "Bezig" : "Onbekend"}</span></div>;
}

void HealthLine;

function MonitoringModule() {
  const [migaduOpen, setMigaduOpen] = useState(false);
  const [migaduSaved, setMigaduSaved] = useState(false);

  function closeMigadu() {
    setMigaduOpen(false);
    if (migaduSaved) {
      setMigaduSaved(false);
      window.setTimeout(() => window.location.reload(), 50);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setMigaduOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Settings size={15} />
          Migadu instellen
        </button>
      </div>
      <MonitoringConsole embedded />
      <MigaduCredentialModal open={migaduOpen} onClose={closeMigadu} onSaved={() => setMigaduSaved(true)} />
    </div>
  );
}


