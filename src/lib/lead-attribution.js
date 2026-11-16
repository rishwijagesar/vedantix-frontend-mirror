/**
 * Remembers where a visitor came from (Meta/Google ad, campaign, landing page) for this browser tab,
 * so an enquiry sent later on another page still shows its origin. Stored in sessionStorage only and
 * sent nowhere until the visitor submits a form themselves.
 */
const KEY = "vedantix_lead_attribution_v1";
const PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "gbraid", "wbraid"];

function read() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Call on every navigation; a campaign URL overwrites earlier data, a plain URL never does. */
export function captureLeadAttribution() {
  if (typeof window === "undefined") return;
  const query = new URLSearchParams(window.location.search);
  const params = {};
  for (const name of PARAMS) {
    const value = query.get(name);
    if (value) params[name] = value.slice(0, 120);
  }
  const hasCampaign = Object.keys(params).length > 0;
  if (!hasCampaign && read()) return;
  let referrer = "";
  try {
    const ref = document.referrer ? new URL(document.referrer) : null;
    if (ref && ref.host !== window.location.host) referrer = ref.host;
  } catch { /* ignore */ }
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ params, landing: window.location.pathname, referrer }));
  } catch { /* storage unavailable: enquiry is still sent, just without origin */ }
}

/** Human-readable channel, e.g. "Meta-advertentie", "Google Ads", "Google (organisch)". */
function channel(data) {
  const p = data?.params || {};
  const source = (p.utm_source || "").toLowerCase();
  if (p.fbclid || /facebook|instagram|meta|^fb$|^ig$/.test(source)) return p.utm_medium && !/paid|cpc|ads?/.test(p.utm_medium) ? "Meta (organisch)" : "Meta-advertentie";
  if (p.gclid || p.gbraid || p.wbraid || (source === "google" && /cpc|paid|ads?/.test(p.utm_medium || ""))) return "Google Ads";
  if (source) return source;
  const ref = data?.referrer || "";
  if (/google\./.test(ref)) return "Google (organisch)";
  if (/instagram|facebook/.test(ref)) return "Instagram/Facebook (organisch)";
  if (/linkedin/.test(ref)) return "LinkedIn";
  return ref ? `Verwijzing: ${ref}` : "Direct";
}

/** Short summary appended to the enquiry so you can see in the admin which ad or channel produced the lead. */
export function leadAttributionSummary() {
  const data = read();
  if (!data) return "";
  const p = data.params || {};
  const parts = [`Herkomst: ${channel(data)}`];
  if (p.utm_campaign) parts.push(`campagne: ${p.utm_campaign}`);
  if (p.utm_content) parts.push(`advertentie: ${p.utm_content}`);
  if (data.landing) parts.push(`landingspagina: ${data.landing}`);
  return parts.join(" · ");
}
