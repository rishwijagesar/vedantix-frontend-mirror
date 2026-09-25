import { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  Mail,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  Wrench,
} from "lucide-react";
import SEO from "../components/SEO";
import NavBar from "../components/NavBar";
import { CONTACT } from "../constants/contact";
import { createBreadcrumbSchema, createFAQSchema } from "../utils/schema";

const HELP_OPTIONS = [
  "Nieuwe website",
  "AI / automatisering",
  "Webapp / klantportaal",
  "Mobiele app",
  "Koppelingen",
  "Website verbeteren",
  "SEO / vindbaarheid",
  "Onderhoud",
  "Anders",
];

const CONTACT_CARDS = [
  {
    title: "Website laten maken",
    text: "Wil je een professionele website die past bij jouw bedrijf, doelgroep en huisstijl? We bouwen websites die mobielvriendelijk, snel en makkelijk te beheren zijn.",
    icon: Globe2,
  },
  {
    title: "Bestaande website verbeteren",
    text: "Heb je al een website, maar levert deze te weinig aanvragen op? We kijken kritisch naar design, snelheid, SEO, teksten en conversie.",
    icon: Wrench,
  },
  {
    title: "Online vindbaarheid verbeteren",
    text: "Wil je hoger komen in Google op zoektermen die belangrijk zijn voor jouw bedrijf? We helpen met SEO, lokale vindbaarheid, structuur en content.",
    icon: Search,
  },
  { title: "AI en automatisering", text: "Wil je minder herhaalwerk of een praktische AI-toepassing onderzoeken? We beginnen bij één proces en maken de mogelijkheden en kosten concreet.", icon: Sparkles },
  { title: "Webapp of mobiele app", text: "Van klantportaal tot een app voor medewerkers: we bespreken je gebruikers, kernfuncties en een haalbare eerste versie.", icon: Wrench },
  {
    title: "Samenwerking bespreken",
    text: "Heb je een ander idee of wil je sparren over online groei? Neem contact op en we kijken samen wat logisch is.",
    icon: Sparkles,
  },
];

const FAQS = [
  {
    question: "Kost een eerste gesprek geld?",
    answer:
      "Nee, een eerste gesprek of adviesmoment is vrijblijvend. We kijken eerst wat je nodig hebt en welke aanpak daarbij past.",
  },
  {
    question: "Voor welke bedrijven werkt Vedantix?",
    answer:
      "Vedantix richt zich vooral op lokale ondernemers en kleine bedrijven die professioneel online zichtbaar willen zijn.",
  },
  {
    question: "Kan ik mijn website later zelf aanpassen?",
    answer:
      "Ja. Waar mogelijk zorgen we ervoor dat je teksten, foto’s en belangrijke onderdelen zelf kunt beheren.",
  },
  {
    question: "Helpen jullie ook met SEO?",
    answer:
      "Ja. We letten op technische SEO, lokale vindbaarheid, paginastructuur, teksten, metadata en duidelijke call-to-actions.",
  },
  {
    question: "Wat doet Vedantix precies?",
    answer:
      "Vedantix helpt ondernemers met websites, AI-oplossingen, webapps, mobiele apps, koppelingen en vindbaarheid. We bespreken de scope, planning en kosten voordat we bouwen.",
  },
  {
    question: "Waarom is een professionele website belangrijk?",
    answer:
      "Een professionele website maakt direct duidelijk wat je doet, voor wie je werkt en waarom klanten contact met je kunnen opnemen. Dat vergroot vertrouwen en verlaagt de drempel voor aanvragen.",
  },
  {
    question: "Kan Vedantix helpen om beter gevonden te worden in Google?",
    answer:
      "Ja. Vedantix verbetert lokale vindbaarheid met duidelijke structuur, relevante content, metadata, snelheid en pagina’s die aansluiten op zoekvragen van klanten.",
  },
  {
    question: "Hoe snel kan mijn website online staan?",
    answer:
      "Dat hangt af van de grootte van de website en hoe snel de content beschikbaar is. Voor kleinere websites kan dit vaak relatief snel.",
  },
];

