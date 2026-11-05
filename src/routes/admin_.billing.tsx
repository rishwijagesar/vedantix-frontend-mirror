import { createFileRoute } from "@tanstack/react-router";
import AdminAuthGate from "@/admin/AdminAuthGate";
import SalesBillingApp from "@/admin/SalesBillingApp";

function BillingPage() {
  return (
    <AdminAuthGate>
      <SalesBillingApp />
    </AdminAuthGate>
  );
}

export const Route = createFileRoute("/admin_/billing")({
  validateSearch: (search: Record<string, unknown>): { section?: string | undefined } => ({ section: typeof search["section"] === "string" ? search["section"] : undefined }),
  head: () => ({
    meta: [
      { title: "Sales & Billing | Vedantix Control Center" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "description", content: "Interne Vedantix module voor offertes, facturen, catalogus en bedrijfsgegevens." },
    ],
  }),
  component: BillingPage,
});
