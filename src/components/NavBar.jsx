import { useEffect, useState } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import VedantixLogo from "./VedantixLogo";
import "../styles/navbar.css";

export default function NavBar() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isHomePage) {
      document.body.setAttribute("data-has-fixed-navbar", "true");
    } else {
      document.body.removeAttribute("data-has-fixed-navbar");
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      document.body.removeAttribute("data-has-fixed-navbar");
      window.removeEventListener("scroll", onScroll);
    };
  }, [isHomePage]);

  const headerClassName = [
    "site-header",
    scrolled || !isHomePage ? "is-solid" : "",
    isHomePage && !scrolled ? "is-home" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const logoTheme = scrolled || !isHomePage ? "dark" : "light";

  return (
    <header className={headerClassName}>
      <div className="site-header-inner">
        <Link to="/" className="site-brand" aria-label="Home">
          <VedantixLogo variant="full" size="md" theme={logoTheme} />
        </Link>

        <nav className="site-nav" aria-label="Hoofdnavigatie" onKeyDown={event => { if (event.key === "Escape") setMenuOpen(false); }}>
          <button type="button" className="site-menu-toggle" aria-expanded={menuOpen} aria-controls="site-main-links" onClick={() => setMenuOpen(open => !open)}>{menuOpen ? "Sluiten ✕" : "Menu ☰"}</button>
          <div id="site-main-links" className={`site-nav-links${menuOpen ? " is-open" : ""}`} onClick={() => setMenuOpen(false)}>
            <Link to="/software-op-maat" className="site-nav-link">Software op maat</Link>
            <Link to="/diensten" className="site-nav-link">Diensten</Link>
            <Link to="/prijzen" className="site-nav-link">Prijzen</Link>
            <Link to="/proces" className="site-nav-link">Werkwijze</Link>
            <Link to="/resultaten" className="site-nav-link">Resultaten</Link>
            <Link to="/over-ons" className="site-nav-link">Over ons</Link>
            <Link to="/contact" className="site-nav-link">Contact</Link>
          </div>

          <Link to="/contact#contact-form" className="site-nav-cta">
            Plan een bedrijfsscan →
          </Link>
        </nav>
      </div>
    </header>
  );
}

