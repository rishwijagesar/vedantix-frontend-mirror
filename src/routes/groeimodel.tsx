import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Groeimodel";

export const Route = createFileRoute("/groeimodel")({
  head: () => publicHead("Waarom Vedantix | Software, websites en heldere afspraken", "Vedantix ontwikkelt software rond jouw bedrijfsprocessen, met AI als hulpmiddel, professionele tests en heldere afspraken. Ook voor websites en hosting.", "/groeimodel"),
  component: Page,
});
