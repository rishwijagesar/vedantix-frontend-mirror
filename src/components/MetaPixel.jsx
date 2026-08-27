import { useEffect } from "react";
import { Helmet } from "@/lib/helmet-compat";
import { useLocation } from "@/lib/router-compat";

const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID || "2100259704034137";
const EXCLUDED_PREFIXES = ["/admin", "/klantenportaal"];

function isPublicMarketingRoute(pathname) {
  return !EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function loadMetaPixel(pixelId) {
  if (!pixelId || typeof window === "undefined") return;

  if (!window["fbq"]) {
    const fbq = function fbq() {
      if (fbq["callMethod"]) {
        fbq["callMethod"].apply(fbq, arguments);
      } else {
        fbq.queue.push(arguments);
      }
    };

    window["fbq"] = fbq;
    window["_fbq"] = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    const firstScript = document.getElementsByTagName("script")[0];
    firstScript.parentNode.insertBefore(script, firstScript);
  }

  if (!window["__vedantixMetaPixelInitialized"]) {
    window["fbq"]("init", pixelId);
    window["__vedantixMetaPixelInitialized"] = true;
  }
}

export default function MetaPixel() {
  const location = useLocation();
  const enabled = Boolean(META_PIXEL_ID) && isPublicMarketingRoute(location.pathname);

  useEffect(() => {
    if (!enabled) return;

    loadMetaPixel(META_PIXEL_ID);
    window["fbq"]?.("track", "PageView");
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
