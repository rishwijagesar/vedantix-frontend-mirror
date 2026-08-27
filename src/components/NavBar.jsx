import { useEffect, useState } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import VedantixLogo from "./VedantixLogo";
import "../styles/navbar.css";

export default function NavBar() {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);

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

        <nav className="site-nav">
          <div className="site-nav-links">
            <Link to="/prijzen" className="site-nav-link">Prijzen</Link>
            <a href={isHomePage ? "#how" : "/#how"} className="site-nav-link">
              Hoe het werkt
            </a>
            <Link to="/groeimodel" className="site-nav-link">Waarom Vedantix</Link>
            <Link to="/resultaten" className="site-nav-link">Resultaten</Link>
            <Link to="/online-groei-audit" className="site-nav-link">Audit</Link>
            <Link to="/contact" className="site-nav-link">Contact</Link>
            <Link to="/blog" className="site-nav-link">Blog</Link>
            <Link to="/faq" className="site-nav-link">FAQ</Link>
          </div>

          <Link to="/online-groei-audit" className="site-nav-cta">
            Gratis Audit →
          </Link>
        </nav>
      </div>
    </header>
  );
}
