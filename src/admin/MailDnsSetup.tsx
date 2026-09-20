import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { dnsAction, type DnsPlan } from "./mail-dns-data";
import type { DnsRecord } from "./mail-management-data";

const button = "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium disabled:opacity-50";
const primary = "inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50";
const labels = { create: "Toevoegen", update: "Aanvullen", unchanged: "Al ingesteld", blocked: "Controle nodig" };

export function MailDnsSetup({ domainId, domainName, records, onActivate, activating, onClose }: {
  domainId: string; domainName: string; records: DnsRecord[];
  onActivate: () => Promise<boolean>; activating: boolean; onClose: () => void;
}) {
  const [plan, setPlan] = useState<DnsPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [change, setChange] = useState<{ id: string; status: string } | null>(null);
  const [message, setMessage] = useState("");
  const disabled = busy || activating;
  async function preview() {
    setBusy(true); setError(""); setPlan(null); setConfirmed(false); setMessage("");
    try { setPlan(await dnsAction("preview", domainId)); }
    catch (e) { setError(e instanceof Error ? e.message : "Het voorstel kon niet worden geladen."); }
    finally { setBusy(false); }
  }
  useEffect(() => { void preview(); }, [domainId]);
  async function apply() {
    if (!plan || !confirmed) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await dnsAction("apply", domainId, { fingerprint: plan.fingerprint, confirm_domain: domainName });
      setPlan(null); setConfirmed(false);
      setChange({ id: result.change_id || "", status: result.status });
      setMessage(result.status === "UNCHANGED" ? "De mailrecords staan al goed. Je kunt het domein nu laten controleren door Migadu." : "AWS heeft de wijziging ontvangen. Controleer hieronder wanneer de verwerking klaar is.");
    } catch (e) {
      setPlan(null); setConfirmed(false);
      setError(e instanceof Error ? e.message : "De wijziging is niet bevestigd. Vernieuw eerst het voorstel.");
    } finally { setBusy(false); }
  }
  async function checkStatus() {
    if (!change?.id) return;
    setBusy(true); setError("");
    try {
      const result = await dnsAction("status", domainId, { change_id: change.id });
      setChange({ ...change, status: result.status });
      setMessage(result.status === "INSYNC" ? "De records zijn verwerkt door Route 53. Laat Migadu nu controleren of het domein klaar is voor e-mail." : "Route 53 verwerkt de records nog. Controleer over een minuut opnieuw.");
    } catch (e) { setError(e instanceof Error ? e.message : "De status kon niet worden gecontroleerd."); }
    finally { setBusy(false); }
  }
  const ready = change?.status === "INSYNC" || change?.status === "UNCHANGED" || (plan && plan.blockers.length === 0 && plan.change_count === 0);
  return <section className="space-y-4 rounded-xl border border-slate-200 p-4" aria-label="DNS-inrichting">
    <div className="flex flex-wrap items-center justify-between gap-3"><h4 className="font-semibold">E-mail instellen voor {domainName}</h4><button className={button} type="button" disabled={disabled} onClick={onClose}>Sluiten</button></div>
    <p className="text-sm leading-6 text-slate-600">Vedantix haalt de mailinstellingen op bij Migadu en vergelijkt ze met Route 53. Bekijk het voorstel en stel ze daarna in. Bestaande website- en verificatierecords blijven behouden.</p>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
    <button type="button" className={button} disabled={disabled} onClick={preview}><RefreshCw size={15} />{busy ? "Controleren…" : "DNS-voorstel vernieuwen"}</button>
    {plan && <>
      {plan.blockers.length > 0 && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><strong className="text-sm">Eerst controleren</strong><ul className="mt-2 list-disc space-y-2 pl-5 text-sm">{plan.blockers.map(b => <li key={b}>{b}</li>)}</ul><p className="mt-3 text-sm">Er wordt niets aangepast zolang deze punten niet zijn opgelost.</p></div>}
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Voorgestelde mailinstellingen voor {domainName}</caption><thead><tr className="border-b"><th className="p-2">Record</th><th className="p-2">Wijziging</th><th className="p-2">Instellingen</th></tr></thead><tbody>{plan.records.map(r => <tr key={r.name + r.type} className="border-b border-slate-100 align-top"><td className="p-2"><strong>{r.type}</strong><span className="mt-1 block max-w-56 break-all text-xs text-slate-500">{r.name}</span></td><td className="whitespace-nowrap p-2">{labels[r.state]}</td><td className="min-w-64 p-2"><details open={r.state === "create" || r.state === "update"}><summary className="cursor-pointer text-xs">Waarden bekijken</summary><div className="mt-2 space-y-2 break-all font-mono text-xs">{r.before.length > 0 && <div><span className="font-sans font-semibold">Nu</span>{r.before.map((v,i) => <p key={i}>{v}</p>)}</div>}<div><span className="font-sans font-semibold">Na instellen</span>{r.after.map((v,i) => <p key={i}>{v}</p>)}</div></div></details>{r.note && <p className="mt-2 text-xs text-amber-800">{r.note}</p>}</td></tr>)}</tbody></table></div>
      {plan.blockers.length === 0 && plan.change_count > 0 && <div className="space-y-3 rounded-xl bg-slate-50 p-4"><label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={confirmed} disabled={disabled} onChange={e => setConfirmed(e.target.checked)} /><span>Ik wil de e-mail voor <strong>{domainName}</strong> via Migadu laten lopen en dit voorstel instellen.</span></label><button type="button" className={primary} disabled={disabled || !confirmed} onClick={apply}>{busy ? "Instellen…" : `${plan.change_count} mailrecords automatisch instellen`}</button></div>}
      {plan.blockers.length === 0 && plan.change_count === 0 && <p className="flex items-center gap-2 text-sm text-emerald-800"><CheckCircle2 size={16} />Alle benodigde mailrecords staan al ingesteld.</p>}
    </>}
    {change?.id && <button type="button" className={button} disabled={disabled} onClick={checkStatus}>Verwerking bij AWS controleren</button>}
    {ready && <div className="space-y-3 rounded-xl bg-emerald-50 p-4"><p className="text-sm">Laatste stap: Migadu controleert of de mailinstellingen publiek zichtbaar zijn. Dit kan na een wijziging even duren.</p><button type="button" className={primary} disabled={disabled} onClick={onActivate}>{activating ? "Controleren…" : "DNS controleren en domein activeren"}</button></div>}
    <details className="rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-medium">Handmatig instellen bij een andere DNS-provider</summary><p className="my-3 text-xs leading-5 text-slate-500">Gebruik deze records van Migadu. Controleer bestaande mailinstellingen voordat je ze toevoegt. Na instellen kun je de activatie hier controleren.</p><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead><tr><th className="p-2">Doel</th><th className="p-2">Type / naam</th><th className="p-2">Waarde</th></tr></thead><tbody>{records.map((r,i) => <tr key={i} className="border-t"><td className="p-2">{r.purpose}</td><td className="p-2">{r.type} {r.name}</td><td className="min-w-64 break-all p-2 font-mono">{r.priority !== null ? r.priority + " " : ""}{r.value}</td></tr>)}</tbody></table></div><button type="button" className={button + " mt-3"} disabled={disabled} onClick={onActivate}>Handmatig ingestelde DNS controleren en activeren</button></details>
  </section>;
}
