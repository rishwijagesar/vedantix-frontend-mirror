import { createFileRoute } from "@tanstack/react-router";
import PaymentStart from "@/pages/PaymentStart";

export const Route = createFileRoute("/betaling/$token")({
  head: () => ({ meta: [
    { title: "Factuur betalen | Vedantix" },
    { name: "robots", content: "noindex, nofollow, noarchive" },
    { name: "description", content: "Betaal je Vedantix-factuur veilig via Mollie." },
  ] }),
  component: PaymentStartRoute,
});

function PaymentStartRoute() {
  const { token } = Route.useParams();
  return <PaymentStart token={token} />;
}
