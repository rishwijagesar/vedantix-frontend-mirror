import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import ServicePrices from "../components/ServicePrices";
import { fetchPublicCatalog } from "../lib/public-content";
import { usePublicContent } from "../lib/use-public-content";
import { createBreadcrumbSchema, createFAQSchema, createServiceSchema } from "../utils/schema";
import { SERVICES } from "../data/services";
import { CONTACT } from "../constants/contact";
import "../styles/services.css";
export default function ServiceDetail({ slug, initialProducts = null }) {
  const service = SERVICES.find(item => item.slug === slug);
  const { data, loading, error } = usePublicContent(fetchPublicCatalog, initialProducts);
  const software = ["webapps-klantportalen", "ai-oplossingen", "koppelingen-automatisering"].includes(slug);
  const products = software ? [] : data.filter(product => service.codes.includes(product.code));
  const canonical = `https://vedantix.nl/${slug}`;
  const schemas = [createServiceSchema({ name: service.name, slug, description: service.description, audienceType: "Ondernemers en mkb in Nederland", serviceType: service.name }), createFAQSchema(service.faqs), createBreadcrumbSchema([{name:"Home",url:"https://vedantix.nl/"},{name:"Diensten",url:"https://vedantix.nl/diensten"},{name:service.name,url:canonical}])];
  const whatsapp = `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(`Hallo Vedantix, ik wil graag praten over ${service.name.toLowerCase()}.`)}`;
  return <><SEO title={service.title} description={service.description} canonical={canonical} schemas={schemas} /><NavBar /><main className="services-page">
    <section className="services-intro"><div className="services-wrap"><a className="services-back" href="/diensten">← Alle diensten</a><span className="services-kicker">{service.name}</span><h1>{service.headline}</h1><p>{service.intro}</p><a className="services-button" href="/contact#contact-form">Plan een bedrijfsscan →</a><a className="services-text-link" href="#investering">Bekijk de investering</a></div></section>
    <section className="services-section"><div className="services-wrap"><span className="services-kicker">Mogelijke toepassingen</span><h2>Zo kan het jouw bedrijf helpen.</h2><div className="service-steps">{service.useCases.map((text,index)=><article key={text}><b>0{index+1}</b><p>{text}</p></article>)}</div></div></section>
    <section className="services-section services-tint"><div className="services-wrap service-two-column"><div><span className="services-kicker">Van idee naar oplevering</span><h2>Dit spreken we samen af.</h2><p>Je hebt direct contact met Vedantix. We bepalen het werkproces en de scope, ontwikkelen met AI als hulpmiddel en controleren en testen professioneel. Jij accepteert voor livegang. Gebruik, beheer, support, gegevensverwerking en export worden vooraf afgesproken.</p></div><ul className="service-deliverables">{service.deliverables.map(text=><li key={text}>{text}</li>)}</ul></div></section>
    <section className="services-section" id="investering"><div className="services-wrap"><span className="services-kicker">Heldere investering</span><h2>Een passende eerste stap.</h2>{!software && loading ? <p role="status">Actuele prijzen laden…</p> : null}{!software && (error || (!loading && !products.length)) ? <p>De actuele prijs is op aanvraag. <a href="/contact">Vraag een offerte aan.</a></p> : null}{software ? <p>Voor maatwerk bedrijfssoftware: opstartkosten en een vast maandbedrag op offerte voor afgesproken functionaliteit, hosting, opslag, onderhoud en support. Inbegrepen gebruik, wijzigingen, uitbreidingen en externe abonnementen leggen we vooraf vast.</p> : <ServicePrices products={products} />}<p className="service-scope">{service.scope}</p><p>De hoofdprijzen zijn exclusief btw; de bedragen inclusief btw staan erbij. Maatwerk start na een overeengekomen offerte. Bestaande afspraken behouden hun afgesproken tarief.</p></div></section>
    <section className="services-section services-tint"><div className="services-wrap"><h2>Veelgestelde vragen over {service.name.toLowerCase()}</h2><div className="service-faqs">{service.faqs.map(faq=><details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></div></section>
    <section className="services-section"><div className="services-wrap services-callout"><h2>Waar wil jij mee beginnen?</h2><p>Vertel ons je doel. We bespreken wat haalbaar is, welke informatie nodig is en hoe we de eerste stap afbakenen.</p><a className="services-button" href="/contact#contact-form">Plan een bedrijfsscan →</a><p><a href="/software-op-maat">Software op maat</a> · <a href="/prijzen">Websiteprijzen en losse diensten</a> · <a href="/ai-vindbaarheid">SEO en AI-vindbaarheid</a> · <a href="/diensten">Andere diensten</a></p></div></section>
  </main></>;
}
