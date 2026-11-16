import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock, MessageCircle } from "lucide-react";
import { submitContactEnquiry, websiteEnquiryUrl } from "@/lib/website-enquiry";
import { readMarketingConsent } from "@/lib/marketing-consent";
import { CONTACT } from "@/constants/contact";
import "@/styles/quick-lead-form.css";

const TOPICS = ["Software op maat", "Website", "AI / automatisering", "Iets anders"];
const EMPTY = { name: "", email: "", phone: "", message: "" };

/** Reports a lead only after the server confirmed storage, and only with marketing consent. */
function trackLead(topic) {
  if (typeof window === "undefined" || readMarketingConsent() !== "granted") return;
  try { if (typeof window.fbq === "function") window.fbq("track", "Lead", { content_name: topic }); } catch { /* ignore */ }
  try { if (typeof window.gtag === "function") window.gtag("event", "generate_lead", { lead_topic: topic }); } catch { /* ignore */ }
}

/**
 * Short above-the-fold enquiry form for visitors from ads, Google or the Instagram bio link.
 * Uses the same contact-enquiry Edge Function as /contact and never claims delivery the server did not confirm.
 */
export default function QuickLeadForm({ id = "snel-contact", defaultTopic = TOPICS[0], sourcePath, title = "Plan een vrijblijvende kennismaking" }) {
  const [form, setForm] = useState(EMPTY);
  const [topic, setTopic] = useState(TOPICS.includes(defaultTopic) ? defaultTopic : TOPICS[0]);
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState({ type: "idle", message: "", fallback: "" });

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  async function onSubmit(event) {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setState({ type: "error", message: "Vul je naam en e-mailadres in.", fallback: "" });
      return;
    }
    const message = form.message.trim() || `Graag een kennismaking over: ${topic}.`;
    const path = sourcePath || (typeof window !== "undefined" ? window.location.pathname : "/");
    setState({ type: "sending", message: "", fallback: "" });
    try {
      await submitContactEnquiry({ name: form.name, email: form.email, phone: form.phone, helpType: topic, message, website: honeypot }, path);
      trackLead(topic);
      setForm(EMPTY);
      setState({ type: "success", message: "", fallback: "" });
    } catch (error) {
      const fallback = websiteEnquiryUrl(`Kennismaking Vedantix - ${topic}`, { Naam: form.name, "E-mailadres": form.email, Telefoonnummer: form.phone, Onderwerp: topic, Bericht: message });
      setState({ type: "error", message: `${error?.message || "Versturen is niet gelukt."} Je aanvraag is niet verzonden.`, fallback });
    }
  }

  const whatsapp = `${CONTACT.WHATSAPP_URL}?text=${encodeURIComponent(`Hallo Vedantix, ik heb een vraag over ${topic.toLowerCase()}.`)}`;

  if (state.type === "success") {
    return (
      <div className="qlf" id={id} role="status">
        <div className="qlf__done">
          <CheckCircle2 aria-hidden="true" />
          <p className="qlf__title">Bedankt, je aanvraag is ontvangen</p>
          <p className="qlf__sub">We nemen zo snel mogelijk contact met je op. Liever nu meteen schakelen?</p>
          <a className="qlf__alt" href={whatsapp} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" /> Stuur een WhatsApp-bericht</a>
        </div>
      </div>
    );
  }

  const sending = state.type === "sending";
  return (
    <form className="qlf" id={id} onSubmit={onSubmit} noValidate aria-labelledby={`${id}-title`}>
      <p className="qlf__title" id={`${id}-title`}>{title}</p>
      <p className="qlf__sub"><Clock aria-hidden="true" /> In 30 seconden ingevuld · we nemen snel contact op</p>

      <fieldset className="qlf__topics">
        <legend>Waar gaat het om?</legend>
        {TOPICS.map((option) => (
          <label key={option} className={option === topic ? "is-active" : ""}>
            <input type="radio" name="topic" value={option} checked={option === topic} onChange={() => setTopic(option)} />
            {option}
          </label>
        ))}
      </fieldset>

      <div className="qlf__row">
        <label className="qlf__field">
          <span>Naam</span>
          <input name="name" value={form.name} onChange={update} autoComplete="name" required maxLength={120} />
        </label>
        <label className="qlf__field">
          <span>Telefoon <small>(optioneel)</small></span>
          <input name="phone" type="tel" value={form.phone} onChange={update} autoComplete="tel" inputMode="tel" maxLength={40} />
        </label>
      </div>
      <label className="qlf__field">
        <span>E-mailadres</span>
        <input name="email" type="email" value={form.email} onChange={update} autoComplete="email" inputMode="email" required maxLength={254} />
      </label>
      <label className="qlf__field">
        <span>Wat wil je verbeteren? <small>(optioneel)</small></span>
        <textarea name="message" rows={2} value={form.message} onChange={update} maxLength={3500} placeholder="Bijv. offertes en planning staan nu in Excel" />
      </label>

      <label className="qlf__hp" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(event) => setHoneypot(event.target.value)} />
      </label>

      <button className="qlf__submit" type="submit" disabled={sending}>
        {sending ? "Versturen…" : <>Plan mijn kennismaking <ArrowRight aria-hidden="true" /></>}
      </button>

      {state.type === "error" ? (
        <p className="qlf__error" role="alert">
          {state.message}{" "}
          {state.fallback ? <><a href={state.fallback}>Stuur per e-mail</a> of <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp ons</a>.</> : null}
        </p>
      ) : (
        <p className="qlf__note">Of <a href={whatsapp} target="_blank" rel="noreferrer">stuur direct een WhatsApp</a>. We gebruiken je gegevens alleen om contact op te nemen (<a href="/privacy">privacy</a>).</p>
      )}
    </form>
  );
}
