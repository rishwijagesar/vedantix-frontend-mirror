import { createFileRoute } from "@tanstack/react-router";
import AdminAuthGate from "@/admin/AdminAuthGate";
import GrowthAnalytics from "@/admin/GrowthAnalytics";

function GrowthPage() {
  return (
    <AdminAuthGate>
      <GrowthAnalytics />
    </AdminAuthGate>
  );
}

export const Route = createFileRoute("/admin_/growth")({
  head: () => ({
    meta: [
      { title: "Groei & conversie | Vedantix Control Center" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      {
        name: "description",
        content: "Interne Vedantix funnelanalyse voor de Online Groei Audit.",
      },
    ],
  }),
  component: GrowthPage,
});
