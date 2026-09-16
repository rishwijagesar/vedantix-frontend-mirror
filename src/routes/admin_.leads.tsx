import { createFileRoute } from "@tanstack/react-router";
import AdminAuthGate from "@/admin/AdminAuthGate";
import LeadsPipeline from "@/admin/LeadsPipeline";

function LeadsPage() {
  return (
    <AdminAuthGate>
      <LeadsPipeline />
    </AdminAuthGate>
  );
}

export const Route = createFileRoute("/admin_/leads")({
  head: () => ({
    meta: [
      { title: "Leads & Sales Pipeline | Vedantix Control Center" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      {
        name: "description",
        content: "Interne Vedantix leadpipeline voor opvolging van audits, gesprekken en offertes.",
      },
    ],
  }),
  component: LeadsPage,
});
