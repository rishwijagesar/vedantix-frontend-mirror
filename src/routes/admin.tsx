import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import AdminControlCenterV3 from "@/admin/AdminControlCenterV3";
import AdminAuthGate from "@/admin/AdminAuthGate";

function AdminPage() {
  return (
    <AdminAuthGate>
      <AdminControlCenterV3 />
      <a
        href="/admin/growth"
        className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
      >
        <BarChart3 size={16} />
        Groei & conversie
      </a>
    </AdminAuthGate>
  );
}

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Vedantix Control Center" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      {
        name: "description",
        content: "Interne Vedantix beheeromgeving voor klanten, domeinen en websites.",
      },
    ],
  }),
  component: AdminPage,
});
