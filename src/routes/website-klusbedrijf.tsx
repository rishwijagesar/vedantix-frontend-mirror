import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteKlusbedrijf";

export const Route = createFileRoute("/website-klusbedrijf")({
  head: () => publicHead("Website laten maken voor klusbedrijven | Vedantix", "Een professionele website voor je klusbedrijf. Presenteer diensten, werkgebied en projecten met heldere contactmogelijkheden bij Vedantix.", "/website-klusbedrijf"),
  component: Page,
});
