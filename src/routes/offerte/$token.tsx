import { createFileRoute } from "@tanstack/react-router";
import { Download } from "lucide-react";
import PublicQuote from "@/pages/PublicQuote";
import { billingPdfUrl } from "@/lib/billing-pdf";

function PublicQuoteRoute() {
  const { token } = Route.useParams();
  return <>
    <PublicQuote token={token} />
    <a href={billingPdfUrl("quote", token)} className="fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg" aria-label="Download offerte als PDF">
      <Download size={16}/> Download PDF
    </a>
  </>;
}

export const Route = createFileRoute("/offerte/$token")({
  head: () => ({
    meta: [
      { title: "Offerte bekijken | Vedantix" },
    { property: "og:title", content: "Offerte bekijken | Vedantix" },
    { property: "og:description", content: "Beveiligde Vedantix-offerte bekijken en beantwoorden." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "description", content: "Beveiligde Vedantix-offerte bekijken en beantwoorden." },
    ],
  }),
  component: PublicQuoteRoute,
});
