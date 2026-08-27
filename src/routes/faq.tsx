import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FAQ";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ | Veelgestelde vragen over websites | Vedantix" },
      { name: "description", content: "Bekijk de veelgestelde vragen van Vedantix over prijzen, abonnementen, oplevering, wijzigingen, support en het laten maken van een website." },
      { property: "og:title", content: "FAQ | Veelgestelde vragen over websites | Vedantix" },
      { property: "og:description", content: "Bekijk de veelgestelde vragen van Vedantix over prijzen, abonnementen, oplevering, wijzigingen, support en het laten maken van een website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
