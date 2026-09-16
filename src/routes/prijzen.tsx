import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import Page from "@/pages/Prijzen";

const title = "Websiteprijzen, hosting en online groei | Vedantix";
const description = "Bekijk de actuele prijzen voor websites, hosting en online groei. Websitepakketten en uitbreidingen voor lokale ondernemers.";

export const Route = createFileRoute("/prijzen")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page initialProducts={Route.useLoaderData()} />,
});
