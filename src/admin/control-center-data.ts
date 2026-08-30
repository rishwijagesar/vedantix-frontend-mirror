import { supabase } from "@/lib/supabase";

export type CustomerStatus = "LEAD" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export type DomainStatus = "UNKNOWN" | "HEALTHY" | "WARNING" | "ERROR";
export type WebsiteStatus = "DRAFT" | "READY" | "LIVE" | "PAUSED" | "ERROR" | "ARCHIVED";

export type Customer = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  status: CustomerStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Domain = {
  id: string;
  customer_id: string;
  domain_name: string;
  registrar: string | null;
  dns_provider: string | null;
  email_provider: string | null;
  dkim_selectors: string[];
  status: DomainStatus;
  expires_at: string | null;
  auto_renew: boolean | null;
  last_dns_snapshot: unknown;
  last_dns_snapshot_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Website = {
  id: string;
  customer_id: string;
  domain_id: string | null;
  name: string;
  hosting_provider: string;
  github_repo: string | null;
  github_branch: string | null;
  lovable_project_id: string | null;
  production_url: string | null;
  preview_url: string | null;
  status: WebsiteStatus;
  last_deployed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Overview = {
  customers: number;
  domains: number;
  websites: number;
  checksNeedingAttention: number;
  lastMonitoringAt?: string | null;
  lastMonitoringStatus?: string | null;
};

export type MonitoringAlert = {
  id: string;
  domain_id: string;
  check_type: "DNS" | "MX" | "SPF" | "DKIM" | "DMARC" | "SSL" | "EXPIRY" | "WEBSITE";
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
  message: string;
  details: Record<string, unknown>;
  first_seen_at: string;
  last_seen_at: string;
  resolved_at: string | null;
};

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function getOverview(): Promise<Overview> {
  const [customers, domains, websites, alerts, latestMonitoring] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("domains").select("id", { count: "exact", head: true }),
    supabase.from("websites").select("id", { count: "exact", head: true }),
    supabase.from("monitoring_alerts").select("id", { count: "exact", head: true }).in("status", ["OPEN", "ACKNOWLEDGED"]),
    supabase
      .from("automation_runs")
      .select("status,finished_at,created_at,output")
      .eq("automation_type", "DOMAIN_HEALTH_MONITOR")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  [customers, domains, websites, alerts, latestMonitoring].forEach((result) => throwIfError(result.error));

  const run = latestMonitoring.data as { status?: string; finished_at?: string | null; created_at?: string | null; output?: { overall_status?: string } | null } | null;

  return {
    customers: customers.count ?? 0,
    domains: domains.count ?? 0,
    websites: websites.count ?? 0,
    checksNeedingAttention: alerts.count ?? 0,
    lastMonitoringAt: run?.finished_at ?? run?.created_at ?? null,
    lastMonitoringStatus: run?.output?.overall_status ?? run?.status ?? null,
  };
}

export async function listMonitoringAlerts(): Promise<MonitoringAlert[]> {
  const { data, error } = await supabase
    .from("monitoring_alerts")
    .select("*")
    .in("status", ["OPEN", "ACKNOWLEDGED"])
    .order("severity", { ascending: false })
    .order("last_seen_at", { ascending: false });
  throwIfError(error);
  return (data ?? []) as MonitoringAlert[];
}

export async function listCustomers(): Promise<Customer[]> {
  const { data, error } = await supabase.from("customers").select("*").order("company_name");
  throwIfError(error);
  return (data ?? []) as Customer[];
}

export async function createCustomer(input: {
  company_name: string;
  contact_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: CustomerStatus;
  notes?: string | null;
}): Promise<Customer> {
  const { data, error } = await supabase.from("customers").insert(input).select("*").single();
  throwIfError(error);
  return data as Customer;
}

export async function updateCustomer(id: string, changes: Partial<Omit<Customer, "id" | "created_at" | "updated_at">>): Promise<Customer> {
  const { data, error } = await supabase.from("customers").update(changes).eq("id", id).select("*").single();
  throwIfError(error);
  return data as Customer;
}

export async function deleteCustomer(id: string): Promise<void> {
  const { error } = await supabase.from("customers").delete().eq("id", id);
  throwIfError(error);
}

export async function listDomains(): Promise<Domain[]> {
  const { data, error } = await supabase.from("domains").select("*").order("domain_name");
  throwIfError(error);
  return (data ?? []) as Domain[];
}

export async function createDomain(input: {
  customer_id: string;
  domain_name: string;
  registrar?: string | null;
  dns_provider?: string | null;
  email_provider?: string | null;
  dkim_selectors?: string[];
  status?: DomainStatus;
}): Promise<Domain> {
  const normalized = { ...input, domain_name: input.domain_name.trim().toLowerCase() };
  const { data, error } = await supabase.from("domains").insert(normalized).select("*").single();
  throwIfError(error);
  return data as Domain;
}

export async function updateDomain(id: string, changes: Partial<Omit<Domain, "id" | "created_at" | "updated_at">>): Promise<Domain> {
  const { data, error } = await supabase.from("domains").update(changes).eq("id", id).select("*").single();
  throwIfError(error);
  return data as Domain;
}

export async function deleteDomain(id: string): Promise<void> {
  const { error } = await supabase.from("domains").delete().eq("id", id);
  throwIfError(error);
}

export async function listWebsites(): Promise<Website[]> {
  const { data, error } = await supabase.from("websites").select("*").order("name");
  throwIfError(error);
  return (data ?? []) as Website[];
}

export async function createWebsite(input: {
  customer_id: string;
  domain_id?: string | null;
  name: string;
  hosting_provider?: string;
  github_repo?: string | null;
  github_branch?: string | null;
  lovable_project_id?: string | null;
  production_url?: string | null;
  preview_url?: string | null;
  status?: WebsiteStatus;
}): Promise<Website> {
  const { data, error } = await supabase.from("websites").insert(input).select("*").single();
  throwIfError(error);
  return data as Website;
}

export async function updateWebsite(id: string, changes: Partial<Omit<Website, "id" | "created_at" | "updated_at">>): Promise<Website> {
  const { data, error } = await supabase.from("websites").update(changes).eq("id", id).select("*").single();
  throwIfError(error);
  return data as Website;
}

export async function deleteWebsite(id: string): Promise<void> {
  const { error } = await supabase.from("websites").delete().eq("id", id);
  throwIfError(error);
}
