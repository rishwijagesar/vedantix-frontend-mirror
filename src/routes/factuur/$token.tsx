import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import PublicInvoice from "@/pages/PublicInvoice";
import { billingPdfUrl } from "@/lib/billing-pdf";

export const Route = createFileRoute("/factuur/$token")({
  head: () => ({
    meta: [
      { title: "Factuur | Vedantix" },
    { property: "og:title", content: "Factuur | Vedantix" },
    { property: "og:description", content: "Beveiligde Vedantix factuur." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "description", content: "Beveiligde Vedantix factuur." },
    ],
  }),
  component: InvoiceRoute,
});

function InvoiceRoute() {
  const { token } = Route.useParams();
  return <>
    <PublicInvoice token={token}/>
    <a href={billingPdfUrl("invoice", token)} className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg print:hidden" aria-label="Download factuur als PDF">
      <Download size={16}/> Download PDF
    </a>
  </>;
}
