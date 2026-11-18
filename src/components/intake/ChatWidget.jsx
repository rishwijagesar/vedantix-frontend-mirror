import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import "../../styles/vx-intake.css";

const ScanIntake = lazy(() => import("./ScanIntake"));

/** Chatknop rechtsonder; opent de intake voor de gratis bedrijfsscan in een popup. Opent nooit vanzelf. */
export default function ChatWidget({ pathname = "/" }) {
  const [open, setOpen] = useState(false);
  const fabRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => { if (event.key === "Escape") close(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) panelRef.current?.querySelector("button, [href], input")?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    fabRef.current?.focus();
  }

  return (
    <div className="vx-chatw">
      {open ? (
        <div ref={panelRef} className="vx-chatw__panel" role="dialog" aria-modal="false" aria-labelledby="vx-chatw-title">
          <Suspense fallback={<div className="vx-intake vx-intake--loading" aria-busy="true" />}>
            <ScanIntake sourcePath={`${pathname} (chat)`} onClose={close} titleId="vx-chatw-title" />
          </Suspense>
        </div>
      ) : null}
      <button
        ref={fabRef}
        type="button"
        className="vx-chatw__fab"
        aria-label={open ? "Chat sluiten" : "Open de chat voor een gratis bedrijfsscan"}
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
      >
        {open ? <X aria-hidden="true" /> : <MessageCircle aria-hidden="true" />}
      </button>
    </div>
  );
}
