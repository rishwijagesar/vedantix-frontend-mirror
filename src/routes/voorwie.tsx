import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/VoorWie";

export const Route = createFileRoute("/voorwie")({
  head: () => ({
    meta: [
      { title: "Voor wie is Vedantix? | Websites voor ondernemers die willen groeien" },
      { name: "description", content: "Ontdek of Vedantix bij jouw bedrijf past. Voor ondernemers die meer zichtbaarheid, meer vertrouwen en meer aanvragen uit hun online aanwezigheid willen halen." },
      { property: "og:title", content: "Voor wie is Vedantix? | Websites voor ondernemers die willen groeien" },
      { property: "og:description", content: "Ontdek of Vedantix bij jouw bedrijf past. Voor ondernemers die meer zichtbaarheid, meer vertrouwen en meer aanvragen uit hun online aanwezigheid willen halen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
