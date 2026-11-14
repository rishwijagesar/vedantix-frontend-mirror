import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/AiVindbaarheid";

const title = "SEO, AEO, GEO en AIO voor lokale bedrijven | Vedantix";
const description =
  "Vedantix bouwt websites en helpt lokale ondernemers met SEO, AEO, GEO, AIO, AI-vindbaarheid en hosting.";

export const Route = createFileRoute("/ai-vindbaarheid")({
  head: () => publicHead("SEO, AEO, GEO en AIO voor bedrijven | Vedantix", "SEO, AEO, GEO en AIO voor mkb en zelfstandigen. Websitevindbaarheid naast bedrijfssoftware op maat, met landelijke dienstverlening.", "/ai-vindbaarheid"),
  component: Page,
});
