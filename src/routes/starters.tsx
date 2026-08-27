import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Starters";

export const Route = createFileRoute("/starters")({
  component: Page,
});
