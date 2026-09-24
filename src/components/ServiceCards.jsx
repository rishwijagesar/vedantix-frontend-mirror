import { ArrowUpRight, Globe2, Sparkles, LayoutDashboard, Smartphone, Workflow, Search } from "lucide-react";
import { SERVICES } from "../data/services";
import "../styles/services.css";
const icons = { Globe2, Sparkles, LayoutDashboard, Smartphone, Workflow };
export default function ServiceCards() {
  return <div className="service-grid">{[...SERVICES, { slug: "ai-vindbaarheid", name: "SEO & AI-vindbaarheid", short: "Maak je expertise vindbaar, helder en bruikbaar.", icon: "Search" }].map(service => {
    const Icon = icons[service.icon] || Search;
    return <a className="service-card" key={service.slug} href={`/${service.slug}`}><Icon size={26} aria-hidden="true" /><h3>{service.name}</h3><p>{service.short}</p><span>Ontdek de mogelijkheden <ArrowUpRight size={18} aria-hidden="true" /></span></a>;
  })}</div>;
}
