import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteSalon";

export const Route = createFileRoute("/website-salon")({
  component: Page,
});
