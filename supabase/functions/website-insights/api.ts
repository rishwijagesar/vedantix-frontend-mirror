export class InsightsError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export type Credentials = { client_email: string; private_key: string; type: "service_account" };
export type GoogleApi = (service: "admin" | "admin-alpha" | "data", path: string, method?: string, body?: unknown) => Promise<any>;
export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function identifier(value: unknown, type: "accounts" | "properties") {
  if (typeof value !== "string" || !new RegExp("^" + type + "/[0-9]+$").test(value)) throw new InsightsError("Selecteer een geldige Google-meetomgeving of account.");
  return value;
}
export function streamIdentifier(value: unknown, property: string) {
  if (typeof value !== "string" || !new RegExp("^" + property + "/dataStreams/[0-9]+$").test(value)) throw new InsightsError("Selecteer de webgegevensstream van deze meetomgeving.");
  return value;
}
export function label(value: unknown, max = 100) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) throw new InsightsError("Vul een geldige naam in (maximaal " + max + " tekens).");
  return value.trim();
}
export function websiteUrl(value: unknown) {
  let url: URL;
  try { url = new URL(String(value)); } catch { throw new InsightsError("Stel eerst een geldige productie-URL in bij deze website."); }
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.port || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i.test(url.hostname) || /\.(?:localhost|local|internal|test|invalid|example)$/i.test(url.hostname)) throw new InsightsError("Gebruik een openbare website-URL zonder inloggegevens of poortnummer.");
  url.hash = ""; return url;
}
export function measurementUrl(production: string, path: unknown) {
  const base = websiteUrl(production);
  if (typeof path !== "string" || !path.startsWith("/") || path.length > 1000 || /[\\#]/.test(path)) throw new InsightsError("Gebruik een paginapad zoals / of /contact.");
  const url = new URL(path, base);
  if (url.origin !== base.origin) throw new InsightsError("Meet alleen pagina’s van deze website.");
  return url.href;
}
export function credentials(value: unknown): Credentials {
  let obj: any = value;
  if (typeof value === "string") { try { obj = JSON.parse(value); } catch { throw new InsightsError("Upload het JSON-sleutelbestand van het Google-serviceaccount."); } }
  if (obj?.type !== "service_account" || typeof obj.client_email !== "string" || !/^[a-z0-9._-]+@[a-z0-9.-]+\.iam\.gserviceaccount\.com$/.test(obj.client_email) || typeof obj.private_key !== "string" || obj.private_key.length > 10000 || !obj.private_key.startsWith("-----BEGIN PRIVATE KEY-----")) throw new InsightsError("Dit is geen geldig Google-serviceaccountbestand.");
  // Ignore caller-supplied token_uri, project URLs, and all unrelated fields.
  return { type: "service_account", client_email: obj.client_email, private_key: obj.private_key };
}
const base64url = (bytes: Uint8Array) => btoa(Array.from(bytes, b => String.fromCharCode(b)).join("")).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
export async function createGoogleClient(secret: Credentials, transport: typeof fetch = fetch): Promise<GoogleApi> {
  const encode = (value: unknown) => base64url(new TextEncoder().encode(JSON.stringify(value)));
  const now = Math.floor(Date.now() / 1000);
  const unsigned = encode({ alg: "RS256", typ: "JWT" }) + "." + encode({ iss: secret.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/analytics.edit", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  let key: CryptoKey;
  try {
    const pem = secret.private_key.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
    key = await crypto.subtle.importKey("pkcs8", Uint8Array.from(atob(pem), c => c.charCodeAt(0)), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  } catch { throw new InsightsError("Google-sleutel kan niet worden gelezen. Upload een nieuw JSON-sleutelbestand."); }
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  let tokenResponse: Response;
  try { tokenResponse = await transport("https://oauth2.googleapis.com/token", { method: "POST", redirect: "error", signal: AbortSignal.timeout(20000), headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: unsigned + "." + base64url(new Uint8Array(signature)) }) }); }
  catch { throw new InsightsError("Google is tijdelijk niet bereikbaar.", 502); }
  if (!tokenResponse.ok) throw new InsightsError("Google weigert de sleutel. Controleer of het serviceaccount en de sleutel nog actief zijn.", 403);
  const token = await tokenResponse.json();
  if (typeof token.access_token !== "string" || !token.access_token) throw new InsightsError("Google gaf geen toegangstoken terug.", 502);
  return async (service, path, method = "GET", body) => {
    if (!/^(accounts|properties|accountSummaries)(?:[/?]|$)/.test(path) || path.includes("..") || /[\r\n#]/.test(path)) throw new InsightsError("Ongeldig Google-verzoek.");
    const origin = service === "admin" ? "https://analyticsadmin.googleapis.com/v1beta/" : service === "admin-alpha" ? "https://analyticsadmin.googleapis.com/v1alpha/" : "https://analyticsdata.googleapis.com/v1beta/";
    let response: Response;
    try { response = await transport(origin + path, { method, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(25000), headers: { Authorization: "Bearer " + token.access_token, "Content-Type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }); }
    catch { throw new InsightsError("Geen bevestiging van Google ontvangen. Controleer het overzicht voordat je opnieuw iets aanmaakt of verwijdert.", 502); }
    if (!response.ok) {
      if (response.status === 403) throw new InsightsError("Google weigert toegang. Activeer de Analytics Admin API en Data API en geef het serviceaccount de rol Bewerker in dit Analytics-account.", 403);
      if (response.status === 404) throw new InsightsError("Deze Google-meetomgeving bestaat niet of is niet toegankelijk.", 404);
      if (response.status === 429) throw new InsightsError("Google heeft de aanvraaglimiet bereikt. Probeer later opnieuw.", 429);
      throw new InsightsError("Google heeft het verzoek niet verwerkt (HTTP " + response.status + "). Controleer de gegevens en vernieuw het overzicht.", 502);
    }
    if (response.status === 204) return null;
    const text = await response.text();
    if (!text) return null;
    try { return JSON.parse(text); } catch { throw new InsightsError("Google gaf geen leesbaar antwoord.", 502); }
  };
}
export async function googleList(api: GoogleApi, path: string, key: string) {
  const rows: any[] = []; const seen = new Set<string>(); let page = "";
  do {
    const value = await api("admin", path + (path.includes("?") ? "&" : "?") + "pageSize=100" + (page ? "&pageToken=" + encodeURIComponent(page) : ""));
    if (!value || (value[key] != null && !Array.isArray(value[key]))) throw new InsightsError("Google gaf geen volledig overzicht.", 502);
    rows.push(...(value[key] || [])); page = value.nextPageToken || "";
    if (page && (seen.has(page) || seen.size >= 50)) throw new InsightsError("Het Google-overzicht is te groot of onvolledig. Probeer een kleiner account.", 502);
    seen.add(page);
  } while (page);
  return rows;
}
export function safeProperty(value: any) { return { name: identifier(value?.name, "properties"), displayName: String(value.displayName || ""), timeZone: String(value.timeZone || ""), currencyCode: String(value.currencyCode || ""), account: String(value.account || ""), trashed: Boolean(value.deleteTime) }; }
export function safeStream(value: any) { return { name: String(value?.name || ""), displayName: String(value?.displayName || ""), type: value?.type, measurementId: String(value?.webStreamData?.measurementId || ""), defaultUri: String(value?.webStreamData?.defaultUri || "") }; }
export function propertyInput(body: any) {
  const displayName = label(body.display_name);
  const timeZone = String(body.time_zone || "Europe/Amsterdam");
  try { new Intl.DateTimeFormat("en", { timeZone }); } catch { throw new InsightsError("Kies een geldige tijdzone."); }
  const currencyCode = String(body.currency_code || "EUR").toUpperCase();
  if (!["EUR", "USD", "GBP", "CHF", "CAD", "AUD"].includes(currencyCode)) throw new InsightsError("Kies een ondersteunde valuta.");
  return { displayName, timeZone, currencyCode };
}
export function normalizeAgentic(lh: any) {
  const category = lh.categories?.['agentic-browsing'];
  if (!Array.isArray(category?.auditRefs)) return null;
  const seen = new Set<string>();
  const checks = category.auditRefs.filter((ref: any) => typeof ref?.id === 'string' && !seen.has(ref.id) && seen.add(ref.id)).map((ref: any) => {
    const audit = lh.audits?.[ref.id];
    const mode = audit?.scoreDisplayMode;
    const status = !audit || mode === 'error' ? 'error'
      : mode === 'notApplicable' ? 'not_applicable'
      : mode === 'manual' ? 'manual'
      : mode === 'informative' ? 'informative'
      : audit.score === 1 ? 'passed'
      : typeof audit.score === 'number' && Number.isFinite(audit.score) ? 'failed' : 'error';
    return { id: ref.id, title: String(audit?.title || ref.id), display: String(audit?.displayValue || ''), status };
  });
  // Count successful evaluated checks, never convert the experimental category to 0-100.
  return { checks, passed: checks.filter((c: any) => c.status === 'passed').length, evaluated: checks.filter((c: any) => c.status === 'passed' || c.status === 'failed').length };
}
export function normalizePageSpeed(value: any, device: string) {
  const lh = value?.lighthouseResult;
  if (!lh || lh.runtimeError || typeof lh.categories?.performance?.score !== "number") throw new InsightsError("Google kon deze pagina niet volledig meten.", 502);
  const score = (id: string) => typeof lh.categories?.[id]?.score === "number" ? Math.round(lh.categories[id].score * 100) : null;
  const metric = (id: string) => { const a = lh.audits?.[id]; return { value: Number.isFinite(a?.numericValue) ? a.numericValue : null, display: typeof a?.displayValue === "string" ? a.displayValue : null }; };
  return { device, lighthouse_version: typeof lh.lighthouseVersion === "string" ? lh.lighthouseVersion : null, warnings: (Array.isArray(lh.runWarnings) ? lh.runWarnings : []).filter((x: unknown) => typeof x === "string"), agentic: normalizeAgentic(lh), url: lh.finalDisplayedUrl || lh.finalUrl || value.id, measured_at: lh.fetchTime || value.analysisUTCTimestamp, scores: { performance: score("performance"), accessibility: score("accessibility"), seo: score("seo"), best_practices: score("best-practices") }, metrics: { speed_index: metric("speed-index"), lcp: metric("largest-contentful-paint"), fcp: metric("first-contentful-paint"), cls: metric("cumulative-layout-shift"), tbt: metric("total-blocking-time") }, opportunities: Object.values(lh.audits || {}).filter((a: any) => typeof a.score === "number" && a.score < .9 && (a.details?.type === "opportunity" || a.metricSavings)).map((a: any) => ({ title: String(a.title || "Verbeterpunt"), display: String(a.displayValue || ""), savings_ms: Number(a.details?.overallSavingsMs || a.metricSavings?.LCP || 0) })).sort((a, b) => b.savings_ms - a.savings_ms).slice(0, 8) };
}
export async function pageSpeed(url: string, device: string, key: string | null, transport: typeof fetch = fetch) {
  if (!["mobile", "desktop"].includes(device)) throw new InsightsError("Kies mobiel of desktop.");
  const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  endpoint.search = new URLSearchParams({ url, strategy: device, locale: "nl", ...(key ? { key } : {}) }).toString();
  for (const category of ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO", "AGENTIC_BROWSING"]) endpoint.searchParams.append("category", category);
  let response: Response;
  try { response = await transport(endpoint, { redirect: "error", signal: AbortSignal.timeout(55000) }); } catch { throw new InsightsError("De PageSpeed-meting duurde te lang. Probeer later opnieuw.", 504); }
  if (response.status === 429) throw new InsightsError("Google PageSpeed heeft zijn limiet bereikt. Stel een eigen PageSpeed API-sleutel in of probeer later opnieuw.", 429);
  if (!response.ok) throw new InsightsError("Google PageSpeed is niet beschikbaar voor deze meting (HTTP " + response.status + ").", 502);
  return normalizePageSpeed(await response.json(), device);
}
export async function analyticsReport(api: GoogleApi, property: string, production: string, days: number) {
  if (![7, 28, 90].includes(days)) throw new InsightsError("Kies 7, 28 of 90 dagen.");
  const hostname = websiteUrl(production).hostname.replace(/^www\./, "");
  const base = { dateRanges: [{ startDate: days + "daysAgo", endDate: "yesterday" }], dimensionFilter: { filter: { fieldName: "hostName", inListFilter: { values: [hostname, "www." + hostname], caseSensitive: false } } }, keepEmptyRows: false };
  const value = await api("data", property + ":batchRunReports", "POST", { requests: [
    { ...base, metrics: [{ name: "activeUsers" }, { name: "sessions" }, { name: "screenPageViews" }, { name: "keyEvents" }, { name: "engagementRate" }] },
    { ...base, dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }, { name: "sessions" }], orderBys: [{ dimension: { dimensionName: "date" } }], limit: 90 },
    { ...base, dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 10 },
  ] });
  if (!Array.isArray(value?.reports) || value.reports.length !== 3) throw new InsightsError("Google gaf geen volledig Analytics-rapport.", 502);
  const values = (row: any) => (row?.metricValues || []).map((x: any) => Number(x.value));
  const [summary, daily, pages] = value.reports;
  const totals = summary.rows?.[0] ? values(summary.rows[0]) : null;
  return { property, days, hostname, period: base.dateRanges[0], totals: totals ? { users: totals[0], sessions: totals[1], views: totals[2], key_events: totals[3], engagement_rate: totals[4] } : null, daily: (daily.rows || []).map((r: any) => ({ date: r.dimensionValues?.[0]?.value, users: values(r)[0], sessions: values(r)[1] })), pages: (pages.rows || []).map((r: any) => ({ path: r.dimensionValues?.[0]?.value, views: values(r)[0] })), thresholded: value.reports.some((r: any) => r.metadata?.subjectToThresholding === true) };
}
