import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import Page from "@/pages/Prijzen";

export const Route = createFileRoute("/prijzen_/software-op-maat")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead("Software op maat: zo werkt de prijs | Vedantix", "Bedrijfssoftware op maat met opstartkosten en een vast maandbedrag op offerte na een bedrijfsscan. Bekijk ook de vanafprijzen van afgebakende diensten.", "/prijzen/software-op-maat"),
  component: function PricingRoute() {
    return <Page initialProducts={Route.useLoaderData()} view="software" />;
  },
});
