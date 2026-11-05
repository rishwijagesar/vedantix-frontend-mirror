import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/DataDeletion";

export const Route = createFileRoute("/data-deletion")({
  head: () => publicHead("Gegevensverwijdering aanvragen | Vedantix", "Vraag verwijdering van persoonsgegevens aan bij Vedantix. Lees welke gegevens nodig zijn en welke gegevens wettelijk bewaard kunnen blijven.", "/data-deletion"),
  component: Page,
});
