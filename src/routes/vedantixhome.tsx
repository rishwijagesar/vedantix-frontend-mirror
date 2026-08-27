import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/VedantixHome";

export const Route = createFileRoute("/vedantixhome")({
  component: Page,
});
