import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/IndustryPage";

export const Route = createFileRoute("/website/$branche/$stad")({
  component: Page,
});
