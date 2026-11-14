import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Contact";

export const Route = createFileRoute("/contact")({
  head: () => publicHead("Plan een bedrijfsscan of bespreek je website | Vedantix", "Plan een bedrijfsscan met Vedantix. Bespreek processen, tools, maatwerksoftware, een website of hosting. Voor ondernemers in heel Nederland.", "/contact"),
  component: Page,
});

