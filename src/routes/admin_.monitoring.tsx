import { createFileRoute } from "@tanstack/react-router";
import AdminAuthGate from "@/admin/AdminAuthGate";
import MonitoringConsole from "@/admin/MonitoringConsole";

function MonitoringPage() {
  return (
    <AdminAuthGate>
      <MonitoringConsole />
    </AdminAuthGate>
  );
}

export const Route = createFileRoute("/admin/monitoring")({
  head: () => ({
    meta: [
      { title: "Monitoring | Vedantix Control Center" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      {
        name: "description",
        content: "Interne Vedantix monitoringconsole voor alerts, automation-runs en notificaties.",
      },
    ],
  }),
  component: MonitoringPage,
});
