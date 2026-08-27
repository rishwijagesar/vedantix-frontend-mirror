import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteZZP";

export const Route = createFileRoute("/website-zzp")({
  head: () => ({
    meta: [
      { title: "Website laten maken voor zzp'ers | Vedantix" },
      { name: "description", content: "Professionele website laten maken voor zzp'ers? Vedantix bouwt websites die vertrouwen geven en helpen om meer klanten aan te trekken." },
      { property: "og:title", content: "Website laten maken voor zzp'ers | Vedantix" },
      { property: "og:description", content: "Professionele website laten maken voor zzp'ers? Vedantix bouwt websites die vertrouwen geven en helpen om meer klanten aan te trekken." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
