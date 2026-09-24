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

export default function BigFooter() {
  return (
    <>
      <footer className="big-footer">
        <div className="big-footer__inner">
          <div className="big-footer__grid">
            <div className="big-footer__brand">
              <div className="big-footer__brand-name">Vedantix</div>
              <h2 className="big-footer__brand-heading">
                Digitale groei voor ondernemers
              </h2>
              <p className="big-footer__brand-text">
                Vedantix helpt ondernemers met websites, AI-oplossingen, webapps,
                mobiele apps, koppelingen en vindbaarheid. Vanuit Den Bosch, voor heel Nederland.
              </p>

              <ul className="big-footer__links" aria-label="Vedantix diensten">
                <li>
                  <Link to="/voorwie">Websites voor lokale ondernemers</Link>
                </li>
                <li>
                  <Link to="/groeimodel">SEO en online zichtbaarheid</Link>
                </li>
                <li>
                  <Link to="/ai-vindbaarheid">
                    SEO, AEO, GEO en AI-vindbaarheid
                  </Link>
                </li>
                <li>
                  <Link to="/prijzen">Hosting en onderhoud</Link>
                </li>
              </ul>

              <div className="big-footer__socials">
                <a
                  className="big-footer__social"
                  href="https://instagram.com/vedantix.nl"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <IconInstagram />
                </a>
                <a
                  className="big-footer__social"
                  href="https://www.facebook.com/vedantix"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <IconFacebook />
                </a>
                <a
                  className="big-footer__social"
                  href="https://www.linkedin.com/company/vedantix-nl"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="LinkedIn"
                >
                  <IconLinkedIn />
                </a>
              </div>
            </div>

            <div className="big-footer__col">
              <div className="big-footer__col-title">Pagina's</div>
              <ul className="big-footer__links">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/prijzen">Prijzen</Link>
                </li>
                <li>
                  <Link to="/voorwie">Voor Wie</Link>
                </li>
                <li>
                  <Link to="/proces">Proces</Link>
                </li>
                <li>
                  <Link to="/groeimodel">Waarom Vedantix</Link>
                </li>
                <li>
                  <Link to="/resultaten">Resultaten</Link>
                </li>
                <li>
                  <Link to="/online-groei-audit">Online Groei Audit</Link>
                </li>
                <li>
                  <Link to="/ai-vindbaarheid">AI-vindbaarheid</Link>
                </li>
                <li>
                  <Link to="/faq">FAQ</Link>
                </li>
                <li>
                  <Link to="/contact">Contact</Link>
                </li>
                <li>
                  <Link to="/blog">Blog</Link>
                </li>
              </ul>
            </div>

            <div className="big-footer__col">
              <div className="big-footer__col-title">Diensten</div>
              <ul className="big-footer__links">
                <li><Link to="/diensten">Alle diensten</Link></li>
                <li><Link to="/ai-oplossingen">AI & automatisering</Link></li>
                <li><Link to="/webapps-klantportalen">Webapps & klantportalen</Link></li>
                <li><Link to="/mobiele-apps">Mobiele apps</Link></li>
                <li><Link to="/koppelingen-automatisering">Koppelingen & beheer</Link></li>
                <li>
                  <Link to="/website-laten-maken">Website laten maken</Link>
                </li>
                <li>
                  <Link to="/groeimodel">SEO optimalisatie</Link>
                </li>
                <li>
                  <Link to="/blog/beter-gevonden-in-google-lokale-ondernemer">
                    Lokale vindbaarheid
                  </Link>
                </li>
                <li>
                  <Link to="/prijzen">Website onderhoud</Link>
                </li>
                <li>
                  <Link to="/prijzen">Hosting</Link>
                </li>
                <li>
                  <Link to="/ai-vindbaarheid">AEO, GEO en AI-vindbaarheid</Link>
                </li>
              </ul>
            </div>

            <div className="big-footer__col">
              <div className="big-footer__col-title">Branches</div>
              <ul className="big-footer__links">
                <li>
                  <Link to="/website/personal-trainer">
                    Website voor personal trainers
                  </Link>
                </li>
                <li>
                  <Link to="/website/fysiotherapeut">
                    Website voor fysiotherapeuten
                  </Link>
                </li>
                <li>
                  <Link to="/website/coach">Website voor coaches</Link>
                </li>
                <li>
                  <Link to="/website/schoonheidssalon">
                    Website voor salons
                  </Link>
                </li>
                <li>
                  <Link to="/website/kapper">Website voor kappers</Link>
                </li>
                <li>
                  <Link to="/website/installateur">
                    Website voor installateurs
                  </Link>
                </li>
              </ul>
            </div>

            <div className="big-footer__col">
              <div className="big-footer__col-title">Contact & gegevens</div>

              <ul className="big-footer__contact-list">
                <li className="big-footer__contact-item">
                  <span className="big-footer__contact-icon">
                    <IconLocation />
                  </span>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Neercanne+6%2C+5235+HB%2C+%27s-Hertogenbosch"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Neercanne 6 · 5235 HB 's-Hertogenbosch
                  </a>
                </li>
                <li className="big-footer__contact-item">
                  <span className="big-footer__contact-icon">
                    <IconPhone />
                  </span>
                  <a href="tel:+31626219989">+31 6 26 21 99 89</a>
                </li>
                <li className="big-footer__contact-item">
                  <span className="big-footer__contact-icon">
                    <IconMail />
                  </span>
                  <a href="mailto:info@vedantix.nl">info@vedantix.nl</a>
                </li>
              </ul>

              <div className="big-footer__company-meta">
                <div className="big-footer__company-line">
                  <strong>KvK:</strong> 42056482
                </div>
                <div className="big-footer__company-line">
                  <strong>BTW:</strong> NL005461438B38
                </div>
              </div>

              <Link className="big-footer__cta" to="/online-groei-audit">
                Gratis Online Groei Audit
              </Link>
            </div>
          </div>

          <div className="big-footer__bottom">
            <div className="big-footer__copyright">
              © 2026 Vedantix. Alle rechten voorbehouden.
            </div>

            <div className="big-footer__bottom-links">
              <Link to="/privacy">Privacy</Link>
              <Link to="/terms">Voorwaarden</Link>
              <Link to="/data-deletion">Gegevensverwijdering</Link>
              <Link to="/contact">Contact</Link>
              <Link to="/faq">FAQ</Link>
              <Link to="/prijzen">Prijzen</Link>
              <Link to="/resultaten">Resultaten</Link>
              <Link to="/online-groei-audit">Online Groei Audit</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

