import { createFileRoute } from "@tanstack/react-router";
import AdminControlCenterV3 from "@/admin/AdminControlCenterV3";
import AdminAuthGate from "@/admin/AdminAuthGate";

function AdminPage() {
  return (
    <AdminAuthGate>
      <AdminControlCenterV3 />

    </AdminAuthGate>
  );
}

export const Route = createFileRoute("/admin")({
  validateSearch: (search: Record<string, unknown>) => ({ ...search, section: typeof search.section === "string" ? search.section : undefined }),
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
