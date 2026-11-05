import { publicHead } from "@/lib/public-head";
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
  head: () => publicHead("Gratis Online Groei Audit | Vedantix", "Laat een pagina van je website gratis controleren op vindbaarheid, technische basisinstellingen en contactmogelijkheden. Bekijk je verbeterpunten en download het PDF-rapport.", "/online-groei-audit"),
  component: OnlineGrowthAuditRoute,
});
