import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/AiVindbaarheid";

const title = "SEO, AEO, GEO en AIO voor lokale bedrijven | Vedantix";
const description =
  "Vedantix in Den Bosch bouwt websites en helpt lokale ondernemers met SEO, AEO, GEO, AIO, AI-vindbaarheid en hosting.";

export const Route = createFileRoute("/ai-vindbaarheid")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
