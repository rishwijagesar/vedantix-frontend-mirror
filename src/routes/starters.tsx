import { publicHead } from "@/lib/public-head";
import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Starters";

export const Route = createFileRoute("/starters")({
  head: () => publicHead("Website voor starters en zelfstandigen | Vedantix", "Een professionele website voor starters en zelfstandigen. Bekijk de bestaande websitepakketten en bespreek je website met Vedantix.", "/starters"),
  component: Page,
});
