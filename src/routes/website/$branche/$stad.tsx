import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/IndustryPage";
import { createIndustryHead } from "@/lib/industry-seo";

export const Route = createFileRoute("/website/$branche/$stad")({
  head: ({ params }) => createIndustryHead(params.branche, params.stad),
  component: Page,
});
