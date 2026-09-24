import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/FAQ";

const title = "FAQ | Websites, AI-oplossingen, apps en prijzen | Vedantix";
const description = "Antwoorden over websites, AI-oplossingen, apps, prijzen, hosting, SEO en AI-vindbaarheid bij Vedantix.";

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

