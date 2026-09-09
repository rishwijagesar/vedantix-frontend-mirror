import { useEffect, useState } from "react";
import { CheckCircle2, CircleOff, RefreshCw, Rocket, ShieldCheck, XCircle } from "lucide-react";
import {
  activateProductionCommerce,
  deactivateProductionCommerce,
  getProductionReadiness,
  type ProductionReadiness,
} from "./production-readiness-data";

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
    {ok ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} {label}
  </span>;
}

export default function ProductionReadinessModule() {
  const [data, setData] = useState<ProductionReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true); setError(null);
    try { setData(await getProductionReadiness()); }
    catch (e) { setError(e instanceof Error ? e.message : "Readinesscontrole mislukt"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function activate() {
    setWorking(true); setError(null);
    try { setData(await activateProductionCommerce()); }
    catch (e) { setError(e instanceof Error ? e.message : "Productieactivatie mislukt"); }
    finally { setWorking(false); }
  }

  async function deactivate() {
    setWorking(true); setError(null);
    try { setData(await deactivateProductionCommerce()); }
    catch (e) { setError(e instanceof Error ? e.message : "Deactiveren mislukt"); }
    finally { setWorking(false); }
  }

  const active = Boolean(data?.activated || (data?.billing?.delivery_enabled && data?.billing?.reminders_enabled));
  const ready = Boolean(data?.ready_for_activation || (data?.live?.ok && data?.staging?.ok));

  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Productiecutover</span>
          <h2 className="mt-1 text-xl font-bold">Commerce readiness</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Klantmail en automatische reminders kunnen pas worden geactiveerd wanneer AWS staging én vedantix.nl aantoonbaar dezelfde gevalideerde serverless-release gebruiken.</p>
        </div>
        <button type="button" onClick={load} disabled={loading || working} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/> Opnieuw controleren</button>
      </div>

      {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><div><span className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Live</span><h3 className="mt-1 font-semibold">vedantix.nl</h3></div>{data ? <StatusPill ok={Boolean(data.live?.ok)} label={data.live?.ok ? "AWS release actief" : "Nog oude release"}/> : null}</div><p className="mt-4 text-xs text-slate-500">HTTP {data?.live?.http_status ?? "—"} · {data?.live?.platform || "platform onbekend"} · marker {data?.live?.marker || "niet gevonden"}</p></article>
        <article className="rounded-2xl border border-slate-200 p-5"><div className="flex items-center justify-between gap-3"><div><span className="text-xs font-semibold uppercase tracking-[.14em] text-slate-400">Staging</span><h3 className="mt-1 font-semibold">AWS Lambda staging</h3></div>{data ? <StatusPill ok={Boolean(data.staging?.ok)} label={data.staging?.ok ? "Release gereed" : "Marker ontbreekt"}/> : null}</div><p className="mt-4 text-xs text-slate-500">HTTP {data?.staging?.http_status ?? "—"} · {data?.staging?.platform || "platform onbekend"} · marker {data?.staging?.marker || "niet gevonden"}</p></article>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <article className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-400">Klantmail</span><strong className="mt-1 block">{data?.billing?.delivery_enabled ? "Actief" : "Uitgeschakeld"}</strong></article>
        <article className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-400">Reminders</span><strong className="mt-1 block">{data?.billing?.reminders_enabled ? "Actief" : "Uitgeschakeld"}</strong></article>
        <article className="rounded-xl bg-slate-50 p-4"><span className="text-xs text-slate-400">Mollie</span><strong className="mt-1 block">{data?.mollie?.enabled ? `${data.mollie.mode} actief` : data?.mollie?.credentials_configured ? `${data.mollie.mode} geconfigureerd` : "Niet geconfigureerd"}</strong></article>
      </div>

      <div className={`mt-5 rounded-2xl border p-5 ${ready ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
        <div className="flex gap-3">{ready ? <ShieldCheck className="mt-0.5 text-emerald-700"/> : <CircleOff className="mt-0.5 text-amber-700"/>}<div><h3 className={`font-semibold ${ready ? "text-emerald-900" : "text-amber-900"}`}>{ready ? "Productiehost is klaar voor commerce-activatie" : "Nog niet activeren"}</h3><p className={`mt-1 text-sm ${ready ? "text-emerald-800" : "text-amber-800"}`}>{ready ? "De AWS staging- en live release-marker zijn gevalideerd. Billing-mail en reminders kunnen veilig aan." : "Eerst moet staging de juiste AWS-release bewijzen en daarna moet CloudFront vedantix.nl naar dezelfde serverless runtime sturen. Tot die tijd blijft commerce geblokkeerd."}</p></div></div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {!active ? <button type="button" disabled={!ready || working} onClick={activate} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"><Rocket size={16}/> Productie activeren</button> : <button type="button" disabled={working} onClick={deactivate} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-700 disabled:opacity-40"><CircleOff size={16}/> Billing tijdelijk uitschakelen</button>}
        <span className="self-center text-xs text-slate-400">Mollie wordt nooit automatisch aangezet door deze actie.</span>
      </div>
    </section>
  </div>;
}
