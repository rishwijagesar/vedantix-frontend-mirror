import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import { publicHead } from "@/lib/public-head";
import { SERVICES } from "@/data/services";
import Page from "@/pages/ServiceDetail";
const service = SERVICES.find(item => item.slug === "mobiele-apps")!;
export const Route = createFileRoute("/mobiele-apps")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead(service.title, service.description, "/mobiele-apps"),
  component: () => <Page slug="mobiele-apps" initialProducts={Route.useLoaderData()} />,
});
