import { ClipboardList, Lock, MapPin, Search, Star } from "lucide-react";
import SEO from "../components/SEO";
import NavBar from "../components/NavBar";
import ScanIntake from "../components/intake/ScanIntake";
import { CONTACT } from "../constants/contact";
import reviewSnapshot from "../data/google-reviews.json";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";
import "../styles/vx-intake.css";
import "../styles/vx-scan.css";

export const SCAN_TITLE = "Gratis bedrijfsscan voor het mkb | Vedantix";
export const SCAN_DESCRIPTION = "Plan je gratis bedrijfsscan. We kijken samen waar je bedrijf tijd verliest aan Excel, mail en losse tools, en wat software op maat oplevert.";

const BENEFITS = [
  { icon: Search, title: "Zicht op tijdvreters", text: "Welke stappen je dubbel doet en wat je kunt automatiseren." },
  { icon: ClipboardList, title: "Advies op maat", text: "Een overzicht met prioriteiten, zonder vakjargon." },
  { icon: MapPin, title: "Online of op locatie", text: "Wat jou het beste uitkomt, door heel Nederland." },
];

const STEPS = [
  { title: "Intake van 1 minuut", text: "Je beantwoordt een paar vragen in de chat. Zo weten we vooraf waar het knelt." },
  { title: "Gesprek over je bedrijf", text: "Online of op locatie lopen we samen door je processen, tools en handwerk." },
  { title: "Advies op papier", text: "Je krijgt een overzicht van wat je kunt automatiseren en wat het oplevert." },
  { title: "Jij beslist", text: "Wil je verder? Dan volgt een voorstel met vaste prijs. Geen verplichtingen." },
];

const FAQS = [
  { question: "Wat kost de bedrijfsscan?", answer: "Niets. De bedrijfsscan is gratis en vrijblijvend. Pas als je verder wilt, ontvang je een voorstel met een vaste prijs." },
  { question: "Voor wie is de bedrijfsscan bedoeld?", answer: "Voor ondernemers en mkb-bedrijven in heel Nederland die tijd verliezen aan Excel, mail, losse tools of dubbel werk." },
  { question: "Moet ik iets voorbereiden?", answer: "Nee. De intake in de chat duurt ongeveer een minuut. In het gesprek kijken we samen naar hoe je nu werkt." },
];

export default function Bedrijfsscan() {
  const canonical = "https://vedantix.nl/bedrijfsscan";
  const breadcrumbSchema = createBreadcrumbSchema([{ name: "Home", url: "https://vedantix.nl/" }, { name: "Bedrijfsscan", url: canonical }]);
  const faqSchema = createFAQSchema(FAQS);
  const rating = reviewSnapshot.overallRating.toFixed(1).replace(".", ",");

  return (
    <>
      <SEO title={SCAN_TITLE} description={SCAN_DESCRIPTION} canonical={canonical} schemas={[faqSchema, breadcrumbSchema]} />
      <div className="vx-page vx-scan">
        <NavBar />
        <main>
          <section className="vx-scan__hero" aria-labelledby="vx-scan-title">
            <div className="vx-scan__photo" aria-hidden="true">
              <img src="/images/vedantix-ondernemers-hero.webp" alt="" width="1536" height="1024" decoding="async" />
            </div>
            <div className="vx-container vx-scan__layout">
              <div className="vx-scan__copy">
                <span className="vx-scan__badge">Gratis en vrijblijvend</span>
                <h1 id="vx-scan-title" className="vx-h1">Plan je gratis <span className="vx-grad">bedrijfsscan</span></h1>
                <p className="vx-lead">We kijken samen waar je bedrijf tijd verliest aan Excel, mail en losse tools, en wat software op maat kan opleveren.</p>
                <ul className="vx-scan__benefits">
                  {BENEFITS.map(({ icon: Icon, title, text }) => (
                    <li key={title}><span aria-hidden="true"><Icon /></span><span><strong>{title}</strong>{text}</span></li>
                  ))}
                </ul>
                <p className="vx-scan__rating"><span aria-hidden="true"><Star /><Star /><Star /><Star /><Star /></span><b>{rating}</b> op Google</p>
              </div>
              <div className="vx-scan__chat">
                <ScanIntake sourcePath="/bedrijfsscan" titleId="vx-scan-intake-title" />
                <p className="vx-scan__alt"><Lock aria-hidden="true" />Liever direct contact? <a href={CONTACT.WHATSAPP_URL}>WhatsApp</a> of bel <a href={`tel:${CONTACT.PHONE_HREF}`}>{CONTACT.PHONE_DISPLAY}</a>.</p>
              </div>
            </div>
          </section>

          <section className="vx-section vx-scan__steps" aria-labelledby="vx-scan-steps-title">
            <div className="vx-container">
              <p className="vx-eyebrow">Zo werkt de scan</p>
              <h2 id="vx-scan-steps-title" className="vx-h2">Van intake tot advies, in vier stappen</h2>
              <ol>
                {STEPS.map((step, i) => (
                  <li key={step.title}><span aria-hidden="true">{i + 1}</span><strong>{step.title}</strong><p>{step.text}</p></li>
                ))}
              </ol>
            </div>
          </section>

          <section className="vx-section vx-section--soft vx-scan__faq" aria-labelledby="vx-scan-faq-title">
            <div className="vx-container">
              <h2 id="vx-scan-faq-title" className="vx-h2">Veelgestelde vragen</h2>
              <dl>
                {FAQS.map((faq) => (
                  <div key={faq.question}><dt>{faq.question}</dt><dd>{faq.answer}</dd></div>
                ))}
              </dl>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
