import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  CheckCircle2,
  CircleAlert,
  Globe2,
  LayoutDashboard,
  LogOut,
  Mail,
  MonitorSmartphone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  createCustomer,
  createDomain,
  createWebsite,
  deleteCustomer,
  deleteDomain,
  deleteWebsite,
  getOverview,
  listCustomers,
  listDomains,
  listWebsites,
  type Customer,
  type Domain,
  type Overview,
  type Website,
} from "./control-center-data";
import "./control-center.css";

type Section = "dashboard" | "customers" | "domains" | "websites" | "email";

const sections: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "customers", label: "Klanten", icon: Users },
  { id: "domains", label: "Domeinen", icon: Globe2 },
  { id: "websites", label: "Websites", icon: MonitorSmartphone },
  { id: "email", label: "E-mail & DNS", icon: Mail },
];

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

export default function AdminControlCenterV2() {
  const [section, setSection] = useState<Section>("dashboard");
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
    for (const domain of domains) {
      map.set(domain.customer_id, [...(map.get(domain.customer_id) ?? []), domain]);
    }
    return map;
  }, [domains]);

  const activeTitle = {
    dashboard: ["Control Center", "Operationeel overzicht van Vedantix en klantinfrastructuur."],
    customers: ["Klanten", "Centrale eigenaar van domeinen, websites en integraties."],
    domains: ["Domeinen", "DNS, e-mailprovider, status en technische gezondheid."],
    websites: ["Websites", "GitHub-, Lovable- en domeinkoppelingen per website."],
    email: ["E-mail & DNS", "Migadu, SPF, DKIM, DMARC en DNS-health."],
  }[section];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-slate-950 p-5 text-white md:flex md:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-slate-950">V</div>
            <div>
              <strong className="block text-sm">Vedantix</strong>
              <span className="text-xs text-slate-400">Control Center</span>
            </div>
          </div>
          <nav className="space-y-1">
            {sections.map((item) => {
              const Icon = item.icon;
              const active = item.id === section;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setSection(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-400">
            <div className="mb-1 flex items-center gap-2 text-emerald-300"><ShieldCheck size={14} /> Beveiligd met Supabase Auth</div>
            Alleen staff-accounts hebben toegang.
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-7">
            <div>
              <span className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400">Vedantix Operations</span>
              <strong className="block text-sm md:hidden">{activeTitle[0]}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Vernieuwen
              </button>
              <button type="button" onClick={() => supabase.auth.signOut()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50">
                <LogOut size={14} /> Uitloggen
              </button>
            </div>
          </header>

          <main className="mx-auto max-w-7xl p-4 md:p-7">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Vedantix Admin v2</span>
                <h1 className="mt-1 text-3xl font-bold tracking-tight">{activeTitle[0]}</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-500">{activeTitle[1]}</p>
              </div>
              {section !== "dashboard" && section !== "email" ? (
                <button type="button" onClick={() => setShowForm((value) => !value)} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                  <Plus size={16} /> Nieuwe toevoegen
                </button>
              ) : null}
            </div>

            {error ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            {section === "dashboard" ? <Dashboard overview={overview} customers={customers} domains={domains} websites={websites} loading={loading} /> : null}
            {section === "customers" ? <CustomersModule customers={customers} showForm={showForm} onDone={async () => { setShowForm(false); await load(); }} /> : null}
            {section === "domains" ? <DomainsModule domains={domains} customers={customers} showForm={showForm} onDone={async () => { setShowForm(false); await load(); }} /> : null}
            {section === "websites" ? <WebsitesModule websites={websites} customers={customers} domainsByCustomer={domainsByCustomer} showForm={showForm} onDone={async () => { setShowForm(false); await load(); }} /> : null}
            {section === "email" ? <EmailModule domains={domains} /> : null}
          </main>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ overview, customers, domains, websites, loading }: { overview: Overview; customers: Customer[]; domains: Domain[]; websites: Website[]; loading: boolean }) {
  const cards = [
    ["Klanten", overview.customers, Users, "Actieve en historische klantrecords"],
    ["Domeinen", overview.domains, Globe2, "DNS- en mailconfiguraties"],
    ["Websites", overview.websites, MonitorSmartphone, "GitHub/Lovable-projecten"],
    ["Acties nodig", overview.checksNeedingAttention, CircleAlert, "Warnings en failures"],
  ] as const;
  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, caption]) => (
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={label}>
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100"><Icon size={18} /></div>
            <p className="text-sm text-slate-500">{label}</p>
            <strong className="mt-1 block text-3xl font-bold">{loading ? "—" : value}</strong>
            <span className="mt-1 block text-xs text-slate-400">{caption}</span>
          </article>
        ))}
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Beheerde omgeving" subtitle="Echte data uit Supabase; geen demo-records.">
          {customers.length === 0 ? <Empty>Nog geen klanten.</Empty> : (
            <div className="space-y-3">
              {customers.slice(0, 6).map((customer) => (
                <div key={customer.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
                  <div>
                    <strong className="text-sm">{customer.company_name}</strong>
                    <span className="mt-0.5 block text-xs text-slate-400">{customer.email || "Geen e-mail"}</span>
                  </div>
                  <Badge tone={customer.status === "ACTIVE" ? "success" : "neutral"}>{customer.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </Panel>
        <Panel title="Providerstatus" subtitle="Huidige standaardstack voor Vedantix.">
          <div className="space-y-3 text-sm">
            <ProviderRow label="Websitehosting" value="Lovable" />
            <ProviderRow label="Source control" value="GitHub" />
            <ProviderRow label="Database & Auth" value="Supabase" />
            <ProviderRow label="E-mail" value="Migadu" />
            <ProviderRow label="DNS Vedantix" value={domains[0]?.dns_provider || "Nog onbekend"} />
            <ProviderRow label="Website records" value={`${websites.length} gekoppeld`} />
          </div>
        </Panel>
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
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      await createCustomer({ company_name: String(form.get("company_name") || ""), contact_name: String(form.get("contact_name") || "") || null, email: String(form.get("email") || "") || null, status: "ACTIVE" });
      event.currentTarget.reset(); await onDone();
    } finally { setBusy(false); }
  }
  return <div className="space-y-5">{showForm ? <Panel title="Nieuwe klant"><form className="grid gap-4 md:grid-cols-2" onSubmit={submit}><Input name="company_name" label="Bedrijfsnaam" required /><Input name="contact_name" label="Contactpersoon" /><Input name="email" label="E-mail" type="email" /><div className="flex items-end"><button disabled={busy} className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">{busy ? "Opslaan…" : "Klant opslaan"}</button></div></form></Panel> : null}<Panel title="Klantenregister" subtitle={`${customers.length} klant(en)`}>{customers.length === 0 ? <Empty>Nog geen klanten.</Empty> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-400"><tr><th className="pb-3">Klant</th><th className="pb-3">Contact</th><th className="pb-3">Status</th><th /></tr></thead><tbody>{customers.map((customer) => <tr className="border-t border-slate-100" key={customer.id}><td className="py-3 font-medium">{customer.company_name}</td><td className="py-3 text-slate-500">{customer.email || customer.contact_name || "—"}</td><td className="py-3"><Badge tone={customer.status === "ACTIVE" ? "success" : "neutral"}>{customer.status}</Badge></td><td className="py-3 text-right"><button title="Verwijderen" onClick={async () => { if (confirm(`Klant ${customer.company_name} verwijderen? Gekoppelde domeinen en websites worden ook verwijderd.`)) { await deleteCustomer(customer.id); await onDone(); } }} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>}</Panel></div>;
}

function DomainsModule({ domains, customers, showForm, onDone }: { domains: Domain[]; customers: Customer[]; showForm: boolean; onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      await createDomain({ customer_id: String(form.get("customer_id")), domain_name: String(form.get("domain_name")), registrar: String(form.get("registrar") || "") || null, dns_provider: String(form.get("dns_provider") || "") || null, email_provider: String(form.get("email_provider") || "") || null, status: "UNKNOWN" });
      event.currentTarget.reset(); await onDone();
    } finally { setBusy(false); }
  }
  const customerName = (id: string) => customers.find((customer) => customer.id === id)?.company_name || "Onbekend";
  return <div className="space-y-5">{showForm ? <Panel title="Domein toevoegen"><form className="grid gap-4 md:grid-cols-2" onSubmit={submit}><label className="text-sm font-medium">Klant<select name="customer_id" required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="">Selecteer klant</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.company_name}</option>)}</select></label><Input name="domain_name" label="Domein" placeholder="voorbeeld.nl" required /><Input name="registrar" label="Registrar" /><Input name="dns_provider" label="DNS-provider" /><Input name="email_provider" label="E-mailprovider" /><div className="flex items-end"><button disabled={busy} className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">{busy ? "Opslaan…" : "Domein opslaan"}</button></div></form></Panel> : null}<Panel title="Domeinen" subtitle={`${domains.length} domein(en)`}>{domains.length === 0 ? <Empty>Nog geen domeinen.</Empty> : <div className="grid gap-3">{domains.map((domain) => <div key={domain.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"><div><strong className="text-sm">{domain.domain_name}</strong><span className="block text-xs text-slate-400">{customerName(domain.customer_id)} · {domain.dns_provider || "DNS onbekend"} · {domain.email_provider || "mail onbekend"}</span></div><div className="flex items-center gap-2"><Badge tone={domain.status === "HEALTHY" ? "success" : domain.status === "WARNING" ? "warning" : "neutral"}>{domain.status}</Badge><button onClick={async () => { if (confirm(`${domain.domain_name} verwijderen?`)) { await deleteDomain(domain.id); await onDone(); } }} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div></div>)}</div>}</Panel></div>;
}

function WebsitesModule({ websites, customers, domainsByCustomer, showForm, onDone }: { websites: Website[]; customers: Customer[]; domainsByCustomer: Map<string, Domain[]>; showForm: boolean; onDone: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [customerId, setCustomerId] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    try {
      const form = new FormData(event.currentTarget);
      await createWebsite({ customer_id: String(form.get("customer_id")), domain_id: String(form.get("domain_id") || "") || null, name: String(form.get("name")), github_repo: String(form.get("github_repo") || "") || null, lovable_project_id: String(form.get("lovable_project_id") || "") || null, production_url: String(form.get("production_url") || "") || null, status: "DRAFT" });
      event.currentTarget.reset(); setCustomerId(""); await onDone();
    } finally { setBusy(false); }
  }
  return <div className="space-y-5">{showForm ? <Panel title="Website koppelen"><form className="grid gap-4 md:grid-cols-2" onSubmit={submit}><label className="text-sm font-medium">Klant<select name="customer_id" value={customerId} onChange={(event) => setCustomerId(event.target.value)} required className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="">Selecteer klant</option>{customers.map((customer) => <option value={customer.id} key={customer.id}>{customer.company_name}</option>)}</select></label><label className="text-sm font-medium">Domein<select name="domain_id" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5"><option value="">Geen domein</option>{(domainsByCustomer.get(customerId) ?? []).map((domain) => <option value={domain.id} key={domain.id}>{domain.domain_name}</option>)}</select></label><Input name="name" label="Naam" required /><Input name="github_repo" label="GitHub repository" placeholder="owner/repo" /><Input name="lovable_project_id" label="Lovable project ID" /><Input name="production_url" label="Productie-URL" type="url" /><div className="md:col-span-2"><button disabled={busy} className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white">{busy ? "Opslaan…" : "Website koppelen"}</button></div></form></Panel> : null}<Panel title="Websites" subtitle={`${websites.length} website(s)`}>{websites.length === 0 ? <Empty>Nog geen websites.</Empty> : <div className="grid gap-3">{websites.map((website) => <div key={website.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"><div><strong className="text-sm">{website.name}</strong><span className="block text-xs text-slate-400">{website.github_repo || "Geen repo"} · {website.hosting_provider}</span></div><div className="flex items-center gap-2"><Badge tone={website.status === "LIVE" || website.status === "READY" ? "success" : "neutral"}>{website.status}</Badge><button onClick={async () => { if (confirm(`${website.name} verwijderen?`)) { await deleteWebsite(website.id); await onDone(); } }} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button></div></div>)}</div>}</Panel></div>;
}

function EmailModule({ domains }: { domains: Domain[] }) {
  return <div className="space-y-5"><Panel title="E-mail & DNS health" subtitle="DNS Doctor snapshot + providermetadata uit het Control Center.">{domains.length === 0 ? <Empty>Nog geen domeinen.</Empty> : <div className="grid gap-4 md:grid-cols-2">{domains.map((domain) => <div key={domain.id} className="rounded-xl border border-slate-100 p-4"><div className="mb-4 flex items-start justify-between"><div><strong>{domain.domain_name}</strong><span className="block text-xs text-slate-400">{domain.email_provider || "Geen mailprovider"}</span></div><Badge tone={domain.status === "HEALTHY" ? "success" : "warning"}>{domain.status}</Badge></div><div className="space-y-2 text-sm"><HealthLine label="MX" ok={Boolean(domain.email_provider)} /><HealthLine label="DNS snapshot" ok={Boolean(domain.last_dns_snapshot_at)} /><HealthLine label="Website/DNS scheiding" ok /><HealthLine label="Automatische monitoring" ok={false} pending /></div></div>)}</div>}</Panel><Panel title="Vedantix actuele scan" subtitle="Laatste bekende scan voor vedantix.nl."><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><HealthCard label="SPF" status="pass" text="v=spf1 include:spf.migadu.com -all" /><HealthCard label="DMARC" status="pass" text="p=quarantine" /><HealthCard label="MX" status="pass" text="Migadu (2 records)" /><HealthCard label="DKIM" status="unknown" text="Custom selector nog te controleren" /><HealthCard label="TLS" status="pass" text="Geldig t/m 12 maart 2027" /><HealthCard label="Hardening" status="warning" text="DNSSEC / MTA-STS / TLS-RPT ontbreken" /></div></Panel></div>;
}

function HealthLine({ label, ok, pending }: { label: string; ok: boolean; pending?: boolean }) {
  return <div className="flex items-center justify-between"><span className="text-slate-500">{label}</span><span className={`inline-flex items-center gap-1 text-xs font-medium ${ok ? "text-emerald-700" : pending ? "text-amber-700" : "text-slate-400"}`}>{ok ? <CheckCircle2 size={14} /> : pending ? <Activity size={14} /> : <CircleAlert size={14} />}{ok ? "OK" : pending ? "Nog niet actief" : "Onbekend"}</span></div>;
}

function HealthCard({ label, status, text }: { label: string; status: "pass" | "warning" | "unknown"; text: string }) {
  return <div className="rounded-xl border border-slate-100 p-4"><div className="mb-2 flex items-center justify-between"><strong className="text-sm">{label}</strong><Badge tone={status === "pass" ? "success" : status === "warning" ? "warning" : "neutral"}>{status.toUpperCase()}</Badge></div><p className="text-xs leading-5 text-slate-500">{text}</p></div>;
}

function Input({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return <label className="text-sm font-medium text-slate-700">{label}<input name={name} type={type} required={required} placeholder={placeholder} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100" /></label>;
}
