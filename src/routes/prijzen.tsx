import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import Page from "@/pages/Prijzen";

const title = "Prijzen voor websites, AI-oplossingen & apps | Vedantix";
const description = "Actuele tarieven voor websitepakketten, AI-automatisering, webapps, mobiele apps en SEO. Bekijk scope, vanafprijzen en btw.";

export const Route = createFileRoute("/prijzen")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead("Prijzen: websites, software op maat en beheer | Vedantix", "Bekijk de prijzen van Vedantix: websitepakketten eenmalig of als abonnement, bedrijfssoftware op maat op offerte en losse prijzen voor hosting, beheer en onderhoud.", "/prijzen"),
  component: function ServiceRoute() {
    return <Page initialProducts={Route.useLoaderData()} view="overview" />;
  },
});

