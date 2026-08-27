import { createFileRoute } from "@tanstack/react-router";
import Page from "@/pages/Prijzen";

export const Route = createFileRoute("/prijzen")({
  head: () => ({
    meta: [
      { title: "Duidelijke websiteprijzen | Eenmalig of per maand | Vedantix" },
      { name: "description", content: "Een professionele website vanaf \u20ac1.295 eenmalig of vanaf \u20ac99 per maand plus bouw en inrichting. Bekijk direct wat je betaalt en wat je krijgt." },
      { property: "og:title", content: "Duidelijke websiteprijzen | Eenmalig of per maand | Vedantix" },
      { property: "og:description", content: "Een professionele website vanaf \u20ac1.295 eenmalig of vanaf \u20ac99 per maand plus bouw en inrichting. Bekijk direct wat je betaalt en wat je krijgt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});
