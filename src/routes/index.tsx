import { fetchPublicCases } from "@/lib/public-content";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Home";

export const Route = createFileRoute("/")({
  loader: () => fetchPublicCases().catch(() => null),
  staleTime: 0,
  head: () => ({
    meta: [
      { title: "Vedantix | Websites die lokale ondernemers helpen groeien" },
      { name: "description", content: "Vedantix helpt lokale ondernemers met professionele websites, SEO, AI-vriendelijke content en online zichtbaarheid voor meer vertrouwen, meer aanvragen en minder technische zorgen." },
      { property: "og:title", content: "Vedantix | Websites die lokale ondernemers helpen groeien" },
      { property: "og:description", content: "Vedantix helpt lokale ondernemers met professionele websites, SEO, AI-vriendelijke content en online zichtbaarheid voor meer vertrouwen, meer aanvragen en minder technische zorgen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <Page initialCases={Route.useLoaderData()} />,
});
