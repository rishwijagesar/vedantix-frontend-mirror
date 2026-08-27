// v2-20260318-vedantix
import { useState } from "react";

// ── Shared Nav Component ──────────────────────────────────────────────────────
function Nav() {
  const [open, setOpen] = useState(null); // which dropdown is open
  const [mobileOpen, setMobileOpen] = useState(false);

  const menus = [
    {
      label: "Diensten",
      items: [
        { href: "/Starters", label: "Configurator", desc: "Stel zelf je pakket samen" },
        { href: "/Templates", label: "Template gallery", desc: "Bekijk website voorbeelden" },
        { href: "/VoorWie", label: "Voor wie", desc: "Alle branches & sectoren" },
      ],
    },
    {
      label: "Informatie",
      items: [
        { href: "/Prijzen", label: "Prijsvergelijker", desc: "Alle pakketten op een rij" },
        { href: "/Proces", label: "Hoe het werkt", desc: "Stap voor stap uitgelegd" },
      ],
    },
    {
      label: "Contact",
      items: [
        { href: "/Planning", label: "Afspraak plannen", desc: "Gratis kennismakingsgesprek" },
        { href: "/#contact", label: "Offerte aanvragen", desc: "Vrijblijvend en gratis" },
      ],
    },
  ];

  return (
    <>
      <style>{`
        .vd-nav{position:fixed;top:0;left:0;right:0;z-index:200;background:rgba(10,22,40,0.97);backdrop-filter:blur(12px);padding:0 5%;display:flex;align-items:center;justify-content:space-between;height:60px}
        .vd-logo{color:#fff;font-weight:900;font-size:1.35rem;letter-spacing:-0.5px;text-decoration:none}
        .vd-menu{display:flex;gap:4px;list-style:none;align-items:center}
        .vd-menu-item{position:relative}
        .vd-menu-btn{background:none;border:none;color:rgba(255,255,255,0.78);font-size:0.88rem;font-weight:600;cursor:pointer;padding:8px 12px;border-radius:7px;display:flex;align-items:center;gap:5px;font-family:inherit;transition:all 0.15s}
        .vd-menu-btn:hover,.vd-menu-btn.active{background:rgba(255,255,255,0.08);color:#fff}
        .vd-chevron{font-size:0.6rem;opacity:0.6;transition:transform 0.2s}
        .vd-chevron.open{transform:rotate(180deg)}
        .vd-dropdown{position:absolute;top:calc(100% + 8px);left:0;background:#fff;border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.18);min-width:230px;padding:8px;z-index:300;animation:dropIn 0.15s ease}
        @keyframes dropIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        .vd-dd-item{display:block;padding:10px 12px;border-radius:9px;text-decoration:none;transition:background 0.12s}
        .vd-dd-item:hover{background:#f7f9fc}
        .vd-dd-label{font-weight:700;font-size:0.88rem;color:#0a1628;display:block}
        .vd-dd-desc{font-size:0.76rem;color:#94a3b8;display:block;margin-top:1px}
        .vd-cta{background:#1a73e8;color:#fff;padding:9px 20px;border-radius:8px;font-weight:700;font-size:0.87rem;text-decoration:none;transition:background 0.2s;white-space:nowrap}
        .vd-cta:hover{background:#00c2ff}
        .vd-hamburger{display:none;background:none;border:none;cursor:pointer;flex-direction:column;gap:5px;padding:4px}
        .vd-hamburger span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:all 0.2s}
        .vd-mobile{position:fixed;top:60px;left:0;right:0;background:#0a1628;border-top:1px solid rgba(255,255,255,0.08);padding:16px 5% 20px;z-index:199;display:flex;flex-direction:column;gap:2px}
        .vd-mob-section{color:rgba(255,255,255,0.4);font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:10px 8px 4px}
        .vd-mob-link{color:rgba(255,255,255,0.85);text-decoration:none;font-size:0.9rem;font-weight:600;padding:10px 8px;border-radius:8px;display:block;transition:background 0.15s}
        .vd-mob-link:hover{background:rgba(255,255,255,0.07)}
        @media(max-width:768px){.vd-menu{display:none}.vd-hamburger{display:flex}}
      `}</style>
      <nav className="vd-nav">
        <a href="/" className="vd-logo">Vedantix</a>
        <ul className="vd-menu">
          {menus.map(m => (
            <li key={m.label} className="vd-menu-item"
              onMouseEnter={() => setOpen(m.label)}
              onMouseLeave={() => setOpen(null)}>
              <button className={`vd-menu-btn ${open === m.label ? "active" : ""}`}>
                {m.label}
                <span className={`vd-chevron ${open === m.label ? "open" : ""}`}>▼</span>
              </button>
              {open === m.label && (
                <div className="vd-dropdown">
                  {m.items.map(item => (
                    <a key={item.href} href={item.href} className="vd-dd-item">
                      <span className="vd-dd-label">{item.label}</span>
                      <span className="vd-dd-desc">{item.desc}</span>
                    </a>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <a href="/Starters" className="vd-cta">Offerte aanvragen</a>
          <button className="vd-hamburger" onClick={() => setMobileOpen(p => !p)} aria-label="Menu">
            <span/><span/><span/>
          </button>
        </div>
      </nav>
      {mobileOpen && (
        <div className="vd-mobile">
          {menus.map(m => (
            <div key={m.label}>
              <div className="vd-mob-section">{m.label}</div>
              {m.items.map(item => (
                <a key={item.href} href={item.href} className="vd-mob-link" onClick={() => setMobileOpen(false)}>{item.label}</a>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ── WhatsApp Widget ───────────────────────────────────────────────────────────
function WhatsApp({ phone = "310626219989", message = "Hallo! Ik heb een vraag over Vedantix." }) {
  const [open, setOpen] = useState(false);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  return (
    <>
      <style>{`
        .wa-fab{position:fixed;bottom:28px;right:28px;z-index:500}
        .wa-btn{width:58px;height:58px;border-radius:50%;background:#25d366;border:none;cursor:pointer;box-shadow:0 4px 20px rgba(37,211,102,0.45);display:flex;align-items:center;justify-content:center;transition:transform 0.2s,box-shadow 0.2s}
        .wa-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(37,211,102,0.55)}
        .wa-bubble{position:absolute;bottom:68px;right:0;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);width:290px;overflow:hidden;animation:waPop 0.2s ease}
        @keyframes waPop{from{opacity:0;transform:scale(0.92) translateY(10px)}to{opacity:1;transform:scale(1) translateY(0)}}
        .wa-header{background:#075e54;padding:16px 18px;display:flex;align-items:center;gap:12px}
        .wa-avatar{width:40px;height:40px;border-radius:50%;background:#128c7e;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}
        .wa-name{color:#fff;font-weight:700;font-size:0.92rem}
        .wa-status{color:rgba(255,255,255,0.6);font-size:0.75rem;margin-top:1px}
        .wa-body{padding:16px 18px}
        .wa-msg{background:#f0f0f0;border-radius:0 10px 10px 10px;padding:10px 13px;font-size:0.85rem;color:#1a1a2e;line-height:1.5;margin-bottom:14px}
        .wa-open{display:block;background:#25d366;color:#fff;text-align:center;padding:11px;border-radius:9px;font-weight:700;text-decoration:none;font-size:0.88rem;transition:background 0.2s}
        .wa-open:hover{background:#20ba58}
        .wa-close{position:absolute;top:10px;right:12px;background:none;border:none;color:rgba(255,255,255,0.6);cursor:pointer;font-size:1rem;line-height:1}
        .wa-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;width:18px;height:18px;border-radius:50%;font-size:0.65rem;font-weight:800;display:flex;align-items:center;justify-content:center}
      `}</style>
      <div className="wa-fab">
        {open && (
          <div className="wa-bubble">
            <div className="wa-header">
              <div className="wa-avatar">V</div>
              <div>
                <div className="wa-name">Vedantix</div>
                <div className="wa-status">Gemiddeld binnen 1 uur antwoord</div>
              </div>
              <button className="wa-close" onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="wa-body">
              <div className="wa-msg">
                👋 Hallo! Heb je een vraag over onze websites of pakketten?<br/><br/>
                Stuur ons een WhatsApp-bericht — we reageren snel!
              </div>
              <a href={url} target="_blank" rel="noreferrer" className="wa-open">
                Chat openen op WhatsApp
              </a>
            </div>
          </div>
        )}
        <button className="wa-btn" onClick={() => setOpen(p => !p)} aria-label="WhatsApp chat">
          {!open && <div className="wa-badge">1</div>}
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </button>
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: "#1a1a2e", background: "#fff", lineHeight: 1.6 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--navy:#0a1628;--blue:#1a73e8;--accent:#00c2ff;--gray:#f7f9fc;--muted:#6b7280}
        html{scroll-behavior:smooth}
        .hero{min-height:100vh;background:linear-gradient(135deg,#0a1628 0%,#0d2146 60%,#0a1628 100%);display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 5% 80px;position:relative;overflow:hidden}
        .hero::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 70% 50%,rgba(0,194,255,0.08) 0%,transparent 60%)}
        .hero-inner{position:relative;max-width:800px}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,194,255,0.1);border:1px solid rgba(0,194,255,0.3);color:#00c2ff;padding:6px 18px;border-radius:100px;font-size:0.82rem;font-weight:600;margin-bottom:28px}
        .hero h1{font-size:clamp(2.2rem,5.5vw,3.8rem);font-weight:900;color:#fff;line-height:1.1;margin-bottom:24px;letter-spacing:-1px}
        .hero h1 em{color:#00c2ff;font-style:normal}
        .hero p{font-size:1.1rem;color:rgba(255,255,255,0.68);max-width:560px;margin:0 auto 40px}
        .hero-btns{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
        .btn-primary{background:#1a73e8;color:#fff;padding:15px 34px;border-radius:10px;font-weight:700;font-size:1rem;text-decoration:none;box-shadow:0 4px 20px rgba(26,115,232,0.4);display:inline-block;transition:all 0.2s}
        .btn-primary:hover{background:#00c2ff;transform:translateY(-2px)}
        .btn-ghost{background:transparent;color:#fff;padding:15px 34px;border-radius:10px;font-weight:600;font-size:1rem;text-decoration:none;border:2px solid rgba(255,255,255,0.3);display:inline-block;transition:all 0.2s}
        .btn-ghost:hover{border-color:#00c2ff;color:#00c2ff}
        .hero-stats{display:flex;gap:40px;justify-content:center;margin-top:60px;padding-top:40px;border-top:1px solid rgba(255,255,255,0.1);flex-wrap:wrap}
        .stat strong{display:block;font-size:2rem;font-weight:900;color:#fff}
        .stat span{font-size:0.82rem;color:rgba(255,255,255,0.45)}
        section{padding:96px 5%}
        .tag{display:inline-block;color:#1a73e8;font-weight:700;font-size:0.78rem;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px}
        h2{font-size:clamp(1.7rem,4vw,2.7rem);font-weight:800;letter-spacing:-0.5px;line-height:1.15}
        .sub{color:var(--muted);font-size:1rem;max-width:540px;margin-top:14px}
        .sec-head{margin-bottom:52px}
        .center{text-align:center}.center .sub{margin:14px auto 0}
        .steps-sec{background:#f7f9fc}
        .steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:28px}
        .step{background:#fff;border-radius:16px;padding:34px 26px;box-shadow:0 2px 14px rgba(0,0,0,0.06);text-align:center;transition:transform 0.2s}
        .step:hover{transform:translateY(-4px)}
        .step-num{width:50px;height:50px;background:linear-gradient(135deg,#1a73e8,#00c2ff);border-radius:13px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:900;color:#fff;margin:0 auto 18px}
        .step h3{font-size:1.05rem;font-weight:700;margin-bottom:10px}
        .step p{color:var(--muted);font-size:0.9rem}
        .grid-who{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;margin-top:44px}
        .who-card{background:#fff;border:2px solid #e8eef5;border-radius:13px;padding:22px 14px;text-align:center;transition:all 0.2s}
        .who-card:hover{border-color:#1a73e8;transform:translateY(-2px)}
        .who-card .ic{font-size:1.9rem;margin-bottom:9px;display:block}
        .who-card span{font-size:0.85rem;font-weight:600}
        .pricing-sec{background:#0a1628}
        .pricing-sec h2,.pricing-sec .tag{color:#fff}
        .pricing-sec .sub{color:rgba(255,255,255,0.45)}
        .pricing-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:22px;margin-top:52px}
        .p-card{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:38px 30px;color:#fff;position:relative;transition:transform 0.2s}
        .p-card:hover{transform:translateY(-4px);border-color:rgba(0,194,255,0.4)}
        .p-card.hot{background:linear-gradient(145deg,rgba(26,115,232,0.2),rgba(0,194,255,0.1));border-color:#00c2ff}
        .hot-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:#00c2ff;color:#0a1628;padding:3px 16px;border-radius:100px;font-size:0.75rem;font-weight:800;white-space:nowrap}
        .p-name{font-size:0.82rem;font-weight:700;color:#00c2ff;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
        .p-price{font-size:2.9rem;font-weight:900;line-height:1;margin:10px 0 4px}
        .p-price sup{font-size:1rem;font-weight:500;opacity:0.6;vertical-align:super}
        .p-desc{color:rgba(255,255,255,0.45);font-size:0.85rem;margin-bottom:26px}
        .p-list{list-style:none;margin-bottom:32px}
        .p-list li{padding:7px 0;font-size:0.9rem;color:rgba(255,255,255,0.8);border-bottom:1px solid rgba(255,255,255,0.07);display:flex;gap:9px}
        .p-list li::before{content:"✓";color:#00c2ff;font-weight:700;flex-shrink:0}
        .p-btn{display:block;text-align:center;padding:13px;border-radius:10px;font-weight:700;text-decoration:none;font-size:0.93rem;transition:all 0.2s}
        .p-btn-out{border:2px solid rgba(255,255,255,0.3);color:#fff}
        .p-btn-out:hover{border-color:#00c2ff;color:#00c2ff}
        .p-btn-fill{background:#1a73e8;color:#fff}
        .p-btn-fill:hover{background:#00c2ff}
        .why-sec{background:#f7f9fc}
        .why-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:22px;margin-top:44px}
        .why-card{background:#fff;border-radius:15px;padding:30px 26px;box-shadow:0 2px 10px rgba(0,0,0,0.05)}
        .why-card .ic{font-size:1.9rem;margin-bottom:14px;display:block}
        .why-card h3{font-size:1rem;font-weight:700;margin-bottom:8px}
        .why-card p{color:var(--muted);font-size:0.88rem}
        .contact-sec{background:#fff}
        .contact-wrap{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start;max-width:940px;margin:0 auto}
        .c-info h3{font-size:1.35rem;font-weight:800;margin-bottom:14px}
        .c-info p{color:var(--muted);margin-bottom:22px;font-size:0.92rem}
        .c-row{display:flex;align-items:center;gap:12px;margin-bottom:13px}
        .c-icon{width:38px;height:38px;background:#f7f9fc;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
        .c-row span{font-size:0.9rem;font-weight:500}
        form.contact-form{display:flex;flex-direction:column;gap:14px}
        .frow{display:grid;grid-template-columns:1fr 1fr;gap:14px}
        input,textarea,select{width:100%;padding:12px 15px;border:2px solid #e5e7eb;border-radius:9px;font-size:0.9rem;font-family:inherit;outline:none;background:#f7f9fc;transition:border-color 0.2s}
        input:focus,textarea:focus,select:focus{border-color:#1a73e8;background:#fff}
        textarea{resize:vertical;min-height:110px}
        .btn-send{background:#1a73e8;color:#fff;padding:13px;border-radius:9px;font-weight:700;font-size:0.93rem;border:none;cursor:pointer;transition:background 0.2s;width:100%}
        .btn-send:hover{background:#00c2ff}
        footer{background:#0a1628;color:rgba(255,255,255,0.45);padding:36px 5%;text-align:center;font-size:0.83rem}
        footer strong{color:#fff}
        footer a{color:rgba(255,255,255,0.45);text-decoration:none}
        footer a:hover{color:#00c2ff}
        .footer-links{display:flex;justify-content:center;gap:24px;margin-top:12px;flex-wrap:wrap}
        @media(max-width:768px){
          .contact-wrap{grid-template-columns:1fr;gap:36px}
          .frow{grid-template-columns:1fr}
          .hero-stats{gap:20px}
        }
      `}</style>

      <Nav />
      <WhatsApp phone="310626219989" message="Hallo Vedantix! Ik heb een vraag." />

      {/* HERO */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">⚡ Website binnen 48 uur live</div>
          <h1>Jouw bedrijf verdient een<br/><em>professionele website</em></h1>
          <p>Van kapper tot aannemer — wij bouwen jouw website snel, betaalbaar en volledig verzorgd. Inclusief hosting, domein en SSL.</p>
          <div className="hero-btns">
            <a href="/Starters" className="btn-primary">Gratis offerte aanvragen</a>
            <a href="/Templates" className="btn-ghost">Bekijk templates</a>
          </div>
          <div className="hero-stats">
            <div className="stat"><strong>48u</strong><span>Gemiddelde levertijd</span></div>
            <div className="stat"><strong>€399</strong><span>Vanaf prijs</span></div>
            <div className="stat"><strong>100%</strong><span>Inclusief hosting</span></div>
            <div className="stat"><strong>24/7</strong><span>Online bereikbaar</span></div>
          </div>
        </div>
      </section>

      {/* HOE HET WERKT */}
      <section id="hoe-het-werkt" className="steps-sec">
        <div className="sec-head center">
          <span className="tag">Hoe het werkt</span>
          <h2>Van idee naar live website in 4 stappen</h2>
          <p className="sub">Geen technische kennis nodig. Wij regelen alles.</p>
        </div>
        <div className="steps">
          {[["1","Vertel ons over je bedrijf","Vul ons korte formulier in. Naam, branche, diensten — meer hebben we niet nodig."],
            ["2","Wij bouwen jouw website","Ons team levert binnen 48 uur een professionele, mobielvriendelijke website op."],
            ["3","Live — klaar voor klanten","Domein, hosting, SSL — volledig ingericht en klaar voor gebruik."],
            ["4","Aanpassingen wanneer jij wil","Later iets aanpassen of toevoegen? Snel geregeld tegen een vaste lage prijs."]
          ].map(([n, h, p]) => (
            <div key={n} className="step"><div className="step-num">{n}</div><h3>{h}</h3><p>{p}</p></div>
          ))}
        </div>
      </section>

      {/* VOOR WIE */}
      <section id="voor-wie">
        <div className="sec-head">
          <span className="tag">Voor wie</span>
          <h2>Voor elk bedrijf,<br/>groot of klein</h2>
          <p className="sub">Of je nu net begint of al jaren actief bent — jij verdient een website die werkt.</p>
        </div>
        <div className="grid-who">
          {[["✂️","Kapper"],["🍽️","Restaurant"],["📸","Fotograaf"],["🔨","Klusbedrijf"],["🎨","Schilder"],["💼","ZZP'er"],["🏪","Winkel"],["🚀","Starter"],["🏗️","Aannemer"],["💆","Schoonheidssalon"],["🎵","Muzikant"],["🏋️","Fitness coach"]].map(([ic,label]) => (
            <a key={label} href="/VoorWie" className="who-card" style={{ textDecoration: "none", color: "inherit" }}>
              <span className="ic">{ic}</span><span>{label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* PRIJZEN */}
      <section id="prijzen" className="pricing-sec">
        <div className="sec-head center">
          <span className="tag">Prijzen</span>
          <h2>Transparante prijzen,<br/>geen verrassingen</h2>
          <p className="sub">Eenmalige betaling. Geen maandelijkse verborgen kosten.</p>
        </div>
        <div className="pricing-grid">
          <div className="p-card">
            <div className="p-name">Starter</div>
            <div className="p-price"><sup>€</sup>399</div>
            <div className="p-desc">Eenmalig — ideaal voor starters</div>
            <ul className="p-list">
              <li>1-pagina professionele website</li><li>Mobielvriendelijk design</li>
              <li>Contactformulier</li><li>Hosting (1 jaar) + 500 MB opslag</li>
              <li>SSL-certificaat</li><li>Levering binnen 48 uur</li>
            </ul>
            <a href="/Starters" className="p-btn p-btn-out">Start configuratie</a>
          </div>
          <div className="p-card hot">
            <div className="hot-badge">MEEST GEKOZEN</div>
            <div className="p-name">Business</div>
            <div className="p-price"><sup>€</sup>799</div>
            <div className="p-desc">Eenmalig — voor groeiende bedrijven</div>
            <ul className="p-list">
              <li>Tot 5 pagina's</li><li>Mobielvriendelijk design</li>
              <li>Contactformulier + Google Maps</li><li>Hosting (1 jaar) + 2 GB opslag</li>
              <li>SSL-certificaat</li><li>SEO-basisoptimalisatie</li>
              <li>Levering binnen 48 uur</li><li>1x gratis aanpassing achteraf</li>
            </ul>
            <a href="/Starters" className="p-btn p-btn-fill">Start configuratie</a>
          </div>
          <div className="p-card">
            <div className="p-name">Premium</div>
            <div className="p-price"><sup>€</sup>1499</div>
            <div className="p-desc">Eenmalig — voor serieuze ondernemers</div>
            <ul className="p-list">
              <li>Tot 10 pagina's</li><li>Custom design op maat</li>
              <li>Geavanceerde contactfuncties</li><li>Hosting (1 jaar) + 10 GB opslag</li>
              <li>SSL-certificaat</li><li>Volledige SEO-optimalisatie</li>
              <li>Blog of nieuwssectie</li><li>3x gratis aanpassingen achteraf</li>
              <li>Levering binnen 48 uur</li>
            </ul>
            <a href="/Starters" className="p-btn p-btn-out">Start configuratie</a>
          </div>
        </div>
      </section>

      {/* WAAROM */}
      <section id="waarom" className="why-sec">
        <div className="sec-head center">
          <span className="tag">Waarom Vedantix</span>
          <h2>Snel, betaalbaar<br/>en zonder gedoe</h2>
          <p className="sub">Wij zijn geen groot bureau. Wij zijn snel, persoonlijk en gefocust op resultaat.</p>
        </div>
        <div className="why-grid">
          {[["⚡","Binnen 48 uur live","Geen weken wachten. Wij leveren razendsnel terwijl de kwaliteit hoog blijft."],
            ["💰","Scherpe prijzen","Bureaus vragen €3000+. Wij leveren dezelfde kwaliteit voor een fractie van de prijs."],
            ["📱","Altijd mobielvriendelijk","Meer dan 60% van bezoekers gebruikt een mobiel. Jouw site werkt perfect op elk scherm."],
            ["🔒","Volledig verzorgd","Hosting, domein, SSL — wij regelen alles. Jij hoeft niets technisch te doen."],
            ["✏️","Aanpassingen op aanvraag","Iets toevoegen of aanpassen? Snel geregeld tegen een vaste lage prijs."],
            ["🤝","Persoonlijk contact","Je werkt direct met ons. Geen tussenpersonen, geen ticketsysteem."]
          ].map(([ic,h,p]) => (
            <div key={h} className="why-card"><span className="ic">{ic}</span><h3>{h}</h3><p>{p}</p></div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="contact-sec">
        <div className="sec-head center">
          <span className="tag">Contact</span>
          <h2>Klaar om te starten?</h2>
          <p className="sub">Vraag gratis en vrijblijvend een offerte aan. We reageren binnen 24 uur.</p>
        </div>
        <div className="contact-wrap">
          <div className="c-info">
            <h3>We staan voor je klaar</h3>
            <p>Heb je een vraag of wil je direct starten? Vul het formulier in of plan een gesprek in.</p>
            <div className="c-row"><div className="c-icon">📧</div><span>info@vedantix.nl</span></div>
            <div className="c-row"><div className="c-icon">📱</div><span>WhatsApp — rechtsboven in beeld</span></div>
            <div className="c-row"><div className="c-icon">📅</div><span><a href="/Planning" style={{color:"#1a73e8",fontWeight:600}}>Plan een afspraak in →</a></span></div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <p>© 2026 <strong>Vedantix</strong> — Professionele websites voor elk bedrijf.</p>
        <div className="footer-links">
          <a href="/Privacy">Privacybeleid</a>
          <a href="/terms">Algemene voorwaarden</a>
          <a href="/Proces">Hoe het werkt</a>
          <a href="/Planning">Afspraak plannen</a>
          <a href="/VoorWie">Voor wie</a>
          <a href="/Prijzen">Prijzen vergelijken</a>
          <a href="/Templates">Templates</a>
        </div>
      </footer>
    </div>
  );
}

function ContactForm() {
  const [sent, setSent] = useState(false);
  return sent ? (
    <div style={{background:"#f0fdf4",border:"2px solid #10b981",borderRadius:12,padding:32,textAlign:"center"}}>
      <div style={{fontSize:"2rem",marginBottom:12}}>✅</div>
      <h3 style={{color:"#065f46",marginBottom:8}}>Verstuurd!</h3>
      <p style={{color:"#047857"}}>We nemen binnen 24 uur contact op.</p>
    </div>
  ) : (
    <form className="contact-form" onSubmit={e=>{e.preventDefault();setSent(true);}}>
      <div className="frow">
        <input type="text" placeholder="Naam" required/>
        <input type="text" placeholder="Bedrijfsnaam"/>
      </div>
      <input type="email" placeholder="E-mailadres" required/>
      <select><option value="">Welk pakket interesseert u?</option><option>Starter — €399</option><option>Business — €799</option><option>Premium — €1499</option><option>Anders / Weet ik nog niet</option></select>
      <textarea placeholder="Vertel kort over uw bedrijf en wat u zoekt..."/>
      <button type="submit" className="btn-send">Offerte aanvragen →</button>
    </form>
  );
}

