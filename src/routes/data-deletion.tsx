import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/DataDeletion";

export const Route = createFileRoute("/data-deletion")({
  component: Page,
});
