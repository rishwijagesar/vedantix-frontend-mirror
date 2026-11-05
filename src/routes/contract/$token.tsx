import { createFileRoute } from "@tanstack/react-router";
import PublicContract from "@/pages/PublicContract";

export const Route = createFileRoute("/contract/$token")({
  head: () => ({ meta:[
    { title:"Contract ondertekenen | Vedantix" },
    { property: "og:title", content: "Contract ondertekenen | Vedantix" },
    { property: "og:description", content: "Beveiligde Vedantix-overeenkomst bekijken en ondertekenen." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name:"robots",content:"noindex, nofollow, noarchive" },
    { name:"description",content:"Beveiligde Vedantix-overeenkomst bekijken en ondertekenen." },
  ]}),
  component: ContractRoute,
});
function ContractRoute(){const {token}=Route.useParams();return <PublicContract token={token}/>;}
