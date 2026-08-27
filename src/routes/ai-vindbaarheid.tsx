import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/AiVindbaarheid";

export const Route = createFileRoute("/ai-vindbaarheid")({
  head: () => ({
    meta: [
      { title: "Webdesign, hosting, SEO en AI-vindbaarheid | Vedantix" },
      { name: "description", content: "Vedantix in Den Bosch biedt webdesign, websites, managed hosting, onderhoud, SEO, AEO, GEO en AI-vindbaarheid voor lokale ondernemers." },
      { property: "og:title", content: "Webdesign, hosting, SEO en AI-vindbaarheid | Vedantix" },
      { property: "og:description", content: "Vedantix in Den Bosch biedt webdesign, websites, managed hosting, onderhoud, SEO, AEO, GEO en AI-vindbaarheid voor lokale ondernemers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
