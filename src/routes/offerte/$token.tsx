import { createFileRoute } from "@tanstack/react-router";
import PublicQuote from "@/pages/PublicQuote";

function PublicQuoteRoute() {
  const { token } = Route.useParams();
  return <PublicQuote token={token} />;
}

export const Route = createFileRoute("/offerte/$token")({
  head: () => ({
    meta: [
      { title: "Offerte bekijken | Vedantix" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "description", content: "Beveiligde Vedantix-offerte bekijken en beantwoorden." },
    ],
  }),
  component: PublicQuoteRoute,
});
