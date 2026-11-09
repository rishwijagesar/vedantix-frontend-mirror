import { ArrowRight, CalendarDays, Check, FileText, Inbox } from "lucide-react";
import { SCAN_URL } from "../data/positioning";
import "../styles/home-hero.css";

const workflow = [
  { icon: Inbox, title: "Aanvraag komt binnen", detail: "De klantgegevens staan meteen op één plek." },
  { icon: FileText, title: "Offerte staat klaar", detail: "Je gebruikt dezelfde gegevens voor je offerte." },
  { icon: CalendarDays, title: "Het team kan plannen", detail: "Na akkoord is de opdracht klaar om in te plannen." },
];

export default function HomeHero({ children }) {
  return (
    <>
      <section className="vedantix-hero" aria-labelledby="vedantix-hero-title">
        <div className="vedantix-hero__layout">
          <div className="vedantix-hero__copy">
            <p className="vedantix-hero__eyebrow">Software op maat voor het mkb</p>
            <h1 id="vedantix-hero-title">Minder dubbel werk.<br /><span>Meer grip op je bedrijf.</span></h1>
            <p className="vedantix-hero__intro">
              Breng aanvragen, offertes en planning samen in één app op maat.
              Vedantix bouwt en beheert de software, zodat jouw team sneller verder kan.
            </p>
            <div className="vedantix-hero__actions">
              <a className="vedantix-hero__primary" href={SCAN_URL}>
                Plan een bedrijfsscan <ArrowRight size={18} aria-hidden="true" />
              </a>
              <a className="vedantix-hero__secondary" href="/diensten">
                Bekijk onze diensten <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <p className="vedantix-hero__note">Samen brengen we in kaart waar jouw team tijd kan winnen.</p>
          </div>
          <div className="vedantix-hero__example">
            <div className="vedantix-hero__example-heading">
              <p>Voorbeeld van een werkproces</p>
              <h2>Van aanvraag naar opdracht</h2>
            </div>
            <ol className="vedantix-hero__steps">
              {workflow.map(({ icon: Icon, title, detail }) => (
                <li key={title}>
                  <span className="vedantix-hero__step-icon"><Icon size={20} aria-hidden="true" /></span>
                  <div><strong>{title}</strong><p>{detail}</p></div>
                </li>
              ))}
            </ol>
            <p className="vedantix-hero__outcome"><Check size={17} aria-hidden="true" /> Eén keer invoeren, samen verder werken.</p>
          </div>
        </div>
        {children}
      </section>

      <div className="hero-sticky-cta">
        <a href="https://wa.me/31626219989" target="_blank" rel="noreferrer" className="hero-btn-wa">
          💬 Start gesprek
        </a>
      </div>
    </>
  );
}
