import { createFileRoute } from "@tanstack/react-router";
import AdditionalService from "@/pages/AdditionalService";
import { ADDITIONAL_SERVICES } from "@/data/additional-services";
import { publicHead } from "@/lib/public-head";
const service = ADDITIONAL_SERVICES.find(item => item.slug === "onderhoud-support");
export const Route = createFileRoute("/onderhoud-support")({
  head: () => publicHead(service?.title ?? "Onderhoud & support | Vedantix", service?.description ?? "Beheerafspraken voor websites en software bij Vedantix.", "/onderhoud-support"),
  component: () => <AdditionalService slug="onderhoud-support" />,
});