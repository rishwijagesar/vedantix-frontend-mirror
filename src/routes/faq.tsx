import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FAQ";

const title = "FAQ | Prijzen, hosting, SEO en AI-vindbaarheid | Vedantix";
const description =
  "Veelgestelde vragen over Vedantix websites vanaf \u20ac399, hosting vanaf \u20ac30 per jaar, SEO, AEO, GEO/AIO, oplevering en uitbreidingen.";

export const Route = createFileRoute("/faq")({
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
