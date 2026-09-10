import { useEffect, useRef } from "react";
import { Helmet } from "@/lib/helmet-compat";
import { useLocation } from "@/lib/router-compat";

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "2100259704034137";
const EXCLUDED_PREFIXES = ["/admin", "/klantenportaal"];

export default function MetaPixel() {
  const location = useLocation();
  const previousHref = useRef(null);
  const enabled =
    Boolean(META_PIXEL_ID) &&
    !EXCLUDED_PREFIXES.some((prefix) => location.pathname.startsWith(prefix));

  useEffect(() => {
    const href = location.pathname + location.search;
    const previous = previousHref.current ?? window.__vedantixInitialPixelHref;
    previousHref.current = href;
    // The worker bootstrap records the initial page. Only forward SPA changes.
    if (!enabled || previous === href) return;
    window.vedantixInitializePixel?.(META_PIXEL_ID);
    window.fbq?.("track", "PageView");
  }, [enabled, location.pathname, location.search]);

  if (!enabled) return null;
  return (
    <Helmet>
      <noscript
        dangerouslySetInnerHTML={{
          __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1" />`,
        }}
      />
    </Helmet>
  );
}
