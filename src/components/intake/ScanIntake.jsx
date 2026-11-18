import { useEffect, useRef, useState } from "react";
import { Check, MessageCircle, X } from "lucide-react";
import { INTAKE_STEPS, INTAKE_WELCOME, intakeMessage } from "../../data/scan-intake";
import { submitContactEnquiry } from "../../lib/website-enquiry";
import { CONTACT } from "../../constants/contact";
import "../../styles/vx-intake.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Begeleide intake voor de gratis bedrijfsscan. Geen AI: vaste vragen met klikbare antwoorden,
 * daarna contactgegevens. Verstuurt via de contact-enquiry Edge Function en meldt alleen succes
 * als de server de aanvraag heeft opgeslagen.
 */
export default function ScanIntake({ sourcePath = "/bedrijfsscan", onClose = null, titleId = "vx-intake-title" }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [picked, setPicked] = useState([]);
  const [form, setForm] = useState({ name: "", companyName: "", email: "", phone: "", note: "", website: "" });
  const [consent, setConsent] = useState(false);
  const [tried, setTried] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");
  const logRef = useRef(null);
  const firstFieldRef = useRef(null);

  const inQuestions = step < INTAKE_STEPS.length;
  const current = inQuestions ? INTAKE_STEPS[step] : null;
  const done = status === "done";

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [step, status]);

  useEffect(() => {
    if (!inQuestions && !done) firstFieldRef.current?.focus();
  }, [inQuestions, done]);

  function answer(value) {
    setAnswers((prev) => ({ ...prev, [current.key]: value }));
    setPicked([]);
    setStep((s) => s + 1);
  }
  function toggle(option) {
    setPicked((prev) => (prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]));
  }
  function back() {
    if (step === 0) return;
    const prevStep = INTAKE_STEPS[step - 1];
    const prevValue = answers[prevStep.key];
    setPicked(prevStep.multi && Array.isArray(prevValue) ? prevValue : []);
    setStep((s) => s - 1);
  }
  const update = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const formOk = form.name.trim().length > 1 && EMAIL_RE.test(form.email.trim()) && consent;

  async function submit(event) {
    event.preventDefault();
    if (!formOk) { setTried(true); return; }
    setStatus("sending");
    setError("");
    try {
      await submitContactEnquiry({
        name: form.name.trim(),
        companyName: form.companyName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        helpType: "Bedrijfsscan (chat)",
        message: intakeMessage(answers, form.note),
        website: form.website,
      }, sourcePath);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Versturen is niet gelukt.");
    }
  }

  const messages = [{ bot: true, text: INTAKE_WELCOME }];
  for (let i = 0; i < step && i < INTAKE_STEPS.length; i += 1) {
    const value = answers[INTAKE_STEPS[i].key];
    messages.push({ bot: true, text: INTAKE_STEPS[i].question });
    messages.push({ bot: false, text: Array.isArray(value) ? value.join(", ") : value });
  }
  if (current) messages.push({ bot: true, text: current.question });
  if (!inQuestions && !done) messages.push({ bot: true, text: "Top, helder beeld! Waar mogen we je bereiken? Dan plannen we samen een moment voor de scan." });
  if (done) messages.push({ bot: true, text: `Bedankt${form.name.trim() ? ` ${form.name.trim().split(" ")[0]}` : ""}! Je aanvraag is binnen. We nemen zo snel mogelijk contact met je op om een moment te plannen.` });

  const progress = Math.round(((done ? INTAKE_STEPS.length + 1 : Math.min(step, INTAKE_STEPS.length)) / (INTAKE_STEPS.length + 1)) * 100);
  const stepLabel = done ? "Klaar" : inQuestions ? `Vraag ${step + 1} van ${INTAKE_STEPS.length}` : "Laatste stap";

  return (
    <div className="vx-intake">
      <div className="vx-intake__head">
        <span className="vx-intake__avatar" aria-hidden="true"><MessageCircle /></span>
        <span className="vx-intake__title">
          <strong id={titleId}>Intake gratis bedrijfsscan</strong>
          <span>{stepLabel} · ongeveer 1 minuut</span>
        </span>
        {onClose ? (
          <button type="button" className="vx-intake__close" onClick={onClose} aria-label="Chat sluiten"><X aria-hidden="true" /></button>
        ) : null}
      </div>
      <div className="vx-intake__bar" role="progressbar" aria-label="Voortgang intake" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div>

      <div className="vx-intake__log" ref={logRef} role="log" aria-live="polite" aria-label="Gesprek">
        {messages.map((m, i) => (
          <p key={i} className={m.bot ? "vx-intake__msg" : "vx-intake__msg is-user"}>{m.text}</p>
        ))}
      </div>

      {current ? (
        <div className="vx-intake__answers">
          <div className="vx-intake__options" role="group" aria-label={current.question}>
            {current.options.map((option) => {
              const selected = picked.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  className={selected ? "vx-intake__opt is-selected" : "vx-intake__opt"}
                  aria-pressed={current.multi ? selected : undefined}
                  onClick={() => (current.multi ? toggle(option) : answer(option))}
                >
                  {selected ? <Check aria-hidden="true" /> : null}{option}
                </button>
              );
            })}
          </div>
          <div className="vx-intake__nav">
            {step > 0 ? <button type="button" className="vx-intake__back" onClick={back}>← Vorige</button> : <span />}
            {current.multi ? (
              <button type="button" className="vx-intake__next" onClick={() => picked.length && answer(picked)} disabled={!picked.length}>Verder →</button>
            ) : null}
          </div>
        </div>
      ) : null}

      {!inQuestions && !done ? (
        <form className="vx-intake__form" onSubmit={submit} noValidate>
          <label>Naam *<input ref={firstFieldRef} type="text" autoComplete="name" value={form.name} onChange={update("name")} required aria-invalid={tried && form.name.trim().length < 2} /></label>
          <label>Bedrijf<input type="text" autoComplete="organization" value={form.companyName} onChange={update("companyName")} /></label>
          <label>E-mail *<input type="email" autoComplete="email" value={form.email} onChange={update("email")} required aria-invalid={tried && !EMAIL_RE.test(form.email.trim())} /></label>
          <label>Telefoon<input type="tel" autoComplete="tel" value={form.phone} onChange={update("phone")} /></label>
          <label className="is-wide">Nog iets toevoegen? (optioneel)<textarea rows={2} value={form.note} onChange={update("note")} /></label>
          <label className="vx-intake__hp" aria-hidden="true">Website<input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={update("website")} /></label>
          <label className="vx-intake__consent is-wide">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Vedantix mag mijn antwoorden gebruiken om contact op te nemen over de bedrijfsscan. Lees de <a href="/privacy">privacyverklaring</a>.</span>
          </label>
          {tried && !formOk ? <p className="vx-intake__error is-wide" role="alert">Vul je naam en een geldig e-mailadres in en geef toestemming.</p> : null}
          {status === "error" ? (
            <p className="vx-intake__error is-wide" role="alert">{error} Stuur gerust een WhatsApp naar <a href={CONTACT.WHATSAPP_URL}>{CONTACT.PHONE_DISPLAY}</a>.</p>
          ) : null}
          <div className="vx-intake__nav is-wide">
            <button type="button" className="vx-intake__back" onClick={back}>← Vorige</button>
            <button type="submit" className="vx-intake__submit" disabled={status === "sending"}>{status === "sending" ? "Versturen…" : "Verstuur aanvraag"}</button>
          </div>
        </form>
      ) : null}

      {done ? (
        <p className="vx-intake__done" role="status"><Check aria-hidden="true" />Aanvraag verstuurd</p>
      ) : null}
    </div>
  );
}