const CONTACT_STYLES = `
  body {
    margin: 0;
    background: #f4f7fb;
  }

  .contact-page {
    min-height: 100vh;
    background: #f4f7fb;
    color: #0f172a;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .contact-page a {
    text-decoration: none;
  }

  .contact-shell {
    width: min(1120px, calc(100% - 32px));
    margin: 0 auto;
  }

  .contact-hero {
    padding: 118px 0 48px;
    background:
      linear-gradient(135deg, rgba(7,16,38,0.96), rgba(11,35,76,0.92)),
      radial-gradient(circle at 18% 18%, rgba(56,189,248,0.18), transparent 34%);
    color: #ffffff;
  }

  .contact-hero-grid {
    display: grid;
    gap: 28px;
  }

  .contact-kicker {
    display: inline-flex;
    width: fit-content;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
    padding: 8px 12px;
    border: 1px solid rgba(255,255,255,0.16);
    border-radius: 999px;
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.78);
    font-size: 0.84rem;
    font-weight: 800;
  }

  .contact-hero h1 {
    max-width: 820px;
    margin: 0;
    color: #ffffff;
    font-family: Sora, Inter, sans-serif;
    font-size: clamp(2.4rem, 8vw, 4.7rem);
    line-height: 1.02;
    letter-spacing: 0;
  }

  .contact-hero-subtitle {
    max-width: 680px;
    margin: 20px 0 0;
    color: rgba(255,255,255,0.78);
    font-size: 1.05rem;
    line-height: 1.75;
  }

  .contact-hero-actions,
  .contact-final-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 28px;
  }

  .contact-btn {
    display: inline-flex;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    gap: 9px;
    border-radius: 8px;
    padding: 13px 18px;
    border: 1px solid transparent;
    font-weight: 900;
    transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
  }

  .contact-btn:hover {
    transform: translateY(-1px);
  }

  .contact-btn-primary {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 16px 36px rgba(0,0,0,0.2);
  }

  .contact-btn-primary:hover {
    background: #eef6ff;
  }

  .contact-btn-dark {
    background: #0f172a;
    color: #ffffff;
    box-shadow: 0 14px 30px rgba(15,23,42,0.18);
  }

  .contact-btn-dark:hover {
    background: #18233a;
  }

  .contact-btn-outline {
    border-color: rgba(255,255,255,0.22);
    color: #ffffff;
    background: rgba(255,255,255,0.08);
  }

  .contact-btn-outline:hover {
    background: rgba(255,255,255,0.14);
  }

  .contact-hero-note {
    display: grid;
    gap: 10px;
    padding: 18px;
    border: 1px solid rgba(255,255,255,0.13);
    border-radius: 8px;
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.76);
  }

  .contact-hero-note strong {
    display: block;
    color: #ffffff;
    font-size: 1.03rem;
  }

  .contact-section {
    padding: 54px 0;
  }

  .contact-section + .contact-section {
    padding-top: 18px;
  }

  .contact-section-header {
    max-width: 760px;
    margin-bottom: 24px;
  }

  .contact-label {
    margin: 0 0 10px;
    color: #1a73e8;
    font-size: 0.84rem;
    font-weight: 900;
  }

  .contact-section h2 {
    margin: 0;
    color: #111827;
    font-family: Sora, Inter, sans-serif;
    font-size: clamp(1.8rem, 5vw, 2.7rem);
    line-height: 1.12;
    letter-spacing: 0;
  }

  .contact-section-copy {
    margin: 14px 0 0;
    color: #64748b;
    font-size: 1rem;
    line-height: 1.75;
  }

  .contact-intro-card {
    padding: 24px;
    border: 1px solid #d8e4f2;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 18px 50px rgba(15,23,42,0.06);
  }

  .contact-intro-card p {
    margin: 0;
    color: #475569;
    font-size: 1.04rem;
    line-height: 1.8;
  }

  .contact-link-row {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 18px;
  }

  .contact-link-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border-radius: 999px;
    background: #eef5ff;
    color: #0f4fb5;
    font-size: 0.92rem;
    font-weight: 800;
  }

  .contact-card-grid {
    display: grid;
    gap: 14px;
  }

  .contact-card {
    padding: 22px;
    border: 1px solid #d8e4f2;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 14px 38px rgba(15,23,42,0.05);
  }

  .contact-card-icon {
    display: inline-flex;
    width: 42px;
    height: 42px;
    align-items: center;
    justify-content: center;
    margin-bottom: 18px;
    border-radius: 8px;
    background: #eaf4ff;
    color: #1a73e8;
  }

  .contact-card h3,
  .contact-faq-card h3 {
    margin: 0 0 10px;
    color: #111827;
    font-size: 1.08rem;
    line-height: 1.35;
  }

  .contact-card p,
  .contact-faq-card p {
    margin: 0;
    color: #64748b;
    line-height: 1.72;
  }

  .contact-main-grid {
    display: grid;
    gap: 18px;
  }

  .contact-panel {
    border: 1px solid #d8e4f2;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 18px 50px rgba(15,23,42,0.07);
  }

  .contact-form-panel {
    padding: 22px;
  }

  .contact-form {
    display: grid;
    gap: 14px;
    margin-top: 20px;
  }

  .contact-form-grid {
    display: grid;
    gap: 14px;
  }

  .contact-field {
    display: grid;
    gap: 7px;
  }

  .contact-field label {
    color: #24324a;
    font-size: 0.9rem;
    font-weight: 850;
  }

  .contact-field input,
  .contact-field select,
  .contact-field textarea {
    width: 100%;
    min-height: 48px;
    border: 1px solid #cbd8ea;
    border-radius: 8px;
    padding: 12px 13px;
    color: #0f172a;
    background: #ffffff;
    font: inherit;
    outline: none;
    transition: border-color 0.16s ease, box-shadow 0.16s ease;
  }

  .contact-field textarea {
    min-height: 136px;
    resize: vertical;
  }

  .contact-field input:focus,
  .contact-field select:focus,
  .contact-field textarea:focus {
    border-color: #1a73e8;
    box-shadow: 0 0 0 4px rgba(26,115,232,0.13);
  }

  .contact-form-microcopy {
    margin: 2px 0 0;
    color: #64748b;
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .contact-status {
    border-radius: 8px;
    padding: 12px 13px;
    font-size: 0.92rem;
    font-weight: 750;
    line-height: 1.55;
  }

  .contact-status-success {
    border: 1px solid #b9efd2;
    background: #ecfdf5;
    color: #047857;
  }

  .contact-status-error {
    border: 1px solid #fecaca;
    background: #fff1f2;
    color: #b91c1c;
  }

  .contact-details-panel {
    padding: 22px;
    background: linear-gradient(180deg, #ffffff, #f8fbff);
  }

  .contact-details-list {
    display: grid;
    gap: 12px;
    margin-top: 20px;
  }

  .contact-detail-item {
    display: grid;
    gap: 4px;
    padding: 14px;
    border: 1px solid #d8e4f2;
    border-radius: 8px;
    background: #ffffff;
  }

  .contact-detail-item span {
    color: #64748b;
    font-size: 0.82rem;
    font-weight: 850;
  }

  .contact-detail-item a,
  .contact-detail-item strong {
    color: #0f172a;
    font-weight: 850;
    overflow-wrap: anywhere;
  }

  .contact-direct-actions {
    display: grid;
    gap: 10px;
    margin-top: 18px;
  }

  .contact-faq-grid {
    display: grid;
    gap: 14px;
  }

  .contact-faq-card {
    padding: 20px;
    border: 1px solid #d8e4f2;
    border-radius: 8px;
    background: #ffffff;
  }

  .contact-final {
    padding: 34px 0 58px;
  }

  .contact-final-card {
    padding: 28px;
    border-radius: 8px;
    background: #0f172a;
    color: #ffffff;
    box-shadow: 0 24px 60px rgba(15,23,42,0.24);
  }

  .contact-final-card h2 {
    color: #ffffff;
  }

  .contact-final-card p {
    max-width: 720px;
    color: rgba(255,255,255,0.78);
  }

  @media (min-width: 700px) {
    .contact-hero-actions,
    .contact-final-actions,
    .contact-direct-actions {
      flex-direction: row;
      display: flex;
      align-items: center;
    }

    .contact-card-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .contact-form-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .contact-field-wide {
      grid-column: 1 / -1;
    }
  }

  @media (min-width: 980px) {
    .contact-hero {
      padding: 132px 0 74px;
    }

    .contact-hero-grid {
      grid-template-columns: minmax(0, 1fr) 340px;
      align-items: end;
    }

    .contact-main-grid {
      grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
      align-items: start;
    }

    .contact-faq-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .contact-faq-card:first-child {
      grid-column: 1 / -1;
    }
  }
`;

