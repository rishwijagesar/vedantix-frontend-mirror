import { Download, X } from "lucide-react";
import { useMemo, useRef } from "react";

function hideUnusedLineDiscountColumn(source: string) {
  return source.replace(/<table class="items">[\s\S]*?<\/table>/, (table) => {
    const hasActualLineDiscount = /<td class="num">−\s*[^<]+<\/td>/.test(table);
    if (hasActualLineDiscount) return table;

    return table
      .replace('<th class="num">Korting</th>', "")
      .replaceAll('<td class="num">—</td>', "")
      .replaceAll('colspan="7"', 'colspan="6"');
  });
}

function customerPricePresentation(source: string) {
  if (!source) return source;

  let html = source
    // The modal owns closing and printing; window.close() cannot close an iframe.
    .replace(/<div class="printbar">[\s\S]*?<\/div>/g, "")
    .replace(
      '<div class="sum-row"><span>Totaal excl. btw</span>',
      '<div class="sum-row agreed"><span>Afgesproken bedrag excl. btw</span>',
    )
    .replace(
      '<div class="sum-row total"><span>Totaal incl. btw</span>',
      '<div class="sum-row payable"><span>Factuurbedrag incl. btw</span>',
    );

  // In offertes zijn betaalmomenten ook primair excl. btw: dat is het bedrag
  // dat commercieel wordt afgesproken. Het incl.-btw bedrag blijft eronder
  // zichtbaar zodat de klant ook direct weet wat uiteindelijk wordt betaald.
  html = html.replace(
    /<div class="cost-card">\s*<span>(.*?)<\/span>\s*<strong>(.*?)<\/strong>\s*<small>(.*?) excl\. btw · (.*?) btw<\/small>\s*<\/div>/g,
    (_match, title: string, inclText: string, exText: string, vatText: string) => {
      const suffix = inclText.endsWith(" p/m") ? " p/m" : inclText.endsWith(" p/j") ? " p/j" : "";
      const inclAmount = suffix ? inclText.slice(0, -suffix.length) : inclText;
      return `<div class="cost-card"><span>${title}</span><strong>${exText}${suffix}</strong><small>excl. btw · ${vatText} btw · ${inclAmount}${suffix} incl. btw</small></div>`;
    },
  );

  // Toon de kortingskolom alleen als er op minstens één regel echt korting is
  // toegepast. Een algemene documentkorting blijft apart in de samenvatting.
  html = hideUnusedLineDiscountColumn(html);

  return html.replace(
    "</style>",
    `.sum-row.agreed{border-top:2px solid #0f172a;margin-top:7px;padding-top:11px;color:#0f172a;font-size:16px;font-weight:800}.sum-row.payable{border-top:1px solid #cbd5e1;margin-top:7px;padding-top:9px;color:#0f172a;font-size:13px;font-weight:700}</style>`,
  );
}

export default function BillingPreviewModal({ open, html, title, onClose }: { open: boolean; html: string; title: string; onClose: () => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const customerHtml = useMemo(() => customerPricePresentation(html), [html]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div><strong className="text-sm text-slate-950">{title}</strong><span className="ml-2 text-xs text-slate-400">Documentpreview</span></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => frameRef.current?.contentWindow?.print()} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white"><Download size={14} /> Opslaan als PDF</button>
            <button type="button" onClick={onClose} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"><X size={16} /> Sluiten</button>
          </div>
        </div>
        <iframe ref={frameRef} title={title} srcDoc={customerHtml} className="min-h-0 flex-1 bg-slate-100" />
      </div>
    </div>
  );
}
