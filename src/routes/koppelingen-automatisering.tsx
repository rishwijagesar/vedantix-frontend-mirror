import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import { publicHead } from "@/lib/public-head";
import { SERVICES } from "@/data/services";
import Page from "@/pages/ServiceDetail";
const service = SERVICES.find(item => item.slug === "koppelingen-automatisering")!;
export const Route = createFileRoute("/koppelingen-automatisering")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead(service.title, service.description, "/koppelingen-automatisering"),
  component: function ServiceRoute() {
    return <Page slug="koppelingen-automatisering" initialProducts={Route.useLoaderData()} />;
  },
});
