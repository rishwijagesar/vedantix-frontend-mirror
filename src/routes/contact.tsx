import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact over websites, AI & apps | Vedantix" },
      { name: "description", content: "Bespreek je website, AI-oplossing, webapp of mobiele app met Vedantix in Den Bosch. Neem contact op voor een kennismaking." },
      { property: "og:title", content: "Contact over websites, AI & apps | Vedantix" },
      { property: "og:description", content: "Bespreek je website, AI-oplossing, webapp of mobiele app met Vedantix in Den Bosch. Neem contact op voor een kennismaking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

