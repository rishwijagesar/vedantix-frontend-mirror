import { supabase } from "@/lib/supabase";

export type DomainHealthCheck = {
  check_type: "DNS" | "MX" | "SPF" | "DKIM" | "DMARC" | "SSL" | "EXPIRY" | "WEBSITE";
  status: "PASS" | "WARNING" | "FAIL" | "UNKNOWN";
  summary: string;
  details?: Record<string, unknown>;
};

export type DomainHealthResult = {
  domain: string;
  status: "HEALTHY" | "WARNING" | "ERROR";
  checks: DomainHealthCheck[];
};

export async function scanDomainHealth(domainId: string): Promise<DomainHealthResult> {
  const { data, error } = await supabase.functions.invoke<DomainHealthResult>("domain-health-scan", {
    body: { domain_id: domainId },
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("De domeinscan gaf geen resultaat terug.");
  return data;
}
