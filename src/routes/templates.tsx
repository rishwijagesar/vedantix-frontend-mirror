import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Templates";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Website templates kiezen | Vedantix" },
      { name: "description", content: "Bekijk website templates voor verschillende branches en kies het pakket dat past bij jouw bedrijf." },
      { property: "og:title", content: "Website templates kiezen | Vedantix" },
      { property: "og:description", content: "Bekijk website templates voor verschillende branches en kies het pakket dat past bij jouw bedrijf." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
