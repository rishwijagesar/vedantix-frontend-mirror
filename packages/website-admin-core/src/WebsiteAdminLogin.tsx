import { useEffect, useId, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { safePublicUrl } from "./navigation";
import { useLoginPresentation } from "./useLoginPresentation";
import type { WebsiteAdminLoginProps, WebsiteAdminLoginMode } from "./types";

function Arrow() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5m7-7-7 7 7 7" /></svg>;
}

export function WebsiteAdminLogin({ site, onSubmit, mode = "customer", onModeChange, busy = false, error, notice, recoveryUrl, supportEmail, returnUrl, demoUrl, footer, className = "" }: WebsiteAdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");
  const formId = useId();
  const requestActive = useRef(false);
  const mounted = useRef(true);
  const interacted = useRef(false);
  const presentation = useLoginPresentation(interacted);
  const pending = busy || submitting;
  const back = safePublicUrl(returnUrl || site.publicUrl);
  const recovery = recoveryUrl ? safePublicUrl(recoveryUrl) : null;
  const demo = demoUrl ? safePublicUrl(demoUrl) : null;
  const support = supportEmail && /^[^\s@<>?&#]+@[^\s@<>?&#]+\.[^\s@<>?&#]+$/.test(supportEmail) ? `mailto:${supportEmail}` : null;
  const message = error || localError;
  const style = { "--va-login-primary": presentation.primaryColor, "--va-login-bg": presentation.backgroundColor, "--va-login-radius": presentation.borderRadius } as CSSProperties;

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { setPassword(""); setLocalError(""); }, [mode]);

  function chooseMode(next: WebsiteAdminLoginMode) {
    interacted.current = true;
    if (next === mode || pending) return;
    setPassword(""); setLocalError("");
    onModeChange?.(next);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    interacted.current = true;
    if (pending || requestActive.current) return;
    requestActive.current = true;
    setSubmitting(true); setLocalError("");
    try {
      // A single explicit provider choice. The component never retries a password elsewhere.
      await onSubmit({ email: email.trim(), password, mode });
    } catch {
      if (mounted.current) setLocalError("Inloggen is niet gelukt. Controleer je gegevens en probeer het opnieuw.");
    } finally {
      requestActive.current = false;
      if (mounted.current) setSubmitting(false);
    }
  }

  const brand = <a className="va-login-brand" href="https://vedantix.nl" target="_blank" rel="noopener noreferrer" aria-label="Vedantix website openen">{presentation.brandName}<span aria-hidden="true">®</span></a>;

  return <main className={`va-login va-login-${presentation.layout} ${className}`.trim()} style={style} onFocusCapture={() => { interacted.current = true; }} onPointerDownCapture={() => { interacted.current = true; }}>
    <aside className="va-login-story" aria-label="Vedantix websitebeheer">
      {brand}
      <div className="va-login-story-copy"><p className="va-login-eyebrow">{presentation.eyebrow}</p><h1>{presentation.storyTitle}</h1><p className="va-login-story-text">{presentation.storyText}</p></div>
      <p className="va-login-signature">Content door jou. Design door Vedantix.</p>
    </aside>
    <section className="va-login-form-side" aria-labelledby={`${formId}-heading`}>
      {back && <a className="va-login-back" href={back}><Arrow /><span>Terug naar {site.name}</span></a>}
      <div className="va-login-card">
        <div className="va-login-compact-brand">{brand}</div>
        <div className="va-login-tenant">{site.logoUrl && <img src={site.logoUrl} width="46" height="46" alt="" />}<div><span>Websitebeheer</span><strong>{site.name}</strong></div></div>
        <h2 id={`${formId}-heading`}>{presentation.heading}</h2><p className="va-login-description">{presentation.description}</p>
        {onModeChange && <div className="va-login-modes" role="group" aria-label="Kies je accounttype"><button type="button" aria-pressed={mode === "customer"} disabled={pending} onClick={() => chooseMode("customer")}>Mijn website</button><button type="button" aria-pressed={mode === "platform"} disabled={pending} onClick={() => chooseMode("platform")}>Vedantix-beheerder</button></div>}
        <p className="va-login-account-note" id={`${formId}-account-note`}>{mode === "platform" ? "Gebruik je Vedantix-beheeraccount voor deze website." : `Gebruik je bestaande account voor ${site.name}.`}</p>
        <form className="va-login-form" onSubmit={submit} aria-describedby={`${formId}-account-note`} aria-busy={pending} onInputCapture={() => { interacted.current = true; }}>
          <label htmlFor={`${formId}-email`}>E-mailadres</label><input id={`${formId}-email`} name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={event => setEmail(event.target.value)} disabled={pending} />
          <label htmlFor={`${formId}-password`}>Wachtwoord</label><input id={`${formId}-password`} name="password" type="password" autoComplete="current-password" required value={password} onChange={event => setPassword(event.target.value)} disabled={pending} />
          {message && <p role="alert" className="va-login-error">{message}</p>}
          {notice && <p role="status" className="va-login-notice">{notice}</p>}
          <button className="va-login-submit" type="submit" disabled={pending}>{pending ? "Bezig met inloggen…" : "Veilig inloggen"}</button>
          {recovery && <a className="va-login-recovery" href={recovery}>Wachtwoord vergeten?</a>}
        </form>
        {support && <p className="va-login-help">Hulp nodig met je account? Neem contact op met <a href={support}>Vedantix</a>.</p>}
        {demo && <div className="va-login-demo"><a href={demo}>Bekijk een voorbeeld van het beheer →</a><span>Je kunt rondkijken zonder iets te publiceren.</span></div>}
        {footer && <div className="va-login-footer">{footer}</div>}
      </div>
    </section>
  </main>;
}
