import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Planning";

export const Route = createFileRoute("/planning")({
  head: () => ({ ...publicHead("Afspraak aanvragen | Vedantix", "Bekijk beschikbare kennismakingsmomenten. Geen moment beschikbaar? Neem contact op voor een bedrijfsscan, website of hostingvraag.", "/planning", { noindex: true }), links: [{ rel: "canonical", href: "https://vedantix.nl/planning" }] }),
  component: Page,
});
