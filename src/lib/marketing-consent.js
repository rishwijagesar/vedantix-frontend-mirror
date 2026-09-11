export const MARKETING_CONSENT_KEY = "vedantix_marketing_consent_v1";
export const MARKETING_CONSENT_EVENT = "vedantix:marketing-consent";
export const OPEN_COOKIE_SETTINGS_EVENT = "vedantix:open-cookie-settings";

export function readMarketingConsent() {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(MARKETING_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

export function writeMarketingConsent(value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MARKETING_CONSENT_KEY, value);
  } catch {
    // If storage is unavailable, default remains no marketing tracking.
  }
  window.dispatchEvent(
    new CustomEvent(MARKETING_CONSENT_EVENT, { detail: { value } }),
  );
}

export function clearMetaTrackingCookies() {
  if (typeof document === "undefined") return;

  const names = ["_fbp", "_fbc"];
  const hostname = window.location.hostname;
  const domains = [hostname, `.${hostname}`];

  names.forEach((name) => {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    domains.forEach((domain) => {
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${domain}; SameSite=Lax`;
    });
  });
}
