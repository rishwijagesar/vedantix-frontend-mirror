import { partytownSnippet } from "@qwik.dev/partytown/integration";

const pixelId = import.meta.env.VITE_META_PIXEL_ID || "2100259704034137";
export const analyticsWorkerSnippet =
  `window.__vedantixInitialPixelHref=location.pathname+location.search;` +
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
  });

// Keep initialization and the initial PageView in the same script so Partytown's
// ordinary-script fallback also records that visit. SPA visits are forwarded.
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
};
if (!location.pathname.startsWith('/admin') && !location.pathname.startsWith('/klantenportaal')) {
  vedantixInitializePixel(${JSON.stringify(pixelId)});
  fbq('track', 'PageView');
}`;
