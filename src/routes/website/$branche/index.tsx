import { createFileRoute, notFound } from "@tanstack/react-router";
import Page from "@/pages/IndustryPage";
import { createIndustryHead } from "@/lib/industry-seo";
import { industries } from "@/data/seoData";

export const Route = createFileRoute("/website/$branche/")({
  beforeLoad: ({ params }) => {
    if (!Object.hasOwn(industries, params.branche)) {
      throw notFound();
    }
  },
  head: ({ params }) => createIndustryHead(params.branche),
  component: Page,
});
