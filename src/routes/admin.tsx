import { createFileRoute } from "@tanstack/react-router";
import AdminControlCenter from "@/admin/AdminControlCenter";

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
  component: AdminControlCenter,
});
