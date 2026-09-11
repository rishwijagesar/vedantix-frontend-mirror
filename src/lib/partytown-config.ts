import { partytownSnippet } from "@qwik.dev/partytown/integration";

export const analyticsWorkerSnippet =
  `if (!window.__vedantixAnalyticsWorkerStarted) { window.__vedantixAnalyticsWorkerStarted=true;` +
  partytownSnippet({
    lib: "/assets/partytown-0.14.4/",
    forward: ["fbq", "vedantixInitializePixel"],
    resolveUrl(url, location, type) {
      if (type === "script" && url.hostname === "connect.facebook.net") {
        return new URL(
          "/integrations/meta-pixel" + url.pathname + url.search,
          location.origin,
        );
      }
      return url;
    },
  }) + "}";

// This script only defines the Meta initializer. It deliberately does not load
// Meta or emit PageView until the browser has explicit marketing consent.
export const pixelWorkerBootstrap = `
window.vedantixInitializePixel = function(pixelId) {
  if (window.__vedantixPixelInitialized) return;
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
  (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', pixelId);
  window.__vedantixPixelInitialized = true;
};`;
