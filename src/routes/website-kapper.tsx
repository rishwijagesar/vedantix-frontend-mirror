import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteKapper";

export const Route = createFileRoute("/website-kapper")({
  head: () => ({
    meta: [
      { title: "Website laten maken voor kappers | Vedantix" },
      { name: "description", content: "Professionele website laten maken voor kappers? Vedantix bouwt snelle websites waarmee je lokaal beter gevonden wordt en meer afspraken krijgt." },
      { property: "og:title", content: "Website laten maken voor kappers | Vedantix" },
      { property: "og:description", content: "Professionele website laten maken voor kappers? Vedantix bouwt snelle websites waarmee je lokaal beter gevonden wordt en meer afspraken krijgt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
