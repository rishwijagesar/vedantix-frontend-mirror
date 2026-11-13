import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import Page from "@/pages/Prijzen";

export const Route = createFileRoute("/prijzen_/websites")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead("Website laten maken: prijzen eenmalig of per maand | Vedantix", "Websitepakketten met een vaste eenmalige prijs, of lage opstartkosten plus een vast maandbedrag inclusief hosting, onderhoud en kleine aanpassingen.", "/prijzen/websites"),
  component: function PricingRoute() {
    return <Page initialProducts={Route.useLoaderData()} view="websites" />;
  },
});
