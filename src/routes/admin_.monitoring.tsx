import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import AdminAuthGate from "@/admin/AdminAuthGate";
import MigaduCredentialModal from "@/admin/MigaduCredentialModal";
import MonitoringConsole from "@/admin/MonitoringConsole";

function MonitoringPage() {
  const [migaduOpen, setMigaduOpen] = useState(false);

  return (
    <AdminAuthGate>
      <MonitoringConsole />
      <button
        type="button"
        onClick={() => setMigaduOpen(true)}
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
      >
        <Settings size={15} />
        Migadu instellen
      </button>
      <MigaduCredentialModal
        open={migaduOpen}
        onClose={() => setMigaduOpen(false)}
        onSaved={() => {
          setMigaduOpen(false);
          window.location.reload();
        }}
      />
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
