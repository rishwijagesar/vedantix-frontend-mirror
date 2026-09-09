import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type State = "loading" | "signed-out" | "forbidden" | "ready" | "request" | "verify" | "reset" | "done";

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const token = useRef<string | null>(null);
  const recovering = useRef(false);
  const initialLink = useRef<{ invalid: boolean; type: "invite" | "recovery" } | null>(null);

  useEffect(() => {
    let mounted = true;
    let generation = 0;
    const params = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const invalid = params.has("error") || params.has("error_code") || query.has("error") || query.has("error_code");
    if (!initialLink.current) {
      recovering.current = query.get("recover") === "1" || ["recovery", "invite"].includes(params.get("type") || "");
      token.current = invalid ? null : params.get("token_hash");
      initialLink.current = { invalid, type: params.get("type") === "invite" ? "invite" : "recovery" };
      if (params.has("token_hash")) window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    async function refresh() {
      const current = ++generation;
      try {
        const { data: identity, error } = await supabase.auth.getUser();
        if (!mounted || current !== generation) return;
        if (recovering.current) {
          if (initialLink.current?.invalid) { setState("request"); setMessage("Deze herstellink is verlopen. Vraag een nieuwe link aan."); }
          else if (token.current) setState("verify");
          else if (!error && identity.user) { setEmail(identity.user.email || ""); setState("reset"); }
          else { setState("request"); setMessage("Vraag een nieuwe herstelmail aan."); }
          return;
        }
        if (error || !identity.user) { setState("signed-out"); return; }
        const { data, error: roleError } = await supabase.from("staff_users")
          .select("user_id, role, active").eq("user_id", identity.user.id).eq("active", true).maybeSingle();
        if (mounted && current === generation && !recovering.current) setState(roleError || !data ? "forbidden" : "ready");
      } catch { if (mounted && current === generation) setState("signed-out"); }
    }

    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") recovering.current = true;
      if (event === "SIGNED_OUT") {
        token.current = null;
        recovering.current = false;
        if (mounted) { setPassword(""); setConfirmation(""); setState("signed-out"); }
      } else if (!recovering.current || event === "PASSWORD_RECOVERY") {
        // Never await Auth calls inside its own callback lock.
        setTimeout(() => { if (mounted) void refresh(); }, 0);
      }
    });
    return () => { mounted = false; generation++; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      if (state === "signed-out") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
        if (error) throw new Error("Inloggen is niet gelukt. Controleer je e-mailadres en wachtwoord.");
        setPassword("");
      } else if (state === "request") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo: `${window.location.origin}/admin?recover=1`,
        });
        if (error) throw new Error("De herstelmail kon niet worden aangevraagd. Probeer het later opnieuw.");
        setMessage("Als er een account met dit e-mailadres bestaat, ontvang je een herstelmail.");
      } else if (state === "verify") {
        if (!token.current) throw new Error("Vraag een nieuwe herstelmail aan.");
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: token.current, type: initialLink.current?.type || "recovery" });
        token.current = null;
        if (error || !data.user) { setState("request"); throw new Error("Deze herstellink is ongeldig of verlopen."); }
        setEmail(data.user.email || "");
        setState("reset");
      } else if (state === "reset") {
        if (password.length < 12 || password !== confirmation) throw new Error("Gebruik minimaal 12 tekens en vul tweemaal hetzelfde wachtwoord in.");
        const { data, error: identityError } = await supabase.auth.getUser();
        if (identityError || !data.user) { setState("request"); throw new Error("Vraag een nieuwe herstelmail aan."); }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw new Error("Het wachtwoord kon niet worden gewijzigd. Kies een ander, uniek wachtwoord of vraag een nieuwe link aan.");
        setPassword(""); setConfirmation(""); setState("done");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Probeer het later opnieuw."); }
    finally { setBusy(false); }
  }

  if (state === "ready") return <>{children}</>;
  if (state === "loading") return <div className="cc-auth-screen"><div className="cc-auth-card" role="status">Control Center laden…</div></div>;
  if (state === "forbidden") return <div className="cc-auth-screen"><div className="cc-auth-card"><h1>Geen toegang tot het Control Center</h1><p>Je account heeft geen interne Vedantix-beheerrechten. Open de beheeromgeving van je eigen website.</p><button className="cc-primary-button" onClick={() => supabase.auth.signOut()}>Uitloggen</button></div></div>;

  return <div className="cc-auth-screen"><form className="cc-auth-card" onSubmit={submit}>
    <span className="cc-kicker">Vedantix</span>
    <h1>{state === "signed-out" ? "Inloggen" : state === "done" ? "Wachtwoord gewijzigd" : "Wachtwoord herstellen"}</h1>
    {state === "signed-out" && <p>Gebruik je Vedantix-account om verder te gaan.</p>}
    {state === "request" && <p>Je ontvangt een link waarmee je zelf een nieuw wachtwoord kunt kiezen.</p>}
    {state === "verify" && <p>Ga verder om een nieuw wachtwoord voor je beheeraccount te kiezen.</p>}
    {state === "reset" && <p>Kies een nieuw wachtwoord voor {email}. Dit geldt voor alle websites die je met dit account beheert.</p>}
    {(state === "signed-out" || state === "request") && <><label htmlFor="admin-email">E-mailadres</label><input id="admin-email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} /></>}
    {(state === "signed-out" || state === "reset") && <><label htmlFor="admin-password">{state === "reset" ? "Nieuw wachtwoord" : "Wachtwoord"}</label><input id="admin-password" type="password" autoComplete={state === "reset" ? "new-password" : "current-password"} minLength={state === "reset" ? 12 : undefined} value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} /></>}
    {state === "reset" && <><label htmlFor="admin-confirmation">Herhaal nieuw wachtwoord</label><input id="admin-confirmation" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={e => setConfirmation(e.target.value)} required disabled={busy} /></>}
    {state !== "done" && <button className="cc-primary-button" disabled={busy}>{busy ? "Even geduld…" : state === "signed-out" ? "Inloggen" : state === "request" ? "Herstelmail aanvragen" : state === "verify" ? "Verder met wachtwoordherstel" : "Wachtwoord opslaan"}</button>}
    {state === "signed-out" && <button type="button" disabled={busy} onClick={() => { recovering.current = true; setPassword(""); setMessage(""); setState("request"); }}>Wachtwoord vergeten?</button>}
    {state !== "signed-out" && <a href="/admin">{state === "done" ? "Naar het Control Center" : "Terug naar inloggen"}</a>}
    {message && <small role="status">{message}</small>}
  </form></div>;
}
