import { createFileRoute } from "@tanstack/react-router";
import CustomerPreviewPageV2 from "@/pages/CustomerPreviewPageV2";

export const Route = createFileRoute("/preview/$token")({
  head: () => ({
    meta: [
      { title: "Website preview | Vedantix" },
    { property: "og:title", content: "Website preview | Vedantix" },
    { property: "og:description", content: "Beveiligde tijdelijke websitepreview van Vedantix." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
      { name: "referrer", content: "no-referrer" },
      { name: "description", content: "Beveiligde tijdelijke websitepreview van Vedantix." },
    ],
  }),
  component: PreviewRoute,
});

function PreviewRoute() {
  const { token } = Route.useParams();
  return <CustomerPreviewPageV2 token={token} />;
}
