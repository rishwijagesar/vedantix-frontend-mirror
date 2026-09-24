import NavBar from "../components/NavBar";
import SEO from "../components/SEO";
import ServiceCards from "../components/ServiceCards";
import { createBreadcrumbSchema } from "../utils/schema";
import "../styles/services.css";
export const servicesTitle = "Websites, AI-oplossingen & apps voor bedrijven | Vedantix";
export const servicesDescription = "Vedantix helpt ondernemers met websites, AI-automatisering, webapps, mobiele apps, koppelingen en vindbaarheid. Vanuit Den Bosch voor bedrijven in Nederland.";
export default function Diensten() {
  return <><SEO title={servicesTitle} description={servicesDescription} canonical="https://vedantix.nl/diensten" schemas={[createBreadcrumbSchema([{name:"Home",url:"https://vedantix.nl/"},{name:"Diensten",url:"https://vedantix.nl/diensten"}])]} /><NavBar /><main className="services-page">
    <section className="services-intro"><div className="services-wrap"><span className="services-kicker">Digitale oplossingen voor ondernemers</span><h1>Meer ruimte om<br /><em>vooruit te gaan.</em></h1><p>Websites die klanten helpen kiezen. Apps die werk overzichtelijk maken. AI en automatisering die herhaalwerk verminderen. Begin bij wat jouw bedrijf nodig heeft.</p><a className="services-button" href="/contact">Bespreek je idee →</a><a className="services-text-link" href="/prijzen">Bekijk de prijzen</a></div></section>
    <section className="services-section"><div className="services-wrap"><h2>Wat wil jij verbeteren?</h2><ServiceCards /></div></section>
    <section className="services-section services-tint"><div className="services-wrap"><span className="services-kicker">Van vraag naar werkende oplossing</span><h2>Klein beginnen. Gericht uitbreiden.</h2><div className="service-steps"><article><b>01 · Begrijpen</b><p>We bespreken je doel, huidige werkwijze en de mensen die de oplossing gaan gebruiken.</p></article><article><b>02 · Afspreken</b><p>Je krijgt een afgebakende scope, prijs en planning. Externe en terugkerende kosten staan apart.</p></article><article><b>03 · Bouwen & verbeteren</b><p>We bouwen, testen samen en leveren op met uitleg. Uitbreidingen en beheer stemmen we daarna af.</p></article></div></div></section>
    <section className="services-section"><div className="services-wrap services-callout"><h2>Een idee, maar nog geen technisch plan?</h2><p>Vertel waar je tijd verliest of waar je klanten vastlopen. We denken mee over een passende eerste stap.</p><a className="services-button" href="/contact">Plan een kennismaking →</a><p>Vedantix is gevestigd in ’s-Hertogenbosch en werkt met ondernemers en het mkb in heel Nederland.</p></div></section>
  </main></>;
}
