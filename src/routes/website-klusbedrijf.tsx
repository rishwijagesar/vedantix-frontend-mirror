import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteKlusbedrijf";

export const Route = createFileRoute("/website-klusbedrijf")({
  component: Page,
});
