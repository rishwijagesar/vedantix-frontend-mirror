import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteFotograaf";

export const Route = createFileRoute("/website-fotograaf")({
  component: Page,
});
