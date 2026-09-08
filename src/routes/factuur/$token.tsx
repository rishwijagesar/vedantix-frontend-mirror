import { createFileRoute } from "@tanstack/react-router";
import PublicInvoice from "@/pages/PublicInvoice";

export const Route = createFileRoute("/factuur/$token")({
  head: () => ({
    meta: [
      { title: "Factuur | Vedantix" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "description", content: "Beveiligde Vedantix factuur." },
    ],
  }),
  component: InvoiceRoute,
});

function InvoiceRoute() {
  const { token } = Route.useParams();
  return <PublicInvoice token={token}/>;
}
