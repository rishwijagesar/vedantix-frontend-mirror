import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicCatalog } from "@/lib/public-content";
import { publicHead } from "@/lib/public-head";
import { SERVICES } from "@/data/services";
import Page from "@/pages/ServiceDetail";
const service = SERVICES.find(item => item.slug === "website-laten-maken")!;
export const Route = createFileRoute("/website-laten-maken")({
  loader: () => fetchPublicCatalog().catch(() => null),
  staleTime: 0,
  head: () => publicHead(service.title, service.description, "/website-laten-maken"),
  component: () => <Page slug="website-laten-maken" initialProducts={Route.useLoaderData()} />,
});
