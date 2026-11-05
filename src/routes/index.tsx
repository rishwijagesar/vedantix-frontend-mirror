import { publicHead } from "@/lib/public-head";
import { fetchPublicCases } from "@/lib/public-content";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Home";

export const Route = createFileRoute("/")({
  loader: () => fetchPublicCases().catch(() => null),
  staleTime: 0,
  head: () => publicHead("Software op maat voor mkb | Vedantix Den Bosch", "Bedrijfssoftware op maat voor mkb en zelfstandigen. Eén webapp voor je processen, gebouwd met AI en professioneel getest. Vanuit Den Bosch, landelijk.", "/"),
  component: function ServiceRoute() {
    return <Page initialCases={Route.useLoaderData()} />;
  },
});

