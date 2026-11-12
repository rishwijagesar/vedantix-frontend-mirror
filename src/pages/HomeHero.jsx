import { ArrowRight } from "lucide-react";
import { SCAN_URL } from "../data/positioning";
import "../styles/home-hero.css";

export default function HomeHero({ children }) {
  return (
    <>
      <section className="vedantix-hero" aria-labelledby="vedantix-hero-title">
        <div className="vedantix-hero__layout">
          <div className="vedantix-hero__copy">
            <p className="vedantix-hero__eyebrow">Software op maat voor het mkb</p>
            <h1 id="vedantix-hero-title">Minder dubbel werk. <span>Meer overzicht.</span></h1>
            <p className="vedantix-hero__intro">
              Breng aanvragen, offertes en planning samen in één app. Vedantix bouwt en beheert
              jouw software, met AI waar het je team tijd bespaart.
            </p>
            <a className="vedantix-hero__primary" href={SCAN_URL}>
              Plan een bedrijfsscan <ArrowRight size={18} aria-hidden="true" />
            </a>
          </div>
          <img
            className="vedantix-hero__photo"
            src="/images/vedantix-ondernemers-hero-small.webp"
            srcSet="/images/vedantix-ondernemers-hero-small.webp 768w, /images/vedantix-ondernemers-hero.webp 1536w"
            sizes="(max-width: 740px) calc(100vw - 36px), (max-width: 1200px) 42vw, 480px"
            alt=""
            width="768"
            height="512"
          />
        </div>
      </section>
      {children}
    </>
  );
}
