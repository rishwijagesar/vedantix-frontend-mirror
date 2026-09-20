import { supabase } from "@/lib/supabase";
import { MAIL_DNS_API } from "./mail-dns-endpoint";

export type DnsPlan = {
  domain: string;
  fingerprint: string;
  change_count: number;
  blockers: string[];
  records: { name: string; type: string; before: string[]; after: string[]; state: "create" | "update" | "unchanged" | "blocked"; note: string }[];
};
export async function dnsAction(action: "preview" | "apply" | "status", domainId: string, body: Record<string, string> = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) throw new Error("Log opnieuw in als Vedantix-beheerder.");
  let response: Response;
  try {
    response = await fetch(MAIL_DNS_API, {
      method: "POST", redirect: "error", cache: "no-store", signal: AbortSignal.timeout(35000),
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + data.session.access_token },
      body: JSON.stringify({ ...body, action, domain_id: domainId }),
    });
  } catch {
    throw new Error("Geen bevestiging ontvangen. Vernieuw eerst het DNS-voorstel om te controleren wat er is ingesteld.");
  }
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.ok !== true)
    throw new Error(result?.error || "De DNS-controle kon niet worden afgerond. Vernieuw eerst het voorstel.");
  return result;
}
