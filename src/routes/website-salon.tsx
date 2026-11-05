import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteSalon";

export const Route = createFileRoute("/website-salon")({
  head: () => publicHead("Website laten maken voor salons | Vedantix", "Een professionele website voor je salon. Presenteer behandelingen, sfeer en contactmogelijkheden met Vedantix in Den Bosch.", "/website-salon"),
  component: Page,
});
