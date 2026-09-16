import { useEffect, useState } from "react";
import { CreditCard, Loader2, ReceiptText, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type StartState = "starting" | "error";

export default function PaymentStart({ token }: { token: string }) {
  const [state, setState] = useState<StartState>("starting");
  const [message, setMessage] = useState("Veilige betaling voorbereiden…");

  async function start() {
    setState("starting");
    setMessage("Veilige betaling voorbereiden…");
    try {
      const { data, error } = await supabase.functions.invoke("mollie-payment", {
        body: { action: "create", token },
      });
      if (error || !data?.ok || !data?.checkout_url) {
        throw new Error(data?.error || error?.message || "De betaling kon niet worden gestart.");
      }
      setMessage("Je wordt doorgestuurd naar Mollie…");
      window.location.assign(String(data.checkout_url));
    } catch (error) {
      console.error("Payment start failed", error);
      setMessage(error instanceof Error ? error.message : "De betaling kon niet worden gestart.");
      setState("error");
    }
  }

  useEffect(() => { void start(); }, [token]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950 sm:py-20">
      <main className="mx-auto max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <a href="/" className="text-lg font-bold tracking-tight">Vedantix</a>
          <span className="ml-2 text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Veilig betalen</span>
        </div>
        <div className="px-6 py-12 text-center sm:px-10">
          <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${state === "error" ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-700"}`}>
            {state === "error" ? <ReceiptText size={32}/> : <CreditCard size={32}/>}          
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight">Factuur betalen</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">{message}</p>
          {state === "starting" ? <div className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><Loader2 className="animate-spin" size={17}/> Verbinden met Mollie</div> : null}
          {state === "error" ? <div className="mt-8 grid gap-3"><button type="button" onClick={() => void start()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"><RefreshCw size={16}/> Opnieuw proberen</button><a href={`/factuur/${encodeURIComponent(token)}`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700"><ReceiptText size={16}/> Terug naar factuur</a></div> : null}
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center text-xs text-slate-500">Het factuurnummer wordt als betalingsreferentie aan Mollie meegegeven.</div>
      </main>
    </div>
  );
}
