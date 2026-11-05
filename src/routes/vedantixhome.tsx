import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/VedantixHome";

export const Route = createFileRoute("/vedantixhome")({
  head: () => ({ ...publicHead("Professionele bedrijfswebsite laten maken | Vedantix", "Ontdek de bestaande websitepakketten van Vedantix en contactmogelijkheden voor een website die past bij jouw bedrijf.", "/vedantixhome"), links: [{ rel: "canonical", href: "https://vedantix.nl/vedantixhome" }] }),
  component: Page,
});
