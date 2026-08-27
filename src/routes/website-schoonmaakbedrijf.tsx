import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteSchoonmaakbedrijf";

export const Route = createFileRoute("/website-schoonmaakbedrijf")({
  head: () => ({
    meta: [
      { title: "Website laten maken voor schoonmaakbedrijven | Vedantix" },
      { name: "description", content: "Professionele website laten maken voor een schoonmaakbedrijf? Vedantix bouwt snelle websites die zorgen voor meer vertrouwen en meer aanvragen." },
      { property: "og:title", content: "Website laten maken voor schoonmaakbedrijven | Vedantix" },
      { property: "og:description", content: "Professionele website laten maken voor een schoonmaakbedrijf? Vedantix bouwt snelle websites die zorgen voor meer vertrouwen en meer aanvragen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
