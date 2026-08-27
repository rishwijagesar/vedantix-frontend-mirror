import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Planning";

export const Route = createFileRoute("/planning")({
  component: Page,
});
