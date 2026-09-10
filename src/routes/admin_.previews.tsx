import { createFileRoute } from "@tanstack/react-router";
import AdminAuthGate from "@/admin/AdminAuthGate";
import WebsitePreviewsAdmin from "@/admin/WebsitePreviewsAdmin";

function PreviewAdminPage() {
  return <AdminAuthGate><WebsitePreviewsAdmin /></AdminAuthGate>;
}

export const Route = createFileRoute("/admin_/previews")({
  head: () => ({
    meta: [
      { title: "Website previews | Vedantix Control Center" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "description", content: "Interne Vedantix-module voor tijdelijke klantpreviewlinks." },
    ],
  }),
  component: PreviewAdminPage,
});
