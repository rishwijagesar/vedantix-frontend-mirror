import { createFileRoute } from "@tanstack/react-router";
import AdminControlCenterV2 from "@/admin/AdminControlCenterV2";
import AdminAuthGate from "@/admin/AdminAuthGate";

function AdminPage() {
  return (
    <AdminAuthGate>
      <AdminControlCenterV2 />
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
