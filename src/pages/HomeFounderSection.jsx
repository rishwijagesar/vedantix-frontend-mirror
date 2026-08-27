const FOUNDER_SECTION_STYLES = `
  .founder-section{
    padding:96px 5%;
    background:#f9fafb
  }

  .founder-grid{
    max-width:1100px;
    margin:0 auto;
    display:grid;
    grid-template-columns:320px 1fr;
    gap:32px;
    align-items:stretch
  }

  .founder-photo{
    background:linear-gradient(145deg,#e0e7ff,#f5f3ff);
    border:1px solid #e0e7ff;
    border-radius:24px;
    min-height:320px;
    display:flex;
    align-items:center;
    justify-content:center;
    padding:0;
    overflow:hidden
  }

  .founder-image{
    width:100%;
    height:100%;
    min-height:320px;
    object-fit:cover;
    object-position:center top;
    display:block
  }

  .founder-card{
    background:#fff;
    border:1px solid #eef2ff;
    border-radius:24px;
    padding:40px
  }

  .founder-card p{
    font-size:.95rem;
    color:#4b5563;
    line-height:1.9;
    margin-bottom:16px;
    max-width:680px
  }

  .founder-points{
    display:grid;
    grid-template-columns:1fr 1fr;
    gap:12px 18px;
    margin-top:24px
  }

  .founder-point{
    display:flex;
    gap:10px;
    align-items:flex-start;
    font-size:.86rem;
    color:#374151;
    font-weight:600
  }

  .founder-point::before{
    content:'✓';
    color:#6366f1;
    font-weight:900;
    flex-shrink:0
  }

  .founder-mini-testimonial{
    margin-top:28px;
    padding:22px;
    background:linear-gradient(135deg,#f8fafc,#eef2ff);
    border:1px solid #e0e7ff;
    border-radius:20px;
    box-shadow:0 8px 24px rgba(99,102,241,.06)
  }

  .founder-mini-head{
    display:flex;
    align-items:center;
    gap:12px;
    margin-bottom:14px
  }

  .founder-mini-avatar{
    width:56px;
    height:56px;
    border-radius:50%;
    object-fit:cover;
    object-position:center top;
    border:2px solid #fff;
    box-shadow:0 4px 12px rgba(0,0,0,.08);
    flex-shrink:0
  }

  .founder-mini-meta{
    display:flex;
    flex-direction:column;
    gap:2px
  }

  .founder-mini-meta strong{
    font-size:.94rem;
    color:#111827;
    font-weight:800;
    line-height:1.2
  }

  .founder-mini-meta span{
    font-size:.78rem;
    color:#6b7280;
    font-weight:600;
    line-height:1.3
  }

  .founder-mini-quote{
    margin:0;
    font-size:.92rem;
    line-height:1.8;
    color:#374151;
    font-style:italic;
    position:relative
  }

  .founder-mini-quote::before{
    content:'“';
    font-size:2rem;
    line-height:1;
    color:#818cf8;
    font-weight:900;
    margin-right:4px;
    vertical-align:top
  }

  @media(max-width:1024px){
    .founder-grid{
      grid-template-columns:1fr;
      max-width:720px
    }
  }

  @media(max-width:768px){
    .founder-section{
      padding:80px 5%
    }

    .founder-card{
      padding:32px 24px
    }

    .founder-points{
      grid-template-columns:1fr
    }
  }

  @media(max-width:480px){
    .founder-section{
      padding:60px 5%
    }

    .founder-mini-testimonial{
      padding:18px
    }
  }
`;

const FOUNDER_POINTS = [
  "Direct contact zonder lagen of accountmanagers",
  "Snelle communicatie via WhatsApp of telefoon",
  "Praktische focus op duidelijke websites die verkopen",
  "Ook geschikt als je nog geen bestaande website hebt",
];

export default function HomeFounderSection() {
  return (
    <section className="founder-section">
      <style>{FOUNDER_SECTION_STYLES}</style>

      <div className="founder-grid">
        <div className="founder-photo">
          <img
            src="/images/founder_long.png"
            alt="Rishwi van Vedantix"
            className="founder-image"
          />
        </div>

        <div className="founder-card">
          <div className="section-label">Achter Vedantix</div>
          <h2 className="section-h2">Persoonlijk contact, snelle oplevering en focus op resultaat</h2>

          <p>
            Vedantix is er voor lokale ondernemers die een professionele website willen zonder lang traject,
            vage communicatie of technisch gedoe.
          </p>

          <p>
            Je hebt direct contact, een duidelijke prijs en een praktische aanpak. Het doel is simpel:
            een website neerzetten die professioneel oogt en sneller tot actie leidt.
          </p>

          <p>
            Heb je nog geen bestaande website, geen reviews of nog geen uitgebreide content? Dan bouwen we juist
            vanuit eenvoud en duidelijkheid een sterke basis.
          </p>

          <div className="founder-points">
            {FOUNDER_POINTS.map((item) => (
              <div key={item} className="founder-point">
                <span>{item}</span>
              </div>
            ))}
          </div>

          <div className="founder-mini-testimonial">
            <div className="founder-mini-head">
              <img
                src="/images/founder.jpeg"
                alt="Rishwi van Vedantix"
                className="founder-mini-avatar"
              />

              <div className="founder-mini-meta">
                <strong>Rishwi</strong>
                <span>Founder van Vedantix</span>
              </div>
            </div>

            <p className="founder-mini-quote">
              Ik help lokale ondernemers aan een website die niet alleen mooi oogt, maar vooral
              duidelijker vertrouwen opwekt en sneller tot contact of aanvragen leidt.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}