import { createFileRoute } from "@tanstack/react-router";
import AuditFunnelTracker from "@/components/AuditFunnelTracker";
import Page from "@/pages/OnlineGrowthAudit";

function OnlineGrowthAuditRoute() {
  return (
    <>
      <AuditFunnelTracker />
      <Page />
    </>
  );
}

export const Route = createFileRoute("/online-groei-audit")({
  head: () => ({
    meta: [
      { title: "Gratis Online Groei Audit | Vedantix" },
      { name: "description", content: "Laat een pagina van je website gratis controleren op vindbaarheid, technische basisinstellingen en contactmogelijkheden. Bekijk je verbeterpunten en download het PDF-rapport." },
      { property: "og:title", content: "Gratis Online Groei Audit | Vedantix" },
      { property: "og:description", content: "Laat een pagina van je website gratis controleren op vindbaarheid, technische basisinstellingen en contactmogelijkheden. Bekijk je verbeterpunten en download het PDF-rapport." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnlineGrowthAuditRoute,
});
