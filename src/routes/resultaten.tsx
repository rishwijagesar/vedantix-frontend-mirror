import { fetchPublicCases } from "@/lib/public-content";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Resultaten";

export const Route = createFileRoute("/resultaten")({
  loader: () => fetchPublicCases().catch(() => null),
  staleTime: 0,
  head: () => ({
    meta: [
      { title: "Klantcases: websites voor ondernemers | Vedantix" },
      { name: "description", content: "Bekijk websites die Vedantix voor ondernemers heeft gebouwd. Lees wat we hebben gerealiseerd en bezoek de websites van onze klanten." },
      { property: "og:title", content: "Klantcases: websites voor ondernemers | Vedantix" },
      { property: "og:description", content: "Bekijk websites die Vedantix voor ondernemers heeft gebouwd. Lees wat we hebben gerealiseerd en bezoek de websites van onze klanten." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page initialCases={Route.useLoaderData()} />,
});

