import NicheCarousel from "./NicheCarousel";
import "../styles/home-demo-section.css";

export default function HomeDemoSection() {
  return (
    <section id="demo" className="demo-section anchor-section">
      <div className="section-wrap">
        <div className="section-header center">
          <div className="section-label">Voorbeelden</div>
          <h2 className="section-h2">Zo zou jouw website eruit kunnen zien</h2>
          <p className="section-p">
            Bekijk voorbeelden per branche en krijg sneller gevoel bij de stijl, uitstraling en
            opbouw die past bij jouw bedrijf. Zo zie je direct wat mogelijk is, zonder dat je alles
            zelf hoeft te bedenken.
          </p>
        </div>

        <NicheCarousel />
      </div>
    </section>
  );
}