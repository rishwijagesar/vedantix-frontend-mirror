import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<"loading" | "signed-out" | "forbidden" | "ready">("loading");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      const { data: claimsData } = await supabase.auth.getClaims();
      const userId = claimsData?.claims?.sub;
      if (!mounted) return;

      if (!userId) {
        setState("signed-out");
        return;
      }

      const { data, error } = await supabase
        .from("staff_users")
        .select("user_id, role, active")
        .eq("user_id", userId)
        .eq("active", true)
        .maybeSingle();

      if (!mounted) return;
      if (error || !data) {
        setState("forbidden");
        return;
      }
      setState("ready");
    }

    refresh();
    const { data: listener } = supabase.auth.onAuthStateChange(() => refresh());
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setMessage("Bezig met controleren…");

    const normalizedEmail = email.trim().toLowerCase();
    const { data: allowed, error: guardError } = await supabase.rpc("can_request_admin_login", {
      p_email: normalizedEmail,
    });

    if (guardError) {
      setMessage("Toegang kon niet worden gecontroleerd. Probeer het opnieuw.");
      return;
    }

    if (!allowed) {
      setMessage("Dit e-mailadres is niet geautoriseerd voor het Vedantix Control Center.");
      return;
    }

    setMessage("Bezig met versturen…");
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/admin` : undefined;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    setMessage(error ? error.message : "Controleer je e-mail voor de inloglink.");
  }

  if (state === "loading") {
    return <div className="cc-auth-screen"><div className="cc-auth-card"><strong>Control Center laden…</strong></div></div>;
  }

  if (state === "signed-out") {
    return (
      <div className="cc-auth-screen">
        <form className="cc-auth-card" onSubmit={sendMagicLink}>
          <span className="cc-kicker">Vedantix Admin v3</span>
          <h1>Inloggen</h1>
          <p>Gebruik een geautoriseerd staff-adres of een e-mailadres met een actieve uitnodiging.</p>
          <label htmlFor="admin-email">E-mailadres</label>
          <input id="admin-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <button className="cc-primary-button" type="submit">Stuur inloglink</button>
          {message ? <small>{message}</small> : null}
        </form>
      </div>
    );
  }

  if (state === "forbidden") {
    return (
      <div className="cc-auth-screen">
        <div className="cc-auth-card">
          <span className="cc-kicker">Geen toegang</span>
          <h1>Account niet geautoriseerd</h1>
          <p>Dit account is ingelogd, maar heeft geen actieve Vedantix staff-rol. Vraag een ADMIN om de toegang of uitnodiging te controleren.</p>
          <button className="cc-primary-button" type="button" onClick={() => supabase.auth.signOut()}>Uitloggen</button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
