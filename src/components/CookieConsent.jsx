import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  clearMetaTrackingCookies,
  MARKETING_CONSENT_EVENT,
  OPEN_COOKIE_SETTINGS_EVENT,
  readMarketingConsent,
  writeMarketingConsent,
} from "../lib/marketing-consent";
import "../styles/cookie-consent.css";

export default function CookieConsent() {
  const [choice, setChoice] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const current = readMarketingConsent();
    setChoice(current);
    setIsOpen(current === null);

    const openSettings = () => setIsOpen(true);
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, openSettings);
  }, []);

  const updateChoice = (nextChoice) => {
    const previousChoice = readMarketingConsent();
    writeMarketingConsent(nextChoice);
    setChoice(nextChoice);
    setIsOpen(false);

    if (nextChoice === "denied") {
      window.fbq?.("consent", "revoke");
      clearMetaTrackingCookies();

      // If Meta was already loaded during this browser session, reload once so
      // no third-party marketing runtime remains active after consent withdrawal.
      if (previousChoice === "granted") {
        window.location.reload();
      }
    }
  };

  useEffect(() => {
    const syncChoice = (event) => setChoice(event.detail?.value ?? null);
    window.addEventListener(MARKETING_CONSENT_EVENT, syncChoice);
    return () => window.removeEventListener(MARKETING_CONSENT_EVENT, syncChoice);
  }, []);

  if (!isOpen) return null;

  return (
    <aside
      className="cookie-consent"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
    >
      <div className="cookie-consent__content">
        <div>
          <p className="cookie-consent__eyebrow">Privacy-instellingen</p>
          <h2 id="cookie-consent-title">Marketingtracking alleen met jouw toestemming</h2>
          <p id="cookie-consent-description">
            De website werkt zonder marketingcookies. Met jouw toestemming laden we Meta Pixel om
            advertentiecampagnes en conversies te meten. Je kunt je keuze later altijd wijzigen.
          </p>
          <Link to="/privacy" className="cookie-consent__privacy-link">
            Lees het privacybeleid
          </Link>
        </div>

        <div className="cookie-consent__actions" aria-label="Cookievoorkeur kiezen">
          <button
            type="button"
            className="cookie-consent__button cookie-consent__button--reject"
            onClick={() => updateChoice("denied")}
          >
            Weigeren
          </button>
          <button
            type="button"
            className="cookie-consent__button cookie-consent__button--accept"
            onClick={() => updateChoice("granted")}
          >
            Accepteren
          </button>
        </div>
      </div>

      {choice ? (
        <p className="cookie-consent__current">
          Huidige keuze: {choice === "granted" ? "marketing toegestaan" : "marketing geweigerd"}.
        </p>
      ) : null}
    </aside>
  );
}
