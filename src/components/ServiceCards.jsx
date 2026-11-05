import { ArrowUpRight, Globe2, Server, Wrench, Sparkles, LayoutDashboard, PanelsTopLeft, Smartphone, Workflow, Search, Megaphone, Bot } from "lucide-react";
import { SERVICE_GROUPS } from "../data/service-navigation";
import { Link } from "@/lib/router-compat";
import "../styles/services.css";
const icons = { Globe2, Server, Wrench, Sparkles, LayoutDashboard, PanelsTopLeft, Smartphone, Workflow, Search, Megaphone, Bot };
export default function ServiceCards() {
  return <div className="service-grid">{SERVICE_GROUPS.flatMap(group => group.items).map(service => {
    const Icon = icons[service.icon] || Search;
    return <Link className="service-card" key={service.href} to={service.href}><Icon size={26} aria-hidden="true" /><h3>{service.label}</h3><p>{service.description}</p><span>Ontdek de mogelijkheden <ArrowUpRight size={18} aria-hidden="true" /></span></Link>;
  })}</div>;
}
