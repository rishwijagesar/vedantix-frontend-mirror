import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteKapper";

export const Route = createFileRoute("/website-kapper")({
  head: () => publicHead("Website laten maken voor kappers | Vedantix", "Professionele website laten maken voor kappers? Vedantix bouwt snelle websites waarmee je lokaal beter gevonden wordt en meer afspraken krijgt.", "/website-kapper"),
  component: Page,
});
