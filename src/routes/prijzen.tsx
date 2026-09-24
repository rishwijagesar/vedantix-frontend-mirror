import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import Page from "@/pages/Prijzen";

const title = "Prijzen voor websites, AI-oplossingen & apps | Vedantix";
const description = "Actuele tarieven voor websitepakketten, AI-automatisering, webapps, mobiele apps en SEO. Bekijk scope, vanafprijzen en btw.";

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
  component: function ServiceRoute() {
    return <Page initialProducts={Route.useLoaderData()} />;
  },
});

