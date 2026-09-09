import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type AuthState = "loading" | "signed-out" | "forbidden" | "ready";

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
  const [message, setMessage] = useState("");

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
    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      // Run outside the auth callback to avoid lock contention with Supabase auth methods.
      setTimeout(() => void refresh(), 0);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function sendMagicLink(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setMessage("Beveiligde inloglink aanvragen…");

    const { data, error } = await supabase.functions.invoke("admin-magic-link", {
      body: { email: normalizedEmail },
    });

    if (error) {
      setMessage("Inloggen is tijdelijk niet beschikbaar. Probeer het later opnieuw.");
      return;
    }

    setMessage(data?.message || "Als dit e-mailadres geautoriseerd is, ontvang je een beveiligde inloglink.");
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

  if (state === "signed-out") {
    return (
      <AuthShell>
        <form className="space-y-4" onSubmit={sendMagicLink}>
          <div>
            <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Vedantix Admin</span>
            <h1 className="mt-2 text-2xl font-bold">Inloggen</h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">Gebruik je geautoriseerde Vedantix e-mailadres. Je ontvangt een beveiligde magic link.</p>
          </div>
          <label className="block text-sm font-semibold text-slate-700" htmlFor="admin-email">E-mailadres</label>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
            id="admin-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <button className="w-full rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white" type="submit">Stuur inloglink</button>
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
