import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Voorwaarden";

export const Route = createFileRoute("/terms")({
  component: Page,
});
