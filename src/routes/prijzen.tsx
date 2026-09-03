import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Prijzen";

const title = "Website vanaf \u20ac399 | Hosting \u20ac30 per jaar | Vedantix";
const description =
  "Professionele websites vanaf \u20ac399 eenmalig. Hosting vanaf \u20ac30 per jaar. Kies extra SEO, AEO, GEO/AIO en online groei alleen wanneer je die nodig hebt.";

export const Route = createFileRoute("/prijzen")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
