import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Privacy";

export const Route = createFileRoute("/privacy")({
  head: () => publicHead("Privacybeleid | Vedantix", "Lees hoe Vedantix persoonsgegevens, cookies, analytics en AVG-rechten behandelt en hoe je contact opneemt over je gegevens.", "/privacy"),
  component: Page,
});
