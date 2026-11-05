import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteSchoonmaakbedrijf";

export const Route = createFileRoute("/website-schoonmaakbedrijf")({
  head: () => publicHead("Website laten maken voor schoonmaakbedrijven | Vedantix", "Professionele website laten maken voor een schoonmaakbedrijf? Vedantix bouwt snelle websites die zorgen voor meer vertrouwen en meer aanvragen.", "/website-schoonmaakbedrijf"),
  component: Page,
});
