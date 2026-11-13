import { useEffect, useState } from "react";
import { ArrowRight, Check, FileText, MessageCircle, Receipt, ShieldCheck, Star, UserPlus } from "lucide-react";
import { SCAN_URL } from "../../data/positioning";

const WORDS = ["hele bedrijf", "aanvragen", "offertes", "planning", "facturen"];

/** Wisselt het laatste woord van de kop. Zonder JS of bij "minder beweging" blijft het eerste woord staan. */
function useRotatingWord() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = window.setInterval(() => setIndex((value) => (value + 1) % WORDS.length), 2600);
    return () => window.clearInterval(id);
  }, []);
  return WORDS[index];
}

export default function Hero() {
  const word = useRotatingWord();
  return (
    <section className="vx-hero" aria-labelledby="vx-hero-title">
      <div className="vx-hero__bg" aria-hidden="true"><span /><span /><span /></div>
      <div className="vx-container vx-hero__layout">
        <div className="vx-hero__copy">
          <p className="vx-eyebrow">Op maat gebouwd voor jouw bedrijf</p>
          <h1 id="vx-hero-title" className="vx-h1">
            Stop met dubbel werk.
            <br />
            Eén app voor je <span className="vx-sr">hele bedrijf</span>
            <span className="vx-rotor" aria-hidden="true">
              <span key={word} className="vx-rotor__word vx-grad">{word}</span>
            </span>
          </h1>
          <p className="vx-lead">
            Aanvragen, offertes, planning en facturen in één app die past bij hoe jouw team werkt.
            Vaste prijs vooraf, gebouwd en beheerd door één vast aanspreekpunt.
          </p>
          <div className="vx-hero__actions">
            <a className="vx-btn vx-btn--primary" href={SCAN_URL}>Plan een bedrijfsscan <ArrowRight aria-hidden="true" /></a>
            <a className="vx-btn vx-btn--ghost" href="/prijzen">Bekijk prijzen</a>
          </div>
          <p className="vx-hero__note">Vrijblijvend kennismaken. Omvang en kosten van de scan spreken we vooraf af.</p>
          <ul className="vx-hero__chips" aria-label="Waarom Vedantix">
            <li className="vx-chip"><Check aria-hidden="true" />Vaste prijs vooraf</li>
            <li className="vx-chip"><MessageCircle aria-hidden="true" />Eén vast aanspreekpunt</li>
            <li className="vx-chip"><ShieldCheck aria-hidden="true" />Eerst jouw akkoord, dan live</li>
          </ul>
          <p className="vx-hero__alt">
            Alleen een website nodig? <a className="vx-link" href="/website-laten-maken">Bekijk de websitepakketten <ArrowRight aria-hidden="true" /></a>
          </p>
        </div>

        <div className="vx-hv">
          <div className="vx-hv__ring" aria-hidden="true" />
          <figure className="vx-hv__photo">
            <img
              src="/images/vedantix-ondernemers-hero-small.webp"
              srcSet="/images/vedantix-ondernemers-hero-small.webp 768w, /images/vedantix-ondernemers-hero.webp 1536w"
              sizes="(min-width: 1024px) 560px, 92vw"
              width="768"
              height="512"
              alt="Twee ondernemers kijken tevreden samen naar een laptop"
              fetchpriority="high"
              decoding="async"
            />
          </figure>
          <p className="vx-hv__chip vx-hv__chip--a" aria-hidden="true"><span className="vx-hv__icon"><UserPlus /></span><span><b>Nieuwe aanvraag</b><small>In jouw app</small></span></p>
          <p className="vx-hv__chip vx-hv__chip--b" aria-hidden="true"><span className="vx-hv__icon"><FileText /></span><span><b>Offerte akkoord</b><small>In jouw app</small></span></p>
          <p className="vx-hv__chip vx-hv__chip--c" aria-hidden="true"><span className="vx-hv__icon"><Receipt /></span><span><b>Factuur betaald</b><small>In jouw app</small></span></p>
          <p className="vx-hv__rating"><span className="vx-hv__stars" aria-hidden="true"><Star /><Star /><Star /><Star /><Star /></span><span><b>5,0</b> Google-review</span></p>
        </div>
      </div>
    </section>
  );
}
