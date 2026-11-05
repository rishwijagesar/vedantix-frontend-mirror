import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Voorwaarden";

export const Route = createFileRoute("/terms")({
  head: () => publicHead("Algemene voorwaarden | Vedantix", "Lees de algemene voorwaarden van Vedantix over diensten, betalingen, verantwoordelijkheden, intellectueel eigendom en aansprakelijkheid.", "/terms"),
  component: Page,
});
