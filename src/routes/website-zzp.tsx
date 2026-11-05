import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/WebsiteZZP";

export const Route = createFileRoute("/website-zzp")({
  head: () => publicHead("Website laten maken voor zzp'ers | Vedantix", "Professionele website laten maken voor zzp'ers? Vedantix bouwt websites die vertrouwen geven en helpen om meer klanten aan te trekken.", "/website-zzp"),
  component: Page,
});
