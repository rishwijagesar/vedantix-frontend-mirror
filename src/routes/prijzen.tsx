import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import Page from "@/pages/Prijzen";

const title = "Prijzen voor websites, AI-oplossingen & apps | Vedantix";
const description = "Actuele tarieven voor websitepakketten, AI-automatisering, webapps, mobiele apps en SEO. Bekijk scope, vanafprijzen en btw.";

export const Route = createFileRoute("/prijzen")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead("Software op offerte, websiteprijzen en hosting | Vedantix", "Software op maat met opstartkosten en een vast maandbedrag op offerte. Bekijk de bestaande websiteprijzen, hosting, e-mail en optionele groeidiensten.", "/prijzen"),
  component: function ServiceRoute() {
    return <Page initialProducts={Route.useLoaderData()} />;
  },
});

