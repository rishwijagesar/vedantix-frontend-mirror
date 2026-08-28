import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type DnsAnswer = { name?: string; type?: number; TTL?: number; data?: string };
type DnsResponse = { Status?: number; Answer?: DnsAnswer[] };
type Check = {
  check_type: "DNS" | "MX" | "SPF" | "DKIM" | "DMARC" | "SSL" | "EXPIRY" | "WEBSITE";
  status: "PASS" | "WARNING" | "FAIL" | "UNKNOWN";
  summary: string;
  details?: Record<string, unknown>;
};

const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

function normalizeDomain(input: string) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
}

async function dnsResolve(name: string, type: string): Promise<DnsResponse> {
  const url = new URL("https://dns.google/resolve");
  url.searchParams.set("name", name);
  url.searchParams.set("type", type);
  const response = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!response.ok) throw new Error(`DNS resolver returned ${response.status}`);
  return (await response.json()) as DnsResponse;
}

function answerValues(response: DnsResponse) {
  return (response.Answer ?? []).map((item) => String(item.data ?? "").trim()).filter(Boolean);
}

function txtValues(response: DnsResponse) {
  return answerValues(response).map((value) => value.replace(/^"|"$/g, "").replace(/"\s+"/g, ""));
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const authHeader = request.headers.get("Authorization");
  if (!supabaseUrl || !anonKey || !authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(authHeader.replace(/^Bearer\s+/i, ""));
  if (claimsError || !claimsData?.claims?.sub) {
    return new Response(JSON.stringify({ error: "Invalid session" }), { status: 401, headers: jsonHeaders });
  }

  let body: { domain_id?: string };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: jsonHeaders });
  }

  if (!body.domain_id) {
    return new Response(JSON.stringify({ error: "domain_id is required" }), { status: 400, headers: jsonHeaders });
  }

  const { data: domain, error: domainError } = await supabase
    .from("domains")
    .select("id, domain_name, email_provider")
    .eq("id", body.domain_id)
    .single();

  if (domainError || !domain) {
    return new Response(JSON.stringify({ error: "Domain not found or access denied" }), { status: 404, headers: jsonHeaders });
  }

  const domainName = normalizeDomain(domain.domain_name);
  const checks: Check[] = [];

  try {
    const [mx, txt, dmarc, a, aaaa] = await Promise.all([
      dnsResolve(domainName, "MX"),
      dnsResolve(domainName, "TXT"),
      dnsResolve(`_dmarc.${domainName}`, "TXT"),
      dnsResolve(domainName, "A"),
      dnsResolve(domainName, "AAAA"),
    ]);

    const mxRecords = answerValues(mx);
    const txtRecords = txtValues(txt);
    const dmarcRecords = txtValues(dmarc).filter((record) => /^v=DMARC1\b/i.test(record));
    const spfRecords = txtRecords.filter((record) => /^v=spf1\b/i.test(record));
    const addresses = [...answerValues(a), ...answerValues(aaaa)];

    checks.push({
      check_type: "DNS",
      status: addresses.length > 0 ? "PASS" : "WARNING",
      summary: addresses.length > 0 ? "Website-DNS resolveert" : "Geen A- of AAAA-record gevonden",
      details: { addresses },
    });

    checks.push({
      check_type: "MX",
      status: mxRecords.length > 0 ? "PASS" : "FAIL",
      summary: mxRecords.length > 0 ? `${mxRecords.length} MX-record(s) gepubliceerd` : "Geen MX-record gevonden",
      details: {
        records: mxRecords,
        detected_provider: mxRecords.some((value) => value.includes("migadu.com")) ? "Migadu" : null,
      },
    });

    checks.push({
      check_type: "SPF",
      status: spfRecords.length === 1 ? "PASS" : spfRecords.length > 1 ? "WARNING" : "FAIL",
      summary: spfRecords.length === 1 ? "SPF-record gevonden" : spfRecords.length > 1 ? "Meerdere SPF-records gevonden" : "Geen SPF-record gevonden",
      details: { records: spfRecords },
    });

    const dmarcRecord = dmarcRecords[0] ?? null;
    const policy = dmarcRecord?.match(/(?:^|;)\s*p=([^;\s]+)/i)?.[1]?.toLowerCase() ?? null;
    checks.push({
      check_type: "DMARC",
      status: !dmarcRecord ? "FAIL" : policy === "reject" || policy === "quarantine" ? "PASS" : "WARNING",
      summary: !dmarcRecord ? "Geen DMARC-record gevonden" : `DMARC policy: ${policy ?? "onbekend"}`,
      details: { record: dmarcRecord, policy },
    });

    checks.push({
      check_type: "DKIM",
      status: "UNKNOWN",
      summary: "DKIM vereist de selector van de mailprovider",
      details: { email_provider: domain.email_provider ?? null },
    });
  } catch (error) {
    checks.push({
      check_type: "DNS",
      status: "FAIL",
      summary: "DNS-scan kon niet worden voltooid",
      details: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  const rows = checks.map((check) => ({
    domain_id: domain.id,
    check_type: check.check_type,
    status: check.status,
    summary: check.summary,
    details: check.details ?? {},
    checked_at: new Date().toISOString(),
  }));

  const { error: insertError } = await supabase.from("domain_checks").insert(rows);
  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: jsonHeaders });
  }

  const overall = checks.some((check) => check.status === "FAIL")
    ? "ERROR"
    : checks.some((check) => check.status === "WARNING" || check.status === "UNKNOWN")
      ? "WARNING"
      : "HEALTHY";

  const { error: updateError } = await supabase
    .from("domains")
    .update({
      status: overall,
      last_dns_snapshot: { checks, source: "domain-health-scan" },
      last_dns_snapshot_at: new Date().toISOString(),
    })
    .eq("id", domain.id);

  if (updateError) {
    return new Response(JSON.stringify({ error: updateError.message }), { status: 500, headers: jsonHeaders });
  }

  return new Response(JSON.stringify({ domain: domainName, status: overall, checks }), { status: 200, headers: jsonHeaders });
});
