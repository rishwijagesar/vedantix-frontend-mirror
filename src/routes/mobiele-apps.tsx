import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import { publicHead } from "@/lib/public-head";
import { SERVICES } from "@/data/services";
import Page from "@/pages/ServiceDetail";
const service = SERVICES.find(item => item.slug === "mobiele-apps");
export const Route = createFileRoute("/mobiele-apps")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead(service?.title ?? "Diensten | Vedantix", service?.description ?? "Bekijk de diensten van Vedantix voor mkb en zelfstandigen.", "/mobiele-apps"),
  component: function ServiceRoute() {
    return <Page slug="mobiele-apps" initialProducts={Route.useLoaderData()} />;
  },
});
