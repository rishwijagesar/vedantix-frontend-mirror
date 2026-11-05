import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import { publicHead } from "@/lib/public-head";
import { SERVICES } from "@/data/services";
import Page from "@/pages/ServiceDetail";
const service = SERVICES.find(item => item.slug === "webapps-klantportalen");
export const Route = createFileRoute("/webapps-klantportalen")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead(service?.title ?? "Diensten | Vedantix", service?.description ?? "Bekijk de diensten van Vedantix voor mkb en zelfstandigen.", "/webapps-klantportalen"),
  component: function ServiceRoute() {
    return <Page slug="webapps-klantportalen" initialProducts={Route.useLoaderData()} />;
  },
});
