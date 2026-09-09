import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type AuthState = "loading" | "signed-out" | "forbidden" | "ready" | "recovery";

const AUTH_TIMEOUT_MS = 8000;

async function withTimeout<T>(promise: Promise<T>, ms = AUTH_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Auth check timed out")), ms);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-16 text-slate-950">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {children}
      </div>
    </div>
  );
}

export default function AdminAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>("loading");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const { data: sessionData, error: sessionError } = await withTimeout(supabase.auth.getSession());
        if (!mounted) return;

        if (sessionError || !sessionData.session?.user?.id) {
          setState("signed-out");
          return;
        }

        const userId = sessionData.session.user.id;
        const { data, error } = await withTimeout(
          supabase
            .from("staff_users")
            .select("user_id, role, active")
            .eq("user_id", userId)
            .eq("active", true)
            .maybeSingle(),
        );

        if (!mounted) return;
        if (error || !data) {
          setState("forbidden");
          return;
        }

        setState("ready");
      } catch (error) {
        console.error("Admin auth check failed", error);
        if (!mounted) return;
        setMessage("De sessiecontrole duurde te lang of mislukte. Log opnieuw in.");
        setState("signed-out");
      }
    }

    void refresh();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setState("recovery");
        return;
      }
      setTimeout(() => void refresh(), 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Normal admin access uses password auth; email is only used for account recovery.
  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: normalizedEmail, password }),
      );

      if (error) {
        setMessage("E-mailadres of wachtwoord is onjuist.");
        return;
      }

      setState("loading");
    } catch (error) {
      console.error("Admin password login failed", error);
      setMessage("Inloggen is tijdelijk niet beschikbaar. Probeer het opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  async function requestPasswordReset() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage("Vul eerst je e-mailadres in.");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke("admin-password-reset", {
          body: { email: normalizedEmail },
        }),
      );
      if (error) throw error;
      setMessage(
        data?.message ||
          "Als dit account bestaat en geautoriseerd is, ontvang je een e-mail om je wachtwoord opnieuw in te stellen.",
      );
    } catch (error) {
      console.error("Admin password reset request failed", error);
      setMessage("Wachtwoord herstellen is tijdelijk niet beschikbaar. Probeer het later opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  async function updateRecoveredPassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");

    if (newPassword.length < 12) {
      setMessage("Gebruik minimaal 12 tekens voor je nieuwe wachtwoord.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("De twee wachtwoorden komen niet overeen.");
      return;
    }

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      window.history.replaceState({}, "", "/admin");
      window.location.reload();
    } catch (error) {
      console.error("Admin password update failed", error);
      setMessage("Het wachtwoord kon niet worden gewijzigd. Vraag eventueel een nieuwe resetlink aan.");
    } finally {
      setBusy(false);
    }
  }

  if (state === "loading") {
    return (
      <AuthShell>
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-700">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" aria-hidden="true" />
          Control Center laden…
        </div>
      </AuthShell>
    );
  }

  if (state === "recovery") {
    return (
      <AuthShell>
        <form className="space-y-4" onSubmit={updateRecoveredPassword}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Vedantix Admin</span>
            <h1 className="mt-2 text-2xl font-bold">Nieuw wachtwoord</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Kies een nieuw wachtwoord van minimaal 12 tekens.</p>
          </div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="admin-new-password">Nieuw wachtwoord</label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            id="admin-new-password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            minLength={12}
            required
          />
          <label className="block text-sm font-semibold text-slate-700" htmlFor="admin-confirm-password">Herhaal wachtwoord</label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            id="admin-confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            minLength={12}
            required
          />
          <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" type="submit" disabled={busy}>
            {busy ? "Opslaan…" : "Wachtwoord opslaan"}
          </button>
          {message ? <p className="text-sm leading-6 text-slate-500">{message}</p> : null}
        </form>
      </AuthShell>
    );
  }

  if (state === "signed-out") {
    return (
      <AuthShell>
        <form className="space-y-4" onSubmit={signIn}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Vedantix Admin</span>
            <h1 className="mt-2 text-2xl font-bold">Inloggen</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Log in met je geautoriseerde e-mailadres en wachtwoord. Je sessie blijft op dit apparaat bewaard.</p>
          </div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="admin-email">E-mailadres</label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            id="admin-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label className="block text-sm font-semibold text-slate-700" htmlFor="admin-password">Wachtwoord</label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            id="admin-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" type="submit" disabled={busy}>
            {busy ? "Inloggen…" : "Inloggen"}
          </button>
          <button className="w-full text-sm font-semibold text-slate-600 underline-offset-4 hover:underline disabled:opacity-50" type="button" onClick={requestPasswordReset} disabled={busy}>
            Wachtwoord vergeten?
          </button>
          {message ? <p className="text-sm leading-6 text-slate-500">{message}</p> : null}
        </form>
      </AuthShell>
    );
  }

  if (state === "forbidden") {
    return (
      <AuthShell>
        <span className="text-xs font-semibold uppercase tracking-[.16em] text-red-500">Geen toegang</span>
        <h1 className="mt-2 text-2xl font-bold">Account niet geautoriseerd</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">Je bent wel ingelogd, maar dit account staat niet als actieve Vedantix staff-user geregistreerd.</p>
        <button className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" type="button" onClick={() => supabase.auth.signOut()}>Uitloggen</button>
      </AuthShell>
    );
  }

  return <>{children}</>;
}
