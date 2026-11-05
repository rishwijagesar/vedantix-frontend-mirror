import { createFileRoute } from "@tanstack/react-router";
import AdditionalService from "@/pages/AdditionalService";
import { ADDITIONAL_SERVICES } from "@/data/additional-services";
import { publicHead } from "@/lib/public-head";
const service = ADDITIONAL_SERVICES.find(item => item.slug === "online-marketing");
export const Route = createFileRoute("/online-marketing")({
  head: () => publicHead(service?.title ?? "Online marketing | Vedantix", service?.description ?? "Marketing op offerte bij Vedantix.", "/online-marketing"),
  component: () => <AdditionalService slug="online-marketing" />,
});