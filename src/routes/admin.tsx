import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Target } from "lucide-react";
import AdminControlCenterV3 from "@/admin/AdminControlCenterV3";
import AdminAuthGate from "@/admin/AdminAuthGate";

function AdminPage() {
  return (
    <AdminAuthGate>
      <AdminControlCenterV3 />
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        <a
          href="/admin/leads"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg ring-1 ring-slate-200 transition hover:bg-slate-50"
        >
          <Target size={16} />
          Leads
        </a>
        <a
          href="/admin/growth"
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
        >
          <BarChart3 size={16} />
          Groei & conversie
        </a>
      </div>
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