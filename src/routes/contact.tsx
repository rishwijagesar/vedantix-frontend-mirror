import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Contact";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | Vedantix" },
      { name: "description", content: "Neem contact op met Vedantix voor een snelle, professionele website voor jouw lokale bedrijf. Vraag vrijblijvend advies aan." },
      { property: "og:title", content: "Contact | Vedantix" },
      { property: "og:description", content: "Neem contact op met Vedantix voor een snelle, professionele website voor jouw lokale bedrijf. Vraag vrijblijvend advies aan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
