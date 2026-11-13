const BASE = "https://zxnexwqvoznmirajhgxj.supabase.co";
const KEY = "sb_publishable_QlxkbMaJ9IEBAPr9y0d1HQ_xh8Z6oEu";

export type PublicProduct = {
  code: string; name: string; description: string | null; category: string;
  billing_type: "ONE_TIME" | "MONTHLY" | "YEARLY";
  price_ex_vat: number; price_incl_vat: number; vat_rate: number;
  sort_order: number; from_price: boolean; duration_years: string | null;
  setup_fee?: number | null; min_term_months?: number | null; base_package?: string | null; included_hours?: number | null;
};
export type PublicCase = {
  id: string; name: string; website: string | null; logo: string | null; branch: string;
  status: string; summary: string; outcome: string; show_on_home: boolean; show_on_results: boolean;
};

async function publicRpc<T>(name: string): Promise<T[]> {
  const response = await fetch(`${BASE}/rest/v1/rpc/${name}`, {
    method: "POST", headers: { apikey: KEY, "content-type": "application/json" },
    body: "{}", cache: "no-store", signal: AbortSignal.timeout(6000),
  });
  if (!response.ok) throw new Error("De actuele websitegegevens zijn tijdelijk niet beschikbaar.");
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Ongeldige websitegegevens.");
  return data;
}

export const fetchPublicCatalog = () => publicRpc<PublicProduct>("get_public_catalog");
export const fetchPublicCases = () => publicRpc<PublicCase>("get_public_client_cases");

export function contentUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("vedantix-content-updated"));
  try { localStorage.setItem("vedantix-content-updated", String(Date.now())); } catch { /* storage is optional */ }
}

export function safeWebsiteUrl(value: string | null | undefined) {
  if (!value) return null;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}

export function safeLogoUrl(value: string | null | undefined) {
  return value && /^\/logos\/[A-Za-z0-9._/-]+$/.test(value) ? value : safeWebsiteUrl(value);
}
