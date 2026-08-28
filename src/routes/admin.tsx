import { createFileRoute } from "@tanstack/react-router";
import AdminControlCenter from "@/admin/AdminControlCenter";
import AdminAuthGate from "@/admin/AdminAuthGate";

function AdminPage() {
  return (
    <AdminAuthGate>
      <AdminControlCenter />
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
