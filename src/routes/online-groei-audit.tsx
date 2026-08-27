import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/OnlineGrowthAudit";

export const Route = createFileRoute("/online-groei-audit")({
  head: () => ({
    meta: [
      { title: "Gratis Online Groei Audit | Vedantix" },
      { name: "description", content: "Start een backend-gedreven Online Groei Audit en ontdek kansen voor SEO, GEO, AEO, AI-zichtbaarheid, security, reviews, conversie en lokale vindbaarheid." },
      { property: "og:title", content: "Gratis Online Groei Audit | Vedantix" },
      { property: "og:description", content: "Start een backend-gedreven Online Groei Audit en ontdek kansen voor SEO, GEO, AEO, AI-zichtbaarheid, security, reviews, conversie en lokale vindbaarheid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
