import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { ADDITIONAL_SERVICES } from "../data/additional-services";
import { createBreadcrumbSchema, createServiceSchema } from "../utils/schema";
import "../styles/services.css";

export default function AdditionalService({ slug }) {
  const service = ADDITIONAL_SERVICES.find(item => item.slug === slug);
  if (!service) return null;
  const canonical = `https://vedantix.nl/${slug}`;
  const schemas = [createServiceSchema({ name: service.name, slug, description: service.description, audienceType: "Mkb en zelfstandigen", serviceType: service.name }), createBreadcrumbSchema([{ name: "Home", url: "https://vedantix.nl/" }, { name: "Diensten", url: "https://vedantix.nl/diensten" }, { name: service.name, url: canonical }])];
  return <><SEO title={service.title} description={service.description} canonical={canonical} schemas={schemas} /><NavBar /><main className="services-page">
    <section className="services-intro"><div className="services-wrap"><Link className="services-back" to="/diensten">← Alle diensten</Link><span className="services-kicker">{service.name}</span><h1>{service.headline}</h1><p>{service.intro}</p><Button asChild className="services-button"><Link to="/contact#contact-form">Plan een bedrijfsscan →</Link></Button></div></section>
    {service.sections.map(section => <section className="services-section" key={section.title}><div className="services-wrap service-two-column"><div><h2>{section.title}</h2><p>{section.text}</p></div><ul className="service-deliverables">{section.items.map(item => <li key={item}>{item}</li>)}</ul></div></section>)}
    <section className="services-section services-tint"><div className="services-wrap"><span className="services-kicker">Duidelijke afspraken</span><h2>Werkzaamheden en kosten op offerte.</h2><p>{service.scope}</p><p><Link to="/prijzen#uitbreidingen">Hosting & zakelijke e-mail →</Link></p></div></section>
    <section className="services-section"><div className="services-wrap"><h2>Veelgestelde vragen</h2><div className="service-faqs">{service.faqs.map(faq => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></div></section>
    <section className="services-section services-tint"><div className="services-wrap services-callout"><h2>Wat wil jij verbeteren?</h2><p>Bespreek je doel en huidige werkwijze. Samen bepalen we een passende eerste stap.</p><Button asChild className="services-button"><Link to="/contact#contact-form">Plan een bedrijfsscan →</Link></Button><p><Link to="/diensten">Alle diensten</Link> · <Link to="/software-op-maat">Software op maat</Link> · <Link to="/website-laten-maken">Website laten maken</Link></p></div></section>
  </main></>;
}