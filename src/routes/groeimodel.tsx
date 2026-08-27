import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Groeimodel";

export const Route = createFileRoute("/groeimodel")({
  head: () => ({
    meta: [
      { title: "Waarom ondernemers voor Vedantix kiezen" },
      { name: "description", content: "Vedantix helpt lokale ondernemers met meer zichtbaarheid, vertrouwen, aanvragen en minder gedoe dan een standaard webdesigner." },
      { property: "og:title", content: "Waarom ondernemers voor Vedantix kiezen" },
      { property: "og:description", content: "Vedantix helpt lokale ondernemers met meer zichtbaarheid, vertrouwen, aanvragen en minder gedoe dan een standaard webdesigner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
