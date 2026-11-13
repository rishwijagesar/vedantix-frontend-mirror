import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import Page from "@/pages/Prijzen";

export const Route = createFileRoute("/prijzen_/beheer-onderhoud")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead("Beheer, onderhoud en hosting: prijzen | Vedantix", "Losse prijzen voor hosting, zakelijke e-mail, technisch beheer, groeipakketten en ondersteuning voor je website of applicatie.", "/prijzen/beheer-onderhoud"),
  component: function PricingRoute() {
    return <Page initialProducts={Route.useLoaderData()} view="beheer" />;
  },
});
