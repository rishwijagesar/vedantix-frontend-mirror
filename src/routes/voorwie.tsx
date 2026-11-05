import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/VoorWie";

export const Route = createFileRoute("/voorwie")({
  head: () => publicHead("Software en websites voor mkb en zelfstandigen | Vedantix", "Voor mkb en zelfstandigen in alle sectoren: bedrijfssoftware op maat, websites en hosting. Vanuit Den Bosch, voor heel Nederland.", "/voorwie"),
  component: Page,
});
