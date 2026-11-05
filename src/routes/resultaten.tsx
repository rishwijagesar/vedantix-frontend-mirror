import { publicHead } from "@/lib/public-head";
import { fetchPublicCases } from "@/lib/public-content";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Resultaten";

export const Route = createFileRoute("/resultaten")({
  loader: () => fetchPublicCases().catch(() => null),
  staleTime: 0,
  head: () => publicHead("Klantcases: websites voor ondernemers | Vedantix", "Bekijk websites die Vedantix voor ondernemers heeft gebouwd. Lees wat we hebben gerealiseerd en bezoek de websites van onze klanten.", "/resultaten"),
  component: () => <Page initialCases={Route.useLoaderData()} />,
});

