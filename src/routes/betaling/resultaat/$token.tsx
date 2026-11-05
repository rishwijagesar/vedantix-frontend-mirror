import { createFileRoute } from "@tanstack/react-router";
import PaymentResult from "@/pages/PaymentResult";

export const Route = createFileRoute("/betaling/resultaat/$token")({
  head: () => ({ meta: [
    { title: "Betaalstatus | Vedantix" },
    { property: "og:title", content: "Betaalstatus | Vedantix" },
    { property: "og:description", content: "Controleer de status van je Vedantix-betaling." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow, noarchive" },
    { name: "description", content: "Controleer de status van je Vedantix-betaling." },
  ] }),
  component: PaymentResultRoute,
});

function PaymentResultRoute() {
  const { token } = Route.useParams();
  return <PaymentResult token={token} />;
}
