import { createFileRoute, notFound } from "@tanstack/react-router";
import Page from "@/pages/IndustryPage";
import { createIndustryHead } from "@/lib/industry-seo";
import { industries, localSeoCities } from "@/data/seoData";

export const Route = createFileRoute("/website/$branche/$stad")({
  beforeLoad: ({ params }) => {
    if (
      !Object.hasOwn(industries, params.branche) ||
      !localSeoCities.some((city) => city.slug === params.stad)
    ) {
      throw notFound();
    }
  },
  head: ({ params }) => createIndustryHead(params.branche, params.stad),
  component: Page,
});
