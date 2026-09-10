import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Home, ReceiptText, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type PaymentState = "checking" | "paid" | "failed" | "pending" | "error";

type PaymentStatusResponse = {
  ok?: boolean;
  invoice_number?: string;
  invoice_status?: string;
  payment_status?: string | null;
  outstanding?: string;
  error?: string;
};

const failedStatuses = new Set(["FAILED", "CANCELED", "EXPIRED"]);
const pendingStatuses = new Set(["CREATING", "OPEN", "PENDING", "AUTHORIZED"]);

export default function PaymentResult({ token }: { token: string }) {
  const [state, setState] = useState<PaymentState>("checking");
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [attempt, setAttempt] = useState(0);

  const check = useCallback(async () => {
    try {
      const { data: result, error } = await supabase.functions.invoke("mollie-payment", {
        body: { action: "status", token },
      });
      if (error || !result?.ok) throw new Error(result?.error || "Status kon niet worden gecontroleerd.");

      const next = result as PaymentStatusResponse;
      setData(next);

      if (next.invoice_status === "PAID" || Number(next.outstanding || "0") <= 0.009) {
        setState("paid");
        return "done" as const;
      }
      if (next.payment_status && failedStatuses.has(next.payment_status)) {
        setState("failed");
        return "done" as const;
      }
      if (!next.payment_status || pendingStatuses.has(next.payment_status)) {
        setState("pending");
        return "pending" as const;
      }

      setState("pending");
      return "pending" as const;
    } catch (error) {
      console.error("Payment result status check failed", error);
      setState("error");
      return "done" as const;
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll(index: number) {
      if (!active) return;
      setAttempt(index);
      const result = await check();
      if (!active || result === "done" || index >= 8) return;
      timer = setTimeout(() => void poll(index + 1), 1500);
    }

    void poll(0);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [check]);

  const invoiceUrl = `/factuur/${token}`;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 text-slate-950 sm:py-20">
      <main className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
          <a href="/" className="text-lg font-bold tracking-tight">Vedantix</a>
          <span className="ml-2 text-xs font-semibold uppercase tracking-[.16em] text-slate-400">Veilig betalen</span>
        </div>

        <div className="px-6 py-10 text-center sm:px-10 sm:py-12">
          {state === "paid" ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={34} />
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight">Betaling geslaagd</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                We hebben je betaling ontvangen. {data?.invoice_number ? <>Factuur <strong>{data.invoice_number}</strong> staat nu als betaald geregistreerd.</> : "De factuur staat nu als betaald geregistreerd."}
              </p>
              <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Je hoeft verder niets te doen.
              </div>
            </>
          ) : state === "failed" ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                <XCircle size={34} />
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight">Betaling niet gelukt</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                De betaling is geannuleerd, verlopen of niet geslaagd. Er is geen succesvolle betaling voor deze factuur geregistreerd.
              </p>
              <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
                Je kunt via de factuur opnieuw proberen te betalen.
              </div>
            </>
          ) : state === "error" ? (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <ReceiptText size={32} />
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight">Status niet beschikbaar</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                We konden de betaalstatus op dit moment niet controleren. Open de factuur om de actuele status te bekijken.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-700">
                <Clock3 className="animate-pulse" size={32} />
              </div>
              <h1 className="mt-6 text-3xl font-bold tracking-tight">Betaling controleren</h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
                We wachten op de definitieve bevestiging van Mollie. Dit duurt meestal maar enkele seconden.
              </p>
              <div className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-slate-500">
                <RefreshCw className="animate-spin" size={15} /> Controle {Math.min(attempt + 1, 9)} van 9
              </div>
            </>
          )}

          <div className="mt-9 grid gap-3 sm:grid-cols-2">
            <a href={invoiceUrl} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white">
              <ReceiptText size={17} /> Bekijk factuur
            </a>
            <a href="/" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700">
              <Home size={17} /> Naar Vedantix
            </a>
          </div>

          {(state === "pending" || state === "error") ? (
            <button type="button" onClick={() => { setState("checking"); void check(); }} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950">
              <RefreshCw size={15} /> Status opnieuw controleren
            </button>
          ) : null}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center text-xs text-slate-500">
          De betaalstatus wordt server-side gecontroleerd en kan niet via deze URL worden aangepast.
        </div>
      </main>
    </div>
  );
}
