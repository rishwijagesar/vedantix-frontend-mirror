import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, LockKeyhole, Mail, Send, ShieldCheck, X } from "lucide-react";
import { getDeliveryConfig } from "./monitoring-data";
import { getCurrentStaffRole, saveMigaduCredentials, sendMigaduTestEmail } from "./migadu-credentials";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function MigaduCredentialModal({ open, onClose, onSaved }: Props) {
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [user, setUser] = useState("info@vedantix.nl");
  const [password, setPassword] = useState("");
  const [alertTo, setAlertTo] = useState("info@vedantix.nl");
  const [alertFrom, setAlertFrom] = useState("info@vedantix.nl");
  const [busy, setBusy] = useState<"save" | "test" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    setRoleLoading(true);
    setError(null);
    setSuccess(null);

    Promise.all([getCurrentStaffRole(), getDeliveryConfig()])
      .then(([nextRole, delivery]) => {
        if (!mounted) return;
        setRole(nextRole);
        setConfigured(delivery?.credentials_configured === true);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Migadu-configuratie kon niet worden gecontroleerd.");
      })
      .finally(() => {
        if (mounted) setRoleLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [open]);

  if (!open) return null;

  const isAdmin = role === "ADMIN";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin || busy) return;
    setBusy("save");
    setError(null);
    setSuccess(null);

    try {
      const result = await saveMigaduCredentials({
        user,
        password,
        alert_to: alertTo,
        alert_from: alertFrom,
      });
      setPassword("");
      setConfigured(true);
      setSuccess(`Migadu-authenticatie gelukt voor ${result.user}. Credentials zijn versleuteld opgeslagen in Supabase Vault. Je kunt nu direct een testmail versturen.`);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Migadu-configuratie is mislukt.");
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    if (!isAdmin || !configured || busy) return;
    setBusy("test");
    setError(null);
    setSuccess(null);
    try {
      const result = await sendMigaduTestEmail();
      setSuccess(`Testmail is via Migadu verstuurd naar ${result.recipients.join(", ")}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Migadu testmail kon niet worden verstuurd.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="migadu-title">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400"><Mail size={14} /> Migadu SMTP</div>
            <h2 id="migadu-title" className="text-xl font-bold text-slate-950">Monitoring e-mail configureren</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">De browser stuurt de gegevens rechtstreeks naar de beveiligde Vedantix Edge Function. Het wachtwoord wordt alleen na succesvolle SMTP-authenticatie versleuteld in Supabase Vault opgeslagen.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Sluiten"><X size={18} /></button>
        </div>

        <div className="p-5">
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <SecurityPoint icon={ShieldCheck} title="ADMIN-only" text="Alleen actieve Vedantix admins." />
            <SecurityPoint icon={KeyRound} title="SMTP-validatie" text="Eerst echte Migadu login-test." />
            <SecurityPoint icon={LockKeyhole} title="Supabase Vault" text="Geen wachtwoord in GitHub of UI." />
          </div>

          {roleLoading ? <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">Adminrechten en deliverystatus controleren…</div> : null}
          {!roleLoading && !isAdmin ? <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Alleen een account met de rol ADMIN mag Migadu-credentials wijzigen.</div> : null}
          {error ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {success ? <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17} className="mt-0.5 shrink-0" />{success}</div> : null}

          {configured ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div>
                <strong className="text-sm text-emerald-900">Migadu credentials zijn geconfigureerd</strong>
                <p className="mt-1 text-xs leading-5 text-emerald-700">Gebruik de testmail om SMTP AUTH, MAIL FROM, RCPT TO en DATA end-to-end te controleren.</p>
              </div>
              <button type="button" onClick={sendTest} disabled={!isAdmin || busy !== null} className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Send size={15} />{busy === "test" ? "Testmail versturen…" : "Stuur testmail"}</button>
            </div>
          ) : null}

          <form onSubmit={submit} className="space-y-4">
            <Field label="Migadu mailbox" hint="Dit is de mailbox die bij Migadu SMTP mag aanmelden.">
              <input type="email" value={user} onChange={(event) => setUser(event.target.value)} autoComplete="username" required disabled={!isAdmin || busy !== null} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50" />
            </Field>

            <Field label="Migadu wachtwoord" hint={configured ? "Laat leeg zolang je de bestaande configuratie niet wilt vervangen." : "Wordt niet in GitHub, browser storage of deze chat opgeslagen."}>
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required={!configured} disabled={!isAdmin || busy !== null} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50" />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Alerts naar" hint="Voor één of meerdere adressen; meerdere adressen scheiden met een komma.">
                <input type="text" value={alertTo} onChange={(event) => setAlertTo(event.target.value)} disabled={!isAdmin || busy !== null} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50" />
              </Field>
              <Field label="Afzender" hint="Gebruik bij voorkeur dezelfde Migadu mailbox.">
                <input type="email" value={alertFrom} onChange={(event) => setAlertFrom(event.target.value)} disabled={!isAdmin || busy !== null} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 disabled:bg-slate-50" />
              </Field>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600">
              <strong className="block text-slate-800">Wat gebeurt er na opslaan?</strong>
              De backend maakt een TLS-verbinding met <code>smtp.migadu.com:465</code>, voert SMTP AUTH uit en schrijft de gegevens alleen bij succes naar Supabase Vault. Notification delivery blijft daarna nog uitgeschakeld totdat je hem in de monitoringconsole expliciet aanzet.
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={busy !== null} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Sluiten</button>
              <button type="submit" disabled={!isAdmin || !password || busy !== null} className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">{busy === "save" ? "Authenticeren en opslaan…" : configured ? "Credentials vervangen" : "Verbinding testen & veilig opslaan"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <span className="mb-1.5 mt-0.5 block text-xs font-normal text-slate-400">{hint}</span>
      {children}
    </label>
  );
}

function SecurityPoint({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <Icon size={16} className="mb-2 text-slate-700" />
      <strong className="block text-xs text-slate-900">{title}</strong>
      <span className="mt-1 block text-xs leading-5 text-slate-500">{text}</span>
    </div>
  );
}
