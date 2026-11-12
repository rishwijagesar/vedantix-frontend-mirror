import { SERVICE_GROUPS } from "../data/service-navigation";
import { Link } from "@/lib/router-compat";

import "../styles/footer.css";

function IconInstagram() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7Zm10.4 1.7a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2.2A2.8 2.8 0 1 0 12 14.8 2.8 2.8 0 0 0 12 9.2Z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.2c0-.9.3-1.5 1.6-1.5h1.7V5a22 22 0 0 0-2.5-.1c-2.5 0-4.3 1.5-4.3 4.4V11H7v3h2.9v8h3.6Z" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.5 8.5A1.8 1.8 0 1 1 6.5 5a1.8 1.8 0 0 1 0 3.5ZM5 10h3v9H5v-9Zm5 0h2.9v1.2h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.6 2 3.6 4.6V19h-3v-4.1c0-1 0-2.3-1.4-2.3s-1.6 1.1-1.6 2.2V19h-3v-9Z" />
    </svg>
  );
}

function IconLocation() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2a7 7 0 0 1 7 7c0 4.8-7 13-7 13S5 13.8 5 9a7 7 0 0 1 7-7Zm0 9.5A2.5 2.5 0 1 0 12 6.5a2.5 2.5 0 0 0 0 5Z" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6.6 10.8a15.5 15.5 0 0 0 6.6 6.6l2.2-2.2c.3-.3.8-.4 1.2-.3 1 .3 2 .4 3 .4.7 0 1.2.5 1.2 1.2V20c0 .7-.5 1.2-1.2 1.2C10.5 21.2 2.8 13.5 2.8 4.2 2.8 3.5 3.3 3 4 3h3.5c.7 0 1.2.5 1.2 1.2 0 1 .1 2 .4 3 .1.4 0 .9-.3 1.2l-2.2 2.4Z" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v.2l8 5.3 8-5.3V7H4Zm16 10V9.6l-7.4 4.9a1 1 0 0 1-1.2 0L4 9.6V17h16Z" />
    </svg>
  );
}

const SOCIALS = [
  { href: "https://www.linkedin.com/company/vedantix-nl", label: "LinkedIn", Icon: IconLinkedIn },
  { href: "https://instagram.com/vedantix.nl", label: "Instagram", Icon: IconInstagram },
  { href: "https://www.facebook.com/vedantix", label: "Facebook", Icon: IconFacebook },
];

const COMPANY_LINKS = [
  ["/over-ons", "Over Vedantix"],
  ["/proces", "Werkwijze"],
  ["/resultaten", "Resultaten"],
  ["/prijzen", "Prijzen"],
  ["/voorwie", "Voor wie"],
  ["/blog", "Blog"],
  ["/faq", "Veelgestelde vragen"],
  ["/online-groei-audit", "Gratis Online Groei Audit"],
  ["/contact", "Contact"],
];

const INDUSTRY_LINKS = [
  ["/website/personal-trainer", "Personal trainers"],
  ["/website/fysiotherapeut", "Fysiotherapeuten"],
  ["/website/coach", "Coaches"],
  ["/website/schoonheidssalon", "Salons"],
  ["/website/kapper", "Kappers"],
  ["/website/installateur", "Installateurs"],
];

export default function BigFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="big-footer">
      <div className="big-footer__inner">
        <div className="big-footer__cta">
          <div>
            <h2>Klaar om dubbel werk te schrappen?</h2>
            <p>Plan een bedrijfsscan en bespreek wat jouw team tijd kost.</p>
          </div>
          <Link className="big-footer__cta-btn" to="/contact#contact-form">Plan een bedrijfsscan</Link>
        </div>

        <div className="big-footer__grid">
          <div className="big-footer__brand">
            <div className="big-footer__brand-name">Vedantix</div>
            <p className="big-footer__brand-text">
              Bedrijfssoftware op maat voor het mkb en zelfstandigen. Ook websites, hosting en vindbaarheid. Vanuit Den Bosch, voor heel Nederland.
            </p>
            <ul className="big-footer__contact-list">
              <li className="big-footer__contact-item">
                <span className="big-footer__contact-icon"><IconLocation /></span>
                <a href="https://www.google.com/maps/search/?api=1&query=Neercanne+6%2C+5235+HB%2C+%27s-Hertogenbosch" target="_blank" rel="noreferrer">Neercanne 6 · 5235 HB 's-Hertogenbosch</a>
              </li>
              <li className="big-footer__contact-item">
                <span className="big-footer__contact-icon"><IconPhone /></span>
                <a href="tel:+31626219989">+31 6 26 21 99 89</a>
              </li>
              <li className="big-footer__contact-item">
                <span className="big-footer__contact-icon"><IconMail /></span>
                <a href="mailto:info@vedantix.nl">info@vedantix.nl</a>
              </li>
            </ul>
            <div className="big-footer__socials">
              {SOCIALS.map(({ href, label, Icon }) => (
                <a key={label} className="big-footer__social" href={href} target="_blank" rel="noreferrer" aria-label={`${label} (opent in een nieuw tabblad)`}>
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          <nav className="big-footer__col" aria-label="Diensten">
            <div className="big-footer__col-title">Diensten</div>
            <ul className="big-footer__links">
              {SERVICE_GROUPS.flatMap((group) => group.items).map((item) => (
                <li key={item.href}><Link to={item.href}>{item.label}</Link></li>
              ))}
              <li><Link to="/diensten">Alle diensten</Link></li>
            </ul>
          </nav>

          <nav className="big-footer__col" aria-label="Bedrijf">
            <div className="big-footer__col-title">Vedantix</div>
            <ul className="big-footer__links">
              {COMPANY_LINKS.map(([to, label]) => <li key={to}><Link to={to}>{label}</Link></li>)}
            </ul>
          </nav>

          <nav className="big-footer__col" aria-label="Websites per branche">
            <div className="big-footer__col-title">Websites voor</div>
            <ul className="big-footer__links">
              {INDUSTRY_LINKS.map(([to, label]) => <li key={to}><Link to={to}>{label}</Link></li>)}
            </ul>
          </nav>
        </div>

        <div className="big-footer__bottom">
          <div className="big-footer__copyright">
            © {year} Vedantix · KvK 42056482 · BTW NL005461438B38
          </div>
          <div className="big-footer__bottom-links">
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Voorwaarden</Link>
            <Link to="/data-deletion">Gegevensverwijdering</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
