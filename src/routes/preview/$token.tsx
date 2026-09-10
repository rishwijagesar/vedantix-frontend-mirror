import { createFileRoute } from "@tanstack/react-router";
import CustomerPreviewPageV2 from "@/pages/CustomerPreviewPageV2";

export const Route = createFileRoute("/preview/$token")({
  head: () => ({
    meta: [
      { title: "Website preview | Vedantix" },
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
