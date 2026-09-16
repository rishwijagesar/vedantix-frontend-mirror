import { fetchPublicCases } from "@/lib/public-content";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Resultaten";

export const Route = createFileRoute("/resultaten")({
  loader: () => fetchPublicCases().catch(() => null),
  staleTime: 0,
  head: () => ({
    meta: [
      { title: "Resultaten voor lokale ondernemers | Vedantix" },
      { name: "description", content: "Bekijk hoe Vedantix lokale ondernemers helpt met meer zichtbaarheid, meer vertrouwen, betere websites en meer aanvragen." },
      { property: "og:title", content: "Resultaten voor lokale ondernemers | Vedantix" },
      { property: "og:description", content: "Bekijk hoe Vedantix lokale ondernemers helpt met meer zichtbaarheid, meer vertrouwen, betere websites en meer aanvragen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page initialCases={Route.useLoaderData()} />,
});
