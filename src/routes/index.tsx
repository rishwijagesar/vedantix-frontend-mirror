import { fetchPublicCases } from "@/lib/public-content";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Home";

export const Route = createFileRoute("/")({
  loader: () => fetchPublicCases().catch(() => null),
  staleTime: 0,
  head: () => ({
    meta: [
      { title: "Vedantix | Websites, AI-oplossingen & apps voor bedrijven" },
      { name: "description", content: "Vedantix helpt ondernemers met websites, AI-automatisering, webapps, mobiele apps en SEO. Vanuit Den Bosch bouwen we aan meer zichtbaarheid en minder handwerk." },
      { property: "og:title", content: "Vedantix | Websites, AI-oplossingen & apps voor bedrijven" },
      { property: "og:description", content: "Vedantix helpt ondernemers met websites, AI-automatisering, webapps, mobiele apps en SEO. Vanuit Den Bosch bouwen we aan meer zichtbaarheid en minder handwerk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: function ServiceRoute() {
    return <Page initialCases={Route.useLoaderData()} />;
  },
});

