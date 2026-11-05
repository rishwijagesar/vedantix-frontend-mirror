import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import ServiceCards from "../components/ServiceCards";
import { createBreadcrumbSchema } from "../utils/schema";
import "../styles/services.css";
export const servicesTitle = "Software, websites, hosting en marketing | Vedantix";
export const servicesDescription = "Software op maat, websites, hosting, AI en online marketing voor mkb en zelfstandigen. Vanuit Den Bosch voor heel Nederland, met duidelijke projectafspraken.";
export default function Diensten() {
  return <><SEO title={servicesTitle} description={servicesDescription} canonical="https://vedantix.nl/diensten" schemas={[createBreadcrumbSchema([{name:"Home",url:"https://vedantix.nl/"},{name:"Diensten",url:"https://vedantix.nl/diensten"}])]} /><NavBar /><main className="services-page">
    <section className="services-intro"><div className="services-wrap"><span className="services-kicker">Software, websites en hosting</span><h1>Software die meegroeit<br /><em>met jouw bedrijf.</em></h1><p>Maatwerk bedrijfssoftware brengt jouw processen samen in één applicatie. Snel ontwikkeld met AI als hulpmiddel, professioneel gecontroleerd en getest. Websites en hosting blijven volwaardige diensten.</p><a className="services-button" href="/contact#contact-form">Plan een bedrijfsscan →</a><a className="services-text-link" href="/prijzen">Bekijk de prijzen</a></div></section>
    <section className="services-section"><div className="services-wrap"><h2>Wat wil jij verbeteren?</h2><ServiceCards /></div></section>
    <section className="services-section services-tint"><div className="services-wrap"><span className="services-kicker">Van vraag naar werkende oplossing</span><h2>Klein beginnen. Gericht uitbreiden.</h2><div className="service-steps"><article><b>01 · Begrijpen</b><p>We bespreken je doel, huidige werkwijze en de mensen die de oplossing gaan gebruiken.</p></article><article><b>02 · Afspreken</b><p>Je krijgt een voorstel met fases, opstartkosten en een vast maandbedrag voor de afgesproken softwaredienstverlening. Gebruik, externe kosten en uitbreiding staan vooraf vast.</p></article><article><b>03 · Bouwen & verbeteren</b><p>AI helpt bij het bouwen. Vedantix controleert en test; jij accepteert voor livegang. Beheer, instructies en uitbreidingen volgen de afgesproken scope.</p></article></div></div></section>
    <section className="services-section"><div className="services-wrap services-callout"><h2>Een idee, maar nog geen technisch plan?</h2><p>Vertel waar je tijd verliest of waar je klanten vastlopen. We denken mee over een passende eerste stap.</p><a className="services-button" href="/contact#contact-form">Plan een bedrijfsscan →</a><p>Vedantix is gevestigd in ’s-Hertogenbosch en werkt met ondernemers en het mkb in heel Nederland.</p></div></section>
  </main></>;
}
