import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteRestaurant";

export const Route = createFileRoute("/website-restaurant")({
  head: () => ({
    meta: [
      { title: "Website laten maken voor restaurants | Vedantix" },
      { name: "description", content: "Professionele website laten maken voor restaurants? Vedantix bouwt snelle websites met menukaart, contactinformatie en sterke lokale zichtbaarheid." },
      { property: "og:title", content: "Website laten maken voor restaurants | Vedantix" },
      { property: "og:description", content: "Professionele website laten maken voor restaurants? Vedantix bouwt snelle websites met menukaart, contactinformatie en sterke lokale zichtbaarheid." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
