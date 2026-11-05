import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteFotograaf";

export const Route = createFileRoute("/website-fotograaf")({
  head: () => publicHead("Website laten maken voor fotografen | Vedantix", "Professionele website laten maken voor fotografen? Vedantix bouwt snelle portfolio websites waarmee je meer zichtbaarheid, vertrouwen en aanvragen krijgt.", "/website-fotograaf"),
  component: Page,
});
