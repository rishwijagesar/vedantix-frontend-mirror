import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Blog";

export const Route = createFileRoute("/blog/")({
  head: () => ({
    meta: [
      { title: "Blog over websites, lokale SEO en meer klanten | Vedantix" },
      { name: "description", content: "Praktische blogs over websites, lokale SEO en online groei voor kappers, salons, restaurants, fotografen, klusbedrijven en andere lokale ondernemers." },
      { property: "og:title", content: "Blog over websites, lokale SEO en meer klanten | Vedantix" },
      { property: "og:description", content: "Praktische blogs over websites, lokale SEO en online groei voor kappers, salons, restaurants, fotografen, klusbedrijven en andere lokale ondernemers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
