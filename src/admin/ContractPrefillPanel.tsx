import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, WandSparkles } from "lucide-react";
import { listContractSources, getContractSource } from "./contract-prefill-data";
import { applyContractSuggestion, buildContractSuggestion, contractFieldLabels, currentContractValue, type ContractSource, type ContractSourceOption } from "./contract-prefill";
import type { ContractRecord } from "./contracts-data";

const sourceLabel = (source: ContractSourceOption) => source.kind === "catalog" ? "Catalogus" : source.kind === "quote" ? "Offerte" : "Factuur";
const sourceKey = (source: ContractSourceOption) => `${source.kind}:${source.id}`;

export default function ContractPrefillPanel({ draft, customerName, disabled, onApply }: {
  draft: ContractRecord;
  customerName: string;
  disabled: boolean;
  onApply: (draft: ContractRecord) => void;
}) {
  const [options, setOptions] = useState<ContractSourceOption[]>([]);
  const [selected, setSelected] = useState("");
  const [source, setSource] = useState<ContractSource | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSource, setLoadingSource] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reload, setReload] = useState(0);
  const [checked, setChecked] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setSource(null); setOptions([]); setSelected(""); setMessage("");
    listContractSources(draft.customer_id).then(rows => {
      if (!active) return;
      setOptions(rows);
      const linked = rows.find(row => row.kind === "quote" && row.id === draft.source_quote_id);
      const documents = rows.filter(row => row.kind !== "catalog");
      setSelected(linked ? sourceKey(linked) : documents.length === 1 ? sourceKey(documents[0]!) : "");
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Documenten laden mislukt."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [draft.customer_id, draft.source_quote_id, reload]);

  useEffect(() => {
    let active = true;
    setSource(null); setMessage(""); setChecked([]);
    const option = options.find(row => sourceKey(row) === selected);
    if (!option) { setLoadingSource(false); return; }
    setLoadingSource(true); setError("");
    getContractSource(option, draft.customer_id, customerName).then(value => { if (active) setSource(value); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : "Voorstel maken mislukt."); })
      .finally(() => { if (active) setLoadingSource(false); });
    return () => { active = false; };
  }, [selected, options, draft.customer_id, customerName]);

  const result = useMemo(() => {
    if (!source) return { suggestion: null, error: "" };
    try { return { suggestion: buildContractSuggestion(source, draft.customer_id), error: "" }; }
    catch (e) { return { suggestion: null, error: e instanceof Error ? e.message : "Voorstel maken mislukt." }; }
  }, [source, draft.customer_id]);
  const suggestion = result.suggestion;
  const schema = draft.template_snapshot?.["variables_schema"] || {};
  const fieldKeys = Object.keys(suggestion?.fields || {}).filter(key =>
    (key === "project_name" || Object.hasOwn(schema, key)) && suggestion?.fields[key]?.trim());
  // Re-check which fields are empty after every manual edit, so a stale preview never overwrites new input.
  useEffect(() => {
    setChecked(fieldKeys.filter(key => !currentContractValue(draft, key).trim()));
  }, [suggestion, draft.project_name, draft.variables]);

  function apply() {
    if (!suggestion) return;
    try {
      onApply(applyContractSuggestion(draft, suggestion, checked));
      setMessage(`Voorstel uit ${sourceLabel(suggestion.source).toLowerCase()} ${suggestion.source.number} ingevuld. Controleer de inhoud en klik op Opslaan om deze ook in de PDF te gebruiken.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Invullen mislukt."); }
  }

  if (draft.status !== "DRAFT") return null;
  return <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 font-semibold"><WandSparkles size={18}/> Automatisch invullen</h3>
      <button type="button" disabled={disabled || loading || loadingSource} onClick={() => setReload(value => value + 1)} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"><RefreshCw size={14}/> Bronnen vernieuwen</button>
    </div>
    <p className="mt-2 text-sm text-slate-600">Neem afspraken over uit een geaccepteerde offerte of definitieve factuur van deze klant, of begin met een cataloguspakket. Controleer het voorstel voordat je het opslaat.</p>
    {error || result.error ? <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error || result.error}</p> : null}
    {loading ? <p role="status" className="mt-4 flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin"/> Documenten laden…</p> : options.length ? <fieldset disabled={disabled} className="mt-4 space-y-4">
      <label className="block text-sm font-medium">Offerte, factuur of cataloguspakket
        <select value={selected} onChange={event => { setSource(null); setSelected(event.target.value); }} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5">
          <option value="">Kies een bron voor het voorstel</option>
          {["quote", "invoice", "catalog"].map(kind => <optgroup key={kind} label={kind === "quote" ? "Geaccepteerde offertes" : kind === "invoice" ? "Definitieve facturen" : "Catalogus — prijsvoorstel"}>{options.filter(option => option.kind === kind).map(option => <option key={sourceKey(option)} value={sourceKey(option)}>{sourceLabel(option)} {option.number} — {option.title}</option>)}</optgroup>)}
        </select>
      </label>
      {!options.some(option => option.kind !== "catalog") ? <p className="text-xs text-slate-600">Er is nog geen geaccepteerde offerte of definitieve factuur voor deze klant. Kies een cataloguspakket om met een voorstel te beginnen.</p> : null}
      {loadingSource ? <p role="status" className="flex items-center gap-2 text-sm"><Loader2 size={16} className="animate-spin"/> Voorstel maken…</p> : null}
      {suggestion ? <>
        <p className="text-xs text-slate-600">Lege velden zijn aangevinkt. Vink een gevuld veld alleen aan als je de huidige inhoud wilt vervangen.</p>
        <div className="space-y-3">{fieldKeys.map(key => <label key={key} className="block rounded-xl border border-slate-200 bg-white p-3">
          <span className="flex items-start gap-3"><input type="checkbox" checked={checked.includes(key)} onChange={event => setChecked(keys => event.target.checked ? [...keys, key] : keys.filter(value => value !== key))} className="mt-1 h-4 w-4 shrink-0"/><span className="min-w-0 flex-1"><strong className="text-sm">{contractFieldLabels[key] || key}</strong>{currentContractValue(draft, key).trim() ? <span className="ml-2 text-xs font-medium text-amber-700">Vervangt huidige inhoud</span> : null}<span className="mt-2 block max-h-48 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">{suggestion.fields[key]}</span></span></span>
        </label>)}</div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p className="font-semibold">Nog controleren</p><ul className="mt-1 list-disc space-y-1 pl-5">{suggestion.notes.map(note => <li key={note}>{note}</li>)}</ul></div>
        {source?.notes?.trim() ? <details className="rounded-xl border border-slate-200 bg-white p-3 text-sm"><summary className="cursor-pointer font-medium">Opmerkingen uit het document</summary><p className="mt-2 whitespace-pre-wrap break-words text-slate-600">{source.notes}</p><p className="mt-2 text-xs text-slate-500">Controleer of hier aanvullende afspraken staan en voeg die zo nodig zelf toe.</p></details> : null}
        <button type="button" disabled={disabled || !checked.length || loadingSource} onClick={apply} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"><WandSparkles size={16}/> Geselecteerde velden invullen</button>
      </> : null}
    </fieldset> : !error ? <p className="mt-4 text-sm text-slate-600">Er zijn nog geen geschikte offertes, facturen of actieve catalogusproducten beschikbaar. Vul de afspraken hieronder in, of voeg eerst een bron toe.</p> : null}
    {message ? <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p> : null}
  </section>;
}
