import { useEffect, useState } from "react";
import { ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PreviewPayload = {
  ok: boolean;
  website: {
    name: string;
    status: string;
    customer_name: string;
  };
  preview_url: string;
  expires_at: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nl-NL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function CustomerPreviewPageV2({ token }: { token: string }) {
  const [data, setData] = useState<PreviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: payload, error: invokeError } = await supabase.functions.invoke("customer-preview", { body: { token } });
        if (!active) return;
        if (invokeError || !payload?.ok) throw new Error(payload?.error || "Deze previewlink is niet beschikbaar.");
        setData(payload as PreviewPayload);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Deze previewlink is niet beschikbaar.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white"><div className="text-center"><Loader2 className="mx-auto animate-spin" size={28}/><p className="mt-3 text-sm text-slate-300">Preview controleren…</p></div></main>;
  }

  if (error || !data) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white"><section className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15 text-red-300"><ShieldCheck size={24}/></div><h1 className="mt-5 text-2xl font-bold">Preview niet beschikbaar</h1><p className="mt-3 text-sm leading-6 text-slate-300">{error || "Deze link is verlopen of ingetrokken."}</p><a href="https://vedantix.nl" className="mt-6 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950">Naar Vedantix</a></section></main>;
  }

  return <div className="flex min-h-screen flex-col bg-slate-100 text-slate-950">
    <header className="border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 font-black text-white">V</div><div><div className="flex items-center gap-2"><strong className="text-sm">Vedantix Preview</strong><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Beveiligde link</span></div><p className="text-xs text-slate-500">{data.website.customer_name} · {data.website.name}</p></div></div>
        <div className="flex flex-wrap items-center gap-2"><span className="hidden text-xs text-slate-400 sm:inline">Geldig tot {formatDate(data.expires_at)}</span><a href={data.preview_url} target="_blank" rel="noreferrer" referrerPolicy="no-referrer" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white"><ExternalLink size={15}/> Open in nieuw tabblad</a></div>
      </div>
    </header>

    <div className="relative flex-1">
      <iframe
        title={`Preview ${data.website.name}`}
        src={data.preview_url}
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full min-h-[calc(100vh-66px)] w-full border-0 bg-white"
      />
      <noscript><div className="p-8 text-center">JavaScript is nodig om de preview te tonen.</div></noscript>
    </div>
  </div>;
}
