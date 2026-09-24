import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import { publicHead } from "@/lib/public-head";
import { SERVICES } from "@/data/services";
import Page from "@/pages/ServiceDetail";
const service = SERVICES.find(item => item.slug === "ai-oplossingen")!;
export const Route = createFileRoute("/ai-oplossingen")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead(service.title, service.description, "/ai-oplossingen"),
  component: function ServiceRoute() {
    return <Page slug="ai-oplossingen" initialProducts={Route.useLoaderData()} />;
  },
});