const initialForm = {
  name: "",
  companyName: "",
  email: "",
  phone: "",
  helpType: HELP_OPTIONS[0],
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const canonical = "https://vedantix.nl/contact";

  const whatsappUrl = useMemo(() => {
    const text = encodeURIComponent(
      "Hallo Vedantix, ik wil graag vrijblijvend advies over een website, AI-oplossing of app."
    );
    return `${CONTACT.WHATSAPP_URL}?text=${text}`;
  }, []);

  const faqSchema = createFAQSchema(FAQS);

  const breadcrumbSchema = createBreadcrumbSchema([
    { name: "Home", url: "https://vedantix.nl/" },
    { name: "Contact", url: canonical },
  ]);

  const contactPageSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact over websites, AI & apps | Vedantix",
    url: canonical,
    about: "Contact opnemen met Vedantix voor websites, AI-oplossingen, apps en vindbaarheid.",
    mainEntity: {
      "@type": "Organization",
      name: "Vedantix",
      url: "https://vedantix.nl",
      email: CONTACT.EMAIL,
      telephone: CONTACT.PHONE_HREF,
    },
  };

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setStatus({ type: "idle", message: "" });

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus({
        type: "error",
        message: "Vul minimaal je naam, e-mailadres en bericht in.",
      });
      return;
    }

    setSubmitting(true);

    window.setTimeout(() => {
      const subject = encodeURIComponent(`Contactaanvraag Vedantix - ${form.helpType}`);
      const body = encodeURIComponent(
        [
          `Naam: ${form.name}`,
          `Bedrijfsnaam: ${form.companyName || "-"}`,
          `E-mailadres: ${form.email}`,
          `Telefoonnummer: ${form.phone || "-"}`,
          `Waarmee kunnen we helpen: ${form.helpType}`,
          "",
          "Bericht:",
          form.message,
        ].join("\n")
      );

      window.location.href = `mailto:${CONTACT.EMAIL}?subject=${subject}&body=${body}`;
      setSubmitting(false);
      setStatus({
        type: "success",
        message:
          "Je e-mailprogramma is geopend met je aanvraag. Verstuur de e-mail om je bericht naar Vedantix te sturen.",
      });
    }, 350);
  }

  return (
    <>
      <SEO
        title="Contact over websites, AI & apps | Vedantix"
        description="Bespreek je website, AI-oplossing, webapp of mobiele app met Vedantix in Den Bosch. Neem contact op voor een kennismaking."
        canonical={canonical}
        schemas={[contactPageSchema, faqSchema, breadcrumbSchema]}
      />
      <style>{CONTACT_STYLES}</style>

      <div className="contact-page">
        <NavBar />

        <main>
          <header className="contact-hero">
            <div className="contact-shell contact-hero-grid">
              <div>
                <div className="contact-kicker">
                  <MessageCircle size={16} aria-hidden="true" />
                  Contact met Vedantix
                </div>
                <h1>Neem contact op met Vedantix</h1>
                <p className="contact-hero-subtitle">
                  Een nieuwe website, minder herhaalwerk met AI of een eigen app? Vertel wat je wilt bereiken. We denken met je mee over een haalbare aanpak, planning en kosten.
                </p>
                <div className="contact-hero-actions" aria-label="Contact acties">
                  <a className="contact-btn contact-btn-primary" href="#contact-form">
                    Vrijblijvend advies aanvragen <ArrowRight size={18} aria-hidden="true" />
                  </a>
                  <a
                    className="contact-btn contact-btn-outline"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={18} aria-hidden="true" /> WhatsApp ons direct
                  </a>
                </div>
              </div>

              <aside className="contact-hero-note" aria-label="Waarom contact opnemen">
                <strong>Maak je idee concreet</strong>
                <span>Je hoeft nog geen uitgewerkt plan te hebben. Stuur je vraag, website of idee en vertel wat je wilt verbeteren.</span>
              </aside>
            </div>
          </header>

          <section className="contact-section">
            <div className="contact-shell">
              <div className="contact-intro-card">
                <p>
                  Vedantix helpt ondernemers met websites, AI en automatisering, webapps en mobiele apps. Of je nu meer aanvragen wilt, tijd wilt besparen of klanten beter wilt helpen: we beginnen bij jouw vraag en bespreken wat daarvoor nodig is.
                </p>
                <div className="contact-link-row" aria-label="Relevante pagina's">
                  <Link className="contact-link-pill" to="/prijzen">
                    Pakketten bekijken
                  </Link>
                  <Link className="contact-link-pill" to="/proces">
                    Werkwijze bekijken
                  </Link>
                  <Link className="contact-link-pill" to="/website-kapper">
                    Voor lokale bedrijven
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="contact-section" aria-labelledby="contact-help-title">
            <div className="contact-shell">
              <div className="contact-section-header">
                <p className="contact-label">Hoe kunnen we je helpen?</p>
                <h2 id="contact-help-title">Kies de vraag die het beste past</h2>
                <p className="contact-section-copy">
                  Kies wat aansluit op jouw vraag. We bespreken wat je wilt bereiken en welke oplossing bij je bedrijf past.
                </p>
              </div>

              <div className="contact-card-grid">
                {CONTACT_CARDS.map(({ title, text, icon: Icon }) => (
                  <article className="contact-card" key={title}>
                    <span className="contact-card-icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="contact-section" aria-labelledby="contact-form-title">
            <div className="contact-shell contact-main-grid">
              <section className="contact-panel contact-form-panel" id="contact-form">
                <div className="contact-section-header">
                  <p className="contact-label">Stuur ons een bericht</p>
                  <h2 id="contact-form-title">Stuur ons een bericht</h2>
                  <p className="contact-section-copy">
                    Vertel kort waar je mee geholpen wilt worden. Je aanvraag is vrijblijvend.
                  </p>
                </div>

                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="contact-form-grid">
                    <div className="contact-field">
                      <label htmlFor="contact-name">Naam</label>
                      <input id="contact-name" name="name" value={form.name} onChange={updateField} autoComplete="name" required />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="contact-company">Bedrijfsnaam</label>
                      <input id="contact-company" name="companyName" value={form.companyName} onChange={updateField} autoComplete="organization" />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="contact-email">E-mailadres</label>
                      <input id="contact-email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required />
                    </div>
                    <div className="contact-field">
                      <label htmlFor="contact-phone">Telefoonnummer</label>
                      <input id="contact-phone" name="phone" type="tel" value={form.phone} onChange={updateField} autoComplete="tel" />
                    </div>
                    <div className="contact-field contact-field-wide">
                      <label htmlFor="contact-help-type">Waarmee kunnen we helpen?</label>
                      <select id="contact-help-type" name="helpType" value={form.helpType} onChange={updateField}>
                        {HELP_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="contact-field contact-field-wide">
                      <label htmlFor="contact-message">Bericht</label>
                      <textarea id="contact-message" name="message" value={form.message} onChange={updateField} required />
                    </div>
                  </div>

                  {status.type !== "idle" && (
                    <div
                      className={`contact-status ${
                        status.type === "success" ? "contact-status-success" : "contact-status-error"
                      }`}
                      role={status.type === "error" ? "alert" : "status"}
                    >
                      {status.message}
                    </div>
                  )}

                  <button className="contact-btn contact-btn-dark" type="submit" disabled={submitting}>
                    {submitting ? "E-mail voorbereiden..." : "Open e-mail met je aanvraag"}
                    <Send size={18} aria-hidden="true" />
                  </button>
                  <p className="contact-form-microcopy">
                    Dit opent je e-mailprogramma met je ingevulde bericht. Verstuur de e-mail daar om je aanvraag te verzenden. Je aanvraag is vrijblijvend.
                  </p>
                </form>
              </section>

              <aside className="contact-panel contact-details-panel" aria-labelledby="direct-contact-title">
                <div className="contact-section-header">
                  <p className="contact-label">Direct contact</p>
                  <h2 id="direct-contact-title">Direct contact</h2>
                  <p className="contact-section-copy">
                    Liever direct contact? Stuur ons je vraag via WhatsApp of e-mail.
                  </p>
                </div>

                <div className="contact-details-list">
                  <div className="contact-detail-item">
                    <span>Bedrijf</span>
                    <strong>Vedantix</strong>
                  </div>
                  <div className="contact-detail-item">
                    <span>Website</span>
                    <a href="https://vedantix.nl">https://vedantix.nl</a>
                  </div>
                  <div className="contact-detail-item">
                    <span>E-mail</span>
                    <a href={`mailto:${CONTACT.EMAIL}`}>{CONTACT.EMAIL}</a>
                  </div>
                  <div className="contact-detail-item">
                    <span>WhatsApp</span>
                    <a href={whatsappUrl} target="_blank" rel="noreferrer">
                      {CONTACT.PHONE_DISPLAY}
                    </a>
                  </div>
                </div>

                <div className="contact-direct-actions">
                  <a className="contact-btn contact-btn-dark" href={whatsappUrl} target="_blank" rel="noreferrer">
                    <MessageCircle size={18} aria-hidden="true" /> Plan vrijblijvend een kennismaking
                  </a>
                  <a className="contact-btn" href={`mailto:${CONTACT.EMAIL}`}>
                    <Mail size={18} aria-hidden="true" /> E-mail Vedantix
                  </a>
                </div>
              </aside>
            </div>
          </section>

          <section className="contact-section" aria-labelledby="contact-faq-title">
            <div className="contact-shell">
              <div className="contact-section-header">
                <p className="contact-label">Veelgestelde vragen</p>
                <h2 id="contact-faq-title">Veelgestelde vragen</h2>
              </div>

              <div className="contact-faq-grid">
                {FAQS.map((faq) => (
                  <article className="contact-faq-card" key={faq.question}>
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="contact-final">
            <div className="contact-shell">
              <div className="contact-final-card">
                <CheckCircle2 size={34} aria-hidden="true" />
                <h2>Klaar voor de volgende stap in je bedrijf?</h2>
                <p>
                  Laat weten waar je tegenaan loopt of wat je wilt laten maken. Dan ontvang je eerlijk advies over de beste volgende stap.
                </p>
                <div className="contact-final-actions">
                  <a className="contact-btn contact-btn-primary" href="#contact-form">
                    Neem contact op <ArrowRight size={18} aria-hidden="true" />
                  </a>
                  <a className="contact-btn contact-btn-outline" href={whatsappUrl} target="_blank" rel="noreferrer">
                    WhatsApp ons direct
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

      </div>
    </>
  );
}

