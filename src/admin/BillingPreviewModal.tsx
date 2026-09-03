import { Download, X } from "lucide-react";
import { useRef } from "react";

export default function BillingPreviewModal({ open, html, title, onClose }: { open: boolean; html: string; title: string; onClose: () => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div><strong className="text-sm text-slate-950">{title}</strong><span className="ml-2 text-xs text-slate-400">Documentpreview</span></div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => frameRef.current?.contentWindow?.print()} className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-3 py-2 text-xs font-semibold text-white"><Download size={14} /> Opslaan als PDF</button>
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><X size={16} /></button>
          </div>
        </div>
        <iframe ref={frameRef} title={title} srcDoc={html} className="min-h-0 flex-1 bg-slate-100" />
      </div>
    </div>
  );
}
