import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Proces";

export const Route = createFileRoute("/proces")({
  head: () => publicHead("Werkwijze | Van bedrijfsscan tot beheerde software | Vedantix", "Van bedrijfsscan en concreet voorstel tot gefaseerd bouwen, testen, acceptatie en beheer. Heldere afspraken voor software en websites bij Vedantix.", "/proces"),
  component: Page,
});
