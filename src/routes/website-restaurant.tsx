import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteRestaurant";

export const Route = createFileRoute("/website-restaurant")({
  head: () => publicHead("Website laten maken voor restaurants | Vedantix", "Professionele website laten maken voor restaurants? Vedantix bouwt snelle websites met menukaart, contactinformatie en sterke lokale zichtbaarheid.", "/website-restaurant"),
  component: Page,
});
