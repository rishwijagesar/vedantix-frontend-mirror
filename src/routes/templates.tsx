import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Templates";

export const Route = createFileRoute("/templates")({
  head: () => publicHead("Website templates kiezen | Vedantix", "Bekijk website templates voor verschillende branches en kies het pakket dat past bij jouw bedrijf.", "/templates", { noindex: true }),
  component: Page,
});
