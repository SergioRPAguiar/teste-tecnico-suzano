"use client";
import { useEffect, useRef, type ReactNode } from "react";

const paths = {
  search: "m21 21-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  plus: "M12 5v14M5 12h14",
  edit: "m16 4 4 4M4 16 16 4a2.8 2.8 0 0 1 4 4L8 20H4v-4Z",
  left: "m15 18-6-6 6-6", right: "m9 18 6-6-6-6",
  close: "m6 6 12 12M6 18 18 6", check: "m5 12 4 4L19 6",
  box: "m3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10M7 5l10 4",
  login: "M14 3h6v18h-6M3 12h12m-4-4 4 4-4 4",
  alert: "M12 8v5m0 4h.01M10 3 2 19h20L14 3h-4Z",
};
export function Icon({ name, className = "h-5 w-5" }: { name: keyof typeof paths; className?: string }) {
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}
export function Modal({ title, id, onClose, children }: { title: string; id: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; if (dialog && !dialog.open) dialog.showModal(); return () => { if (dialog?.open) dialog.close(); }; }, []);
  return <dialog ref={ref} aria-labelledby={id} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border-0 bg-white p-0 text-slate-950 shadow-2xl"
    onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
      <h2 id={id} className="text-xl font-bold">{title}</h2>
      <button type="button" aria-label="Fechar janela" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-600"><Icon name="close" /></button>
    </div>
    {children}
  </dialog>;
}
