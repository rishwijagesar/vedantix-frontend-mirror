import { useEffect, useState } from "react";
import { ArrowRight, Check, MessageCircle, ShieldCheck, Star } from "lucide-react";
import ClientStrip from "./ClientStrip";
import { SCAN_URL } from "../../data/positioning";
import reviewSnapshot from "../../data/google-reviews.json";

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

export default function Hero({ clients = null }) {
  const word = useRotatingWord();
  return (
    <section className="vx-hero" aria-labelledby="vx-hero-title">
      <div className="vx-hero__photo" aria-hidden="true">
        <img
          src="/images/vedantix-ondernemers-hero.webp"
          srcSet="/images/vedantix-ondernemers-hero-small.webp 560w, /images/vedantix-ondernemers-hero.webp 1536w"
          sizes="(min-width: 960px) 62vw, 100vw"
          alt=""
          width="1536"
          height="1024"
          fetchPriority="high"
          decoding="async"
        />
      </div>
      <div className="vx-container vx-hero__layout">
        <div className="vx-hero__copy">
          <p className="vx-eyebrow">Op maat gebouwd voor jouw bedrijf</p>
          <h1 id="vx-hero-title" className="vx-h1">
            Stop met dubbel werk.
            <br />
            Eén app voor je{" "}
            <span className="vx-rotor">
              <span key={word} className="vx-rotor__word vx-grad">{word}</span>
            </span>
          </h1>
          <p className="vx-lead">
            Aanvragen, offertes, planning en facturen in één app die past bij hoe jouw team werkt.
            Vaste prijs vooraf, gebouwd en beheerd door één vast aanspreekpunt.
          </p>
          <div className="vx-hero__actions">
            <a className="vx-btn vx-btn--primary" href={SCAN_URL}>Plan een kennismaking <ArrowRight aria-hidden="true" /></a>
            <a className="vx-btn vx-btn--ghost" href="/prijzen">Bekijk prijzen</a>
          </div>
          <p className="vx-hero__note">Vrijblijvend kennismaken. De bedrijfsscan is gratis.</p>
          <ul className="vx-hero__chips" aria-label="Waarom Vedantix">
            <li className="vx-chip"><Check aria-hidden="true" />Vaste prijs vooraf</li>
            <li className="vx-chip"><MessageCircle aria-hidden="true" />Eén vast aanspreekpunt</li>
            <li className="vx-chip"><ShieldCheck aria-hidden="true" />Eerst jouw akkoord, dan live</li>
          </ul>
          <p className="vx-hero__rating"><span className="vx-hv__stars" aria-hidden="true"><Star /><Star /><Star /><Star /><Star /></span><span><b>{reviewSnapshot.overallRating.toFixed(1).replace(".", ",")}</b> · {reviewSnapshot.totalReviews} Google-{reviewSnapshot.totalReviews === 1 ? "review" : "reviews"}</span></p>
          <p className="vx-hero__alt">
            Alleen een website nodig? <a className="vx-link" href="/website-laten-maken">Bekijk de websitepakketten <ArrowRight aria-hidden="true" /></a>
          </p>
        </div>
      </div>

      <div className="vx-container vx-hero__clients">
        <ClientStrip clients={clients} />
      </div>
    </section>
  );
}
