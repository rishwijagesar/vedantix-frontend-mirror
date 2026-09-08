import { createFileRoute } from "@tanstack/react-router";
import PublicContract from "@/pages/PublicContract";

export const Route = createFileRoute("/contract/$token")({
  head: () => ({ meta:[
    { title:"Contract ondertekenen | Vedantix" },
    { name:"robots",content:"noindex, nofollow, noarchive" },
    { name:"description",content:"Beveiligde Vedantix-overeenkomst bekijken en ondertekenen." },
  ]}),
  component: ContractRoute,
});
function ContractRoute(){const {token}=Route.useParams();return <PublicContract token={token}/>;}
