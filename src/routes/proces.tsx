import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Proces";

export const Route = createFileRoute("/proces")({
  head: () => ({
    meta: [
      { title: "Ons Proces | Van idee naar online groei | Vedantix" },
      { name: "description", content: "Ontdek hoe Vedantix ondernemers stap voor stap helpt naar meer online zichtbaarheid, vertrouwen en groei." },
      { property: "og:title", content: "Ons Proces | Van idee naar online groei | Vedantix" },
      { property: "og:description", content: "Ontdek hoe Vedantix ondernemers stap voor stap helpt naar meer online zichtbaarheid, vertrouwen en groei." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
