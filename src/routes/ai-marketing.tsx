import { createFileRoute } from "@tanstack/react-router";
import AdditionalService from "@/pages/AdditionalService";
import { ADDITIONAL_SERVICES } from "@/data/additional-services";
import { publicHead } from "@/lib/public-head";
const service = ADDITIONAL_SERVICES.find(item => item.slug === "ai-marketing");
export const Route = createFileRoute("/ai-marketing")({
  head: () => publicHead(service?.title ?? "AI-marketing | Vedantix", service?.description ?? "AI-ondersteunde marketing op offerte bij Vedantix.", "/ai-marketing"),
  component: () => <AdditionalService slug="ai-marketing" />,
});