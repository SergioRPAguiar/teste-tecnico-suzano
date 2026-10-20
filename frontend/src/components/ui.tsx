"use client";
import { useEffect, useRef, type ReactNode } from "react";

const paths = {
  search: "m21 21-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  plus: "M12 5v14M5 12h14",
  leaf: "M20 3c-7-1-14 2-14 8a6 6 0 0 0 6 6c6 0 9-7 8-14ZM4 21l11-11M9 15v-4m0 4h4",
  grid: "M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  sliders: "M4 7h9m4 0h3M4 17h3m4 0h9M13 4v6M7 14v6",
  lock: "M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4m-3 5v2",
  left: "m15 18-6-6 6-6", right: "m9 18 6-6-6-6",
  close: "m6 6 12 12M6 18 18 6", check: "m5 12 4 4L19 6",
  box: "m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10M7 5l10 4",
  login: "M14 3h6v18h-6M3 12h12m-4-4 4 4-4 4",
  alert: "M12 8v5m0 4h.01M10 3 2 19h20L14 3h-4Z",
};
export function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof paths; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
export function Modal({ title, id, onClose, children, compact = false }: { title: string; id: string; onClose: () => void; children: ReactNode; compact?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
      dialog.querySelector<HTMLElement>("input:not(:disabled), textarea:not(:disabled), select:not(:disabled)")?.focus();
    }
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
  return <dialog ref={ref} aria-labelledby={id} className={`catalog-modal${compact ? " catalog-modal--compact" : ""}`}
    onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal-header">
      <span className="modal-emblem"><Icon name={compact ? "lock" : "box"} /></span>
      <div className="modal-heading"><p className="modal-kicker">{compact ? "Área administrativa" : "Um novo espaço no catálogo"}</p><h2 id={id} className="modal-title">{title}</h2></div>
      <button type="button" aria-label="Fechar janela" onClick={onClose} className="icon-button"><Icon name="close" className="h-4 w-4" /></button>
    </div>
    {children}
  </dialog>;
}
