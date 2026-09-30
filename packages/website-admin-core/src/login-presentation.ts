export const WEBSITE_ADMIN_LOGIN_PRESENTATION_URL = "https://vedantix.nl/api/public/website-admin-login";
export const LOGIN_PRESENTATION_MAX_BYTES = 4096;
export const LOGIN_PRESENTATION_TIMEOUT_MS = 3000;

export interface LoginPresentation {
  version: 1;
  layout: "split" | "centered";
  brandName: string;
  eyebrow: string;
  storyTitle: string;
  storyText: string;
  heading: string;
  description: string;
  primaryColor: string;
  backgroundColor: string;
  borderRadius: "8px" | "12px" | "16px" | "24px";
}

export const DEFAULT_LOGIN_PRESENTATION: Readonly<LoginPresentation> = Object.freeze({
  version: 1,
  layout: "split",
  brandName: "vedantix",
  eyebrow: "JOUW WEBSITE. JOUW VERHAAL.",
  storyTitle: "Mooi ontworpen.\nMakkelijk beheerd.",
  storyText: "Een vertrouwde plek voor je teksten, afbeeldingen en behandelingen.",
  heading: "Welkom terug",
  description: "Werk je website bij op een moment dat jou uitkomt.",
  primaryColor: "#173963",
  backgroundColor: "#F6F8FC",
  borderRadius: "16px",
});

const textLimits = { brandName: 40, eyebrow: 60, storyTitle: 120, storyText: 280, heading: 80, description: 240 } as const;
const keys = Object.keys(DEFAULT_LOGIN_PRESENTATION);
const colorPattern = /^#[0-9a-fA-F]{6}$/;

function luminance(color: string): number {
  const channels = [1, 3, 5].map(offset => {
    const channel = Number.parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722;
}

function contrast(first: string, second: string): number {
  const a = luminance(first); const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** This allowlist accepts presentation only. Authentication and links are never remote-configurable. */
export function validateLoginPresentation(value: unknown): LoginPresentation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const data = value as Record<string, unknown>;
  if (Object.keys(data).length !== keys.length || Object.keys(data).some(key => !keys.includes(key))) return null;
  if (data["version"] !== 1 || (data["layout"] !== "split" && data["layout"] !== "centered")) return null;
  for (const [key, limit] of Object.entries(textLimits)) {
    const text = data[key];
    if (typeof text !== "string" || !text.trim() || text.length > limit || /[<>\u0000-\u0008\u000b-\u001f\u007f]/.test(text)
      || /(?:https?:\/\/|www\.|javascript:|data:|url\s*\()/i.test(text)) return null;
  }
  if (typeof data["primaryColor"] !== "string" || !colorPattern.test(data["primaryColor"])
    || typeof data["backgroundColor"] !== "string" || !colorPattern.test(data["backgroundColor"])) return null;
  if (contrast(data["primaryColor"], "#FFFFFF") < 4.5 || contrast(data["backgroundColor"], "#0F172A") < 4.5) return null;
  if (typeof data["borderRadius"] !== "string" || !["8px", "12px", "16px", "24px"].includes(data["borderRadius"])) return null;
  // Copy only validated primitives; no untrusted object is retained by the component.
  return Object.fromEntries(keys.map(key => [key, data[key]])) as unknown as LoginPresentation;
}

export function mayApplyLoginPresentation(interacted: boolean, disposed: boolean): boolean {
  return !interacted && !disposed;
}

/** Returns the safe local presentation on any network, timeout, size or validation failure. */
export async function loadLoginPresentation(fetcher: typeof fetch = globalThis.fetch, signal?: AbortSignal): Promise<Readonly<LoginPresentation>> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) return DEFAULT_LOGIN_PRESENTATION;
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, LOGIN_PRESENTATION_TIMEOUT_MS);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const response = await fetcher(WEBSITE_ADMIN_LOGIN_PRESENTATION_URL, {
      method: "GET", credentials: "omit", referrerPolicy: "no-referrer", redirect: "error",
      mode: "cors", cache: "default", signal: controller.signal,
    });
    if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("application/json")) return DEFAULT_LOGIN_PRESENTATION;
    const contentLength = Number(response.headers.get("content-length") || 0);
    if (contentLength > LOGIN_PRESENTATION_MAX_BYTES || !response.body) return DEFAULT_LOGIN_PRESENTATION;
    reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let bytes = 0; let json = "";
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > LOGIN_PRESENTATION_MAX_BYTES) { await reader.cancel(); return DEFAULT_LOGIN_PRESENTATION; }
      json += decoder.decode(part.value, { stream: true });
    }
    json += decoder.decode();
    return validateLoginPresentation(JSON.parse(json)) || DEFAULT_LOGIN_PRESENTATION;
  } catch { return DEFAULT_LOGIN_PRESENTATION; }
  finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
    reader?.releaseLock();
  }
}
