import { useEffect, useRef, useState } from "react";
import { useLocation } from "@/lib/router-compat";
import {
  MARKETING_CONSENT_EVENT,
  readMarketingConsent,
} from "../lib/marketing-consent";

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "2100259704034137";
const EXCLUDED_PREFIXES = ["/admin", "/klantenportaal"];

export default function MetaPixel() {
  const location = useLocation();
  const previousHref = useRef(null);
  const [consent, setConsent] = useState(null);
  const enabled =
    Boolean(META_PIXEL_ID) &&
    !EXCLUDED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  useEffect(() => {
    setConsent(readMarketingConsent());
    const syncConsent = (event) => setConsent(event.detail?.value ?? null);
    window.addEventListener(MARKETING_CONSENT_EVENT, syncConsent);
    return () => window.removeEventListener(MARKETING_CONSENT_EVENT, syncConsent);
  }, []);

  useEffect(() => {
    if (!enabled || consent !== "granted") return undefined;

    const href = location.pathname + location.search;
    let cancelled = false;
    let attempts = 0;
    let timer;

    const initializeAndTrack = () => {
      if (cancelled) return;

      if (
        typeof window.vedantixInitializePixel !== "function" ||
        typeof window.fbq !== "function"
      ) {
        attempts += 1;
        if (attempts <= 40) {
          timer = window.setTimeout(initializeAndTrack, 100);
        }
        return;
      }

      window.vedantixInitializePixel(META_PIXEL_ID);
      if (previousHref.current !== href) {
        window.fbq("track", "PageView");
        previousHref.current = href;
      }
    };

    initializeAndTrack();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [consent, enabled, location.pathname, location.search]);

  return null;
}
