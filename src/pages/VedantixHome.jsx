import { useState } from "react";

// Ensure mobile viewport
if (typeof document !== "undefined") {
  let vp = /** @type {HTMLMetaElement | null} */ (
    document.querySelector('meta[name="viewport"]')
  );
  if (!vp) {
    vp = document.createElement("meta");
    vp.name = "viewport";
    vp.content = "width=device-width, initial-scale=1.0";
    document.head.appendChild(vp);
  }
}



const NAV_MENUS = [
  { label: "Diensten", items: [
    { href: "/Starters", label: "Configurator" },
    { href: "/Templates", label: "Template gallery" },
    { href: "/VoorWie", label: "Voor wie" },
  ]},
  { label: "Informatie", items: [
    { href: "/Prijzen", label: "Prijsvergelijker" },
    { href: "/Proces", label: "Hoe het werkt" },
  ]},
  { label: "Contact", items: [
    { href: "/Planning", label: "Afspraak plannen" },
    { href: "#contact", label: "Offerte aanvragen" },
  ]},
];

function Nav() {
  const [open, setOpen] = useState(null);
  const [mob, setMob] = useState(false);

  return (
    <>
      <style>{`
        .vd-nav{position:fixed;top:0;left:0;right:0;z-index:200;background:rgba(10,22,40,0.97);backdrop-filter:blur(12px);padding:0 5%;display:flex;align-items:center;justify-content:space-between;height:60px}
        .vd-logo{color:#fff;font-weight:900;font-size:1.35rem;letter-spacing:-0.5px;text-decoration:none}
        .vd-menu{display:flex;gap:4px;list-style:none;align-items:center}
        .vd-menu-item{position:relative}
        .vd-menu-btn{background:none;border:none;color:rgba(255,255,255,0.78);font-size:0.88rem;font-weight:600;cursor:pointer;padding:8px 12px;border-radius:7px;display:flex;align-items:center;gap:5px;font-family:inherit;transition:all 0.15s}
        .vd-menu-btn:hover{background:rgba(255,255,255,0.08);color:#fff}
        .vd-chev{font-size:0.6rem;opacity:0.6;transition:transform 0.2s;display:inline-block}
        .vd-chev.open{transform:rotate(180deg)}
        .vd-dropdown{position:absolute;top:calc(100% + 8px);left:0;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.18);min-width:230px;padding:8px;z-index:300;animation:dropIn 0.15s ease}
        @keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .vd-dd-item{display:block;padding:10px 12px;border-radius:9px;text-decoration:none;transition:background 0.12s}
        .vd-dd-item:hover{background:#f7f9fc}
        .vd-dd-label{font-weight:700;font-size:0.88rem;color:#0a1628;display:block}
        .vd-dd-desc{font-size:0.76rem;color:#94a3b8;display:block;margin-top:1px}
        .vd-cta{background:#1a73e8;color:#fff;padding:9px 20px;border-radius:8px;font-weight:700;font-size:0.87rem;text-decoration:none;transition:background 0.2s;white-space:nowrap}
        .vd-cta:hover{background:#00c2ff}
        .vd-hbg{display:none;background:none;border:none;cursor:pointer;flex-direction:column;gap:5px;padding:4px}
        .vd-hbg span{display:block;width:22px;height:2px;background:#fff;border-radius:2px}
        .vd-mob{position:fixed;top:60px;left:0;right:0;background:#0a1628;border-top:1px solid rgba(255,255,255,0.08);padding:16px 5% 20px;z-index:199;display:flex;flex-direction:column;gap:2px}
        .vd-mob-sec{color:rgba(255,255,255,0.4);font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:10px 8px 4px}
        .vd-mob-lnk{color:rgba(255,255,255,0.85);text-decoration:none;font-size:0.9rem;font-weight:600;padding:10px 8px;border-radius:8px;display:block}
        .vd-mob-lnk:hover{background:rgba(255,255,255,0.07)}
        @media(max-width:768px){.vd-menu{display:none}.vd-hbg{display:flex}}
      `}</style>
      <nav className="vd-nav">
        <a href="/VedantixHome" className="vd-logo">Vedantix</a>
        <ul className="vd-menu">
          {NAV_MENUS.map(m => (
            <li key={m.label} className="vd-menu-item"
                onMouseEnter={() => setOpen(m.label)}
                onMouseLeave={() => setOpen(null)}>
              <button className="vd-menu-btn">
                {m.label}
                <span className={`vd-chev${open === m.label ? " open" : ""}`}>▼</span>
              </button>
              {open === m.label && (
                <div className="vd-dropdown">
                  {m.items.map(i => (
                    <a key={i.href} href={i.href} className="vd-dd-item">
                      <span className="vd-dd-label">{i.label}</span>
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="#contact" className="vd-cta">Offerte aanvragen</a>
          <button className="vd-hbg" onClick={() => setMob(p => !p)} aria-label="Menu">
            <span/><span/><span/>
          </button>
        </div>
      </nav>
      {mob && (
        <div className="vd-mob">
          {NAV_MENUS.map(m => (
            <div key={m.label}>
              <div className="vd-mob-sec">{m.label}</div>
              {m.items.map(i => (
                <a key={i.href} href={i.href} className="vd-mob-lnk" onClick={() => setMob(false)}>{i.label}</a>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function WAWidget() {
  const [open, setOpen] = useState(false);
  const url = "https://wa.me/310626219989?text=Hallo%20Vedantix!%20Ik%20heb%20een%20vraag.";
  return (
    <>
      <style>{`
        .wa-fab{position:fixed;bottom:28px;right:28px;z-index:500}
        .wa-btn{width:58px;height:58px;border-radius:50%;background:#25d366;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(37,211,102,0.45);display:flex;align-items:center;justify-content:center;transition:transform 0.2s;position:relative}
        .wa-btn:hover{transform:scale(1.08)}
        .wa-bubble{position:absolute;bottom:68px;right:0;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);width:290px;overflow:hidden;animation:waPop 0.2s ease}
        @keyframes waPop{from{opacity:0;transform:scale(0.92) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .wa-hdr{background:#075e54;padding:16px 18px;display:flex;align-items:center;gap:12px;position:relative}
        .wa-av{width:40px;height:40px;border-radius:50%;background:#128c7e;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}
        .wa-nm{color:#fff;font-weight:700;font-size:0.92rem}
        .wa-st{color:rgba(255,255,255,0.6);font-size:0.75rem;margin-top:1px}
        .wa-body{padding:16px 18px}
        .wa-msg{background:#f0f0f0;border-radius:0 10px 10px 10px;padding:10px 13px;font-size:0.85rem;color:#1a1a2e;line-height:1.5;margin-bottom:14px}
        .wa-open{display:block;background:#25d366;color:#fff;text-align:center;padding:11px;border-radius:9px;font-weight:700;text-decoration:none;font-size:0.88rem}
        .wa-x{position:absolute;top:10px;right:12px;background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:1rem}
        .wa-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;width:18px;height:18px;border-radius:50%;font-size:0.65rem;font-weight:800;display:flex;align-items:center;justify-content:center}
      `}</style>
      <div className="wa-fab">
        {open && (
          <div className="wa-bubble">
            <div className="wa-hdr">
              <div className="wa-av">V</div>
              <div>
                <div className="wa-nm">Vedantix</div>
                <div className="wa-st">Gemiddeld binnen 1 uur antwoord</div>
              </div>
              <button className="wa-x" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="wa-body">
              <div className="wa-msg">👋 Heb je een vraag over onze websites?<br/><br/>Stuur ons een WhatsApp-bericht!</div>
              <a href={url} target="_blank" rel="noreferrer" className="wa-open">Chat openen op WhatsApp</a>
            </div>
          </div>
        )}
        <button className="wa-btn" onClick={() => setOpen(p => !p)} aria-label="WhatsApp">
          {!open && <div className="wa-badge">1</div>}
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </button>
      </div>
    </>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div style={{ background: "#f0fdf4", border: "2px solid #10b981", borderRadius: 12, padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: "2rem", marginBottom: 12 }}>✅</div>
        <h3 style={{ color: "#065f46", marginBottom: 8 }}>Verstuurd!</h3>
        <p style={{ color: "#047857" }}>We nemen binnen 24 uur contact op.</p>
      </div>
    );
  }
  return (
    <form onSubmit={e => { e.preventDefault(); setSent(true); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <input type="text" placeholder="Naam" required style={iStyle} />
        <input type="text" placeholder="Bedrijfsnaam" style={iStyle} />
      </div>
      <input type="email" placeholder="E-mailadres" required style={iStyle} />
      <input type="tel" placeholder="Telefoonnummer" style={iStyle} />
      <select style={iStyle}>
        <option value="">Welk pakket interesseert u?</option>
        <option>Starter — €399</option>
        <option>Business — €799</option>
        <option>Premium — €1499</option>
        <option>Weet ik nog niet</option>
      </select>
      <textarea placeholder="Vertel kort over uw bedrijf en wat u zoekt..." rows={4} style={{ ...iStyle, resize: "vertical" }} />
      <button type="submit" style={{ background: "#1a73e8", color: "#fff", padding: "13px", borderRadius: 9, fontWeight: 700, fontSize: "0.93rem", border: "none", cursor: "pointer", width: "100%" }}>
        Offerte aanvragen →
      </button>
    </form>
  );
}

const iStyle = { width: "100%", padding: "12px 15px", border: "2px solid #e5e7eb", borderRadius: 9, fontSize: "0.9rem", fontFamily: "inherit", outline: "none", background: "#f7f9fc" };

export default function VedantixHome() {
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#1a1a2e", background: "#fff", lineHeight: 1.6 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--navy:#0a1628;--blue:#1a73e8;--accent:#00c2ff;--gray:#f7f9fc;--muted:#6b7280}
        html{scroll-behavior:smooth}
        section{padding:90px 5%}
        .tag{display:inline-block;background:rgba(26,115,232,0.1);color:#1a73e8;font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 12px;border-radius:100px;margin-bottom:14px}
        h2{font-size:2.1rem;font-weight:800;line-height:1.2;margin-bottom:12px}
        .sub{color:#6b7280;font-size:1rem;max-width:560px}
        .center{text-align:center}.center .sub{margin:0 auto}
        .hero{min-height:100vh;background:linear-gradient(135deg,#0a1628 0%,#0d2146 60%,#0a1628 100%);display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 5% 80px;position:relative;overflow:hidden}
        .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 40%,rgba(0,194,255,0.08) 0%,transparent 60%)}
        .hi{position:relative;z-index:1;max-width:780px}
        .hbadge{display:inline-flex;align-items:center;gap:7px;background:rgba(0,194,255,0.12);border:1px solid rgba(0,194,255,0.25);color:#00c2ff;padding:6px 16px;border-radius:100px;font-size:0.8rem;font-weight:700;margin-bottom:28px}
        .hero h1{font-size:3.2rem;color:#fff;font-weight:900;letter-spacing:-1.5px;line-height:1.08;margin-bottom:20px}
        .hero h1 em{font-style:normal;color:#00c2ff}
        .hero p{color:rgba(255,255,255,0.62);font-size:1.12rem;max-width:580px;margin:0 auto 38px;line-height:1.7}
        .hbtns{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:48px}
        .btn-p{background:#1a73e8;color:#fff;padding:14px 32px;border-radius:10px;font-weight:700;text-decoration:none;font-size:0.97rem;transition:all 0.2s;box-shadow:0 4px 18px rgba(26,115,232,0.4)}
        .btn-p:hover{background:#00c2ff;transform:translateY(-1px)}
        .btn-g{background:rgba(255,255,255,0.08);color:#fff;padding:14px 28px;border-radius:10px;font-weight:600;text-decoration:none;font-size:0.93rem;border:1px solid rgba(255,255,255,0.18);transition:all 0.2s}
        .btn-g:hover{background:rgba(255,255,255,0.14)}
        .hstats{display:flex;justify-content:center;gap:40px;flex-wrap:wrap}
        .stat strong{display:block;font-size:1.65rem;font-weight:900;color:#fff;line-height:1}
        .stat span{font-size:0.78rem;color:rgba(255,255,255,0.45);margin-top:4px;display:block;text-transform:uppercase;letter-spacing:0.5px}
        .steps-sec{background:#f7f9fc}
        .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:24px;margin-top:52px}
        .step{background:#fff;border-radius:16px;padding:30px 24px;box-shadow:0 2px 12px rgba(0,0,0,0.05)}
        .step-n{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#1a73e8,#00c2ff);color:#fff;font-weight:900;font-size:1rem;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
        .step h3{font-size:1rem;font-weight:700;margin-bottom:8px}
        .step p{color:#6b7280;font-size:0.9rem}
        .grid-who{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;margin-top:44px}
        .wc{background:#fff;border:2px solid #e8eef5;border-radius:13px;padding:22px 14px;text-align:center;transition:all 0.2s;text-decoration:none;color:inherit;display:block}
        .wc:hover{border-color:#1a73e8;transform:translateY(-2px)}
        .wc .ic{font-size:1.9rem;margin-bottom:9px;display:block}
        .wc span:last-child{font-size:0.85rem;font-weight:600}
        .pricing-sec{background:#0a1628}
        .pricing-sec .tag{background:rgba(0,194,255,0.12);color:#00c2ff}
        .pricing-sec h2{color:#fff}
        .pricing-sec .sub{color:rgba(255,255,255,0.45)}
        .pgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:22px;margin-top:52px}
        .pc{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:38px 30px;color:#fff;position:relative;transition:transform 0.2s}
        .pc:hover{transform:translateY(-4px);border-color:rgba(0,194,255,0.4)}
        .pc.hot{background:linear-gradient(145deg,rgba(26,115,232,0.2),rgba(0,194,255,0.1));border-color:#00c2ff}
        .hbadge2{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#00c2ff;color:#0a1628;padding:3px 16px;border-radius:100px;font-size:0.75rem;font-weight:800;white-space:nowrap}
        .pn{font-size:0.82rem;font-weight:700;color:#00c2ff;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
        .pp{font-size:2.9rem;font-weight:900;line-height:1;margin:10px 0 4px}
        .pp sup{font-size:1rem;font-weight:500;opacity:0.6;vertical-align:super}
        .pd{color:rgba(255,255,255,0.45);font-size:0.85rem;margin-bottom:26px}
        .pl{list-style:none;margin-bottom:32px}
        .pl li{padding:7px 0;font-size:0.9rem;color:rgba(255,255,255,0.8);border-bottom:1px solid rgba(255,255,255,0.07);display:flex;gap:9px}
        .pl li::before{content:"✓";color:#00c2ff;font-weight:700;flex-shrink:0}
        .pb{display:block;text-align:center;padding:13px;border-radius:10px;font-weight:700;text-decoration:none;font-size:0.93rem;transition:all 0.2s}
        .pb-out{border:2px solid rgba(255,255,255,0.3);color:#fff}.pb-out:hover{border-color:#00c2ff;color:#00c2ff}
        .pb-fill{background:#1a73e8;color:#fff}.pb-fill:hover{background:#00c2ff}
        .why-sec{background:#f7f9fc}
        .wgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:22px;margin-top:44px}
        .wyc{background:#fff;border-radius:15px;padding:30px 26px;box-shadow:0 2px 10px rgba(0,0,0,0.05)}
        .wyc .ic{font-size:1.9rem;margin-bottom:14px;display:block}
        .wyc h3{font-size:1rem;font-weight:700;margin-bottom:8px}
        .wyc p{color:#6b7280;font-size:0.88rem}
        .cwrap{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start;max-width:940px;margin:0 auto}
        .ci h3{font-size:1.35rem;font-weight:800;margin-bottom:14px}
        .ci p{color:#6b7280;margin-bottom:22px;font-size:0.92rem}
        .crow{display:flex;align-items:center;gap:12px;margin-bottom:13px}
        .cic{width:38px;height:38px;background:#f7f9fc;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
        .crow span{font-size:0.9rem;font-weight:500}
        @media(max-width:768px){
          .hero h1{font-size:2.2rem;letter-spacing:-0.5px}
          .hero p{font-size:0.97rem}
          .cwrap{grid-template-columns:1fr;gap:32px}
          .hstats{gap:18px}
          section{padding:64px 5%}
          h2{font-size:1.7rem}
          .pgrid{grid-template-columns:1fr}
          .wgrid{grid-template-columns:1fr 1fr}
          .steps{grid-template-columns:1fr}
          .grid-who{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}
          .hbtns{flex-direction:column;align-items:center}
          .btn-p,.btn-g{width:100%;max-width:320px;text-align:center}
          .stat strong{font-size:1.35rem}
        }
        @media(max-width:480px){
          .hero{padding:90px 5% 60px}
          .hero h1{font-size:1.8rem}
          section{padding:52px 5%}
          h2{font-size:1.5rem}
          .pgrid{grid-template-columns:1fr}
          .wgrid{grid-template-columns:1fr}
          .hstats{gap:14px}
          .stat strong{font-size:1.2rem}
          .pc{padding:28px 20px}
          .vd-cta{display:none}
        }
      `}</style>

      <Nav />
      <WAWidget />

      {/* HERO */}
      <section className="hero">
        <div className="hi">
          <div className="hbadge">⚡ Website binnen 48 uur live</div>
          <h1>Jouw bedrijf verdient een<br/><em>professionele website</em></h1>
          <p>Van kapper tot aannemer — wij bouwen jouw website snel, betaalbaar en volledig verzorgd. Inclusief hosting, domein en SSL.</p>
          <div className="hbtns">
            <a href="#contact" className="btn-p">Gratis offerte aanvragen</a>
            <a href="/Templates" className="btn-g">Bekijk templates</a>
          </div>
          <div className="hstats">
            <div className="stat"><strong>48u</strong><span>Gemiddelde levertijd</span></div>
            <div className="stat"><strong>€399</strong><span>Vanaf prijs</span></div>
            <div className="stat"><strong>100%</strong><span>Inclusief hosting</span></div>
            <div className="stat"><strong>24/7</strong><span>Online bereikbaar</span></div>
          </div>
        </div>
      </section>

      {/* HOE HET WERKT */}
      <section id="hoe-het-werkt" className="steps-sec">
        <div className="center" style={{ marginBottom: 0 }}>
          <span className="tag">Hoe het werkt</span>
          <h2>Van idee naar live website in 4 stappen</h2>
          <p className="sub center">Geen technische kennis nodig. Wij regelen alles.</p>
        </div>
        <div className="steps">
          {[
            ["1","Vertel ons over je bedrijf","Vul ons korte formulier in. Naam, branche, diensten — meer hebben we niet nodig."],
            ["2","Wij bouwen jouw website","Ons team levert binnen 48 uur een professionele, mobielvriendelijke website op."],
            ["3","Live — klaar voor klanten","Domein, hosting, SSL — volledig ingericht en klaar voor gebruik."],
            ["4","Aanpassingen wanneer jij wil","Later iets aanpassen? Snel geregeld tegen een vaste lage prijs."],
          ].map(([n, h, p]) => (
            <div key={n} className="step">
              <div className="step-n">{n}</div>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* VOOR WIE */}
      <section id="voor-wie">
        <span className="tag">Voor wie</span>
        <h2>Voor elk bedrijf,<br/>groot of klein</h2>
        <p className="sub">Of je nu net begint of al jaren actief bent — jij verdient een website die werkt.</p>
        <div className="grid-who">
          {[["✂️","Kapper"],["🍽️","Restaurant"],["📸","Fotograaf"],["🔨","Klusbedrijf"],["🎨","Schilder"],["💼","ZZP'er"],["🏪","Winkel"],["🚀","Starter"],["🏗️","Aannemer"],["💆","Schoonheidssalon"],["🎵","Muzikant"],["🏋️","Fitness coach"]].map(([ic, lb]) => (
            <a key={lb} href="#contact" className="wc">
              <span className="ic">{ic}</span>
              <span>{lb}</span>
            </a>
          ))}
        </div>
      </section>

      {/* PRIJZEN */}
      <section id="prijzen" className="pricing-sec">
        <div className="center">
          <span className="tag">Prijzen</span>
          <h2>Transparante prijzen,<br/>geen verrassingen</h2>
          <p className="sub">Eenmalige betaling. Geen maandelijkse verborgen kosten.</p>
        </div>
        <div className="pgrid">
          <div className="pc">
            <div className="pn">Starter</div>
            <div className="pp"><sup>€</sup>399</div>
            <div className="pd">Eenmalig — ideaal voor starters</div>
            <ul className="pl">
              <li>1-pagina professionele website</li><li>Mobielvriendelijk design</li>
              <li>Contactformulier</li><li>Hosting (1 jaar) + 500 MB opslag</li>
              <li>SSL-certificaat</li><li>Levering binnen 48 uur</li>
            </ul>
            <a href="#contact" className="pb pb-out">Start configuratie</a>
          </div>
          <div className="pc hot">
            <div className="hbadge2">MEEST GEKOZEN</div>
            <div className="pn">Business</div>
            <div className="pp"><sup>€</sup>799</div>
            <div className="pd">Eenmalig — voor groeiende bedrijven</div>
            <ul className="pl">
              <li>Tot 5 pagina's</li><li>Mobielvriendelijk design</li>
              <li>Contactformulier + Google Maps</li><li>Hosting (1 jaar) + 2 GB opslag</li>
              <li>SSL-certificaat</li><li>SEO-basisoptimalisatie</li>
              <li>Levering binnen 48 uur</li><li>1x gratis aanpassing achteraf</li>
            </ul>
            <a href="#contact" className="pb pb-fill">Start configuratie</a>
          </div>
          <div className="pc">
            <div className="pn">Premium</div>
            <div className="pp"><sup>€</sup>1499</div>
            <div className="pd">Eenmalig — voor serieuze ondernemers</div>
            <ul className="pl">
              <li>Tot 10 pagina's</li><li>Custom design op maat</li>
              <li>Geavanceerde contactfuncties</li><li>Hosting (1 jaar) + 10 GB opslag</li>
              <li>SSL-certificaat</li><li>Volledige SEO-optimalisatie</li>
              <li>Google Analytics koppeling</li><li>3x gratis aanpassingen achteraf</li>
            </ul>
            <a href="#contact" className="pb pb-out">Start configuratie</a>
          </div>
        </div>
      </section>

      {/* WAAROM */}
      <section id="waarom" className="why-sec">
        <div className="center">
          <span className="tag">Waarom Vedantix</span>
          <h2>Snel, betaalbaar en professioneel</h2>
          <p className="sub">Wij doen het anders dan grote bureaus.</p>
        </div>
        <div className="wgrid">
          {[
            ["⚡","Levering binnen 48 uur","Geen weken wachten. Jouw website is live voordat jij het weet."],
            ["💰","Eerlijke prijzen","Geen verborgen kosten of dure abonnementen. Eenmalig betalen, klaar."],
            ["📱","100% mobielvriendelijk","Elke website werkt perfect op telefoon, tablet en computer."],
            ["🔒","Hosting & SSL inbegrepen","Wij regelen domein, hosting en beveiliging. Jij hoeft niets te doen."],
            ["🛠️","Aanpassingen op aanvraag","Wil je later iets veranderen? Snel en goedkoop geregeld."],
            ["🤝","Persoonlijk contact","Je hebt altijd direct contact met ons team. Geen callcenters."],
          ].map(([ic, h, p]) => (
            <div key={h} className="wyc">
              <span className="ic">{ic}</span>
              <h3>{h}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ background: "#fff" }}>
        <div className="center" style={{ marginBottom: 52 }}>
          <span className="tag">Contact</span>
          <h2>Klaar om te starten?</h2>
          <p className="sub">Vraag vrijblijvend een offerte aan of plan een gratis kennismakingsgesprek.</p>
        </div>
        <div className="cwrap">
          <div className="ci">
            <h3>Neem contact op</h3>
            <p>We reageren binnen 24 uur op elk bericht. Liever direct bellen? Dat kan ook!</p>
            <div className="crow"><div className="cic">📧</div><span>info@vedantix.nl</span></div>
            <div className="crow"><div className="cic">📱</div><span>+31 6 26 21 99 89</span></div>
            <div className="crow"><div className="cic">📍</div><span>Nederland</span></div>
            <div className="crow"><div className="cic">🕐</div><span>Ma–Vr: 09:00–18:00</span></div>
            <div style={{ marginTop: 20 }}>
              <a href="/Planning" style={{ color: "#1a73e8", fontWeight: 600, textDecoration: "none" }}>📅 Plan een afspraak in →</a>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
