"use client";
import { useState, type FormEvent } from "react";
import { API_MODE } from "../lib/api";
import { useCatalogStore } from "../store/catalog-store";
import { Modal } from "./ui";

export function LoginForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const login = useCatalogStore((state) => state.login);
  async function authenticate(username: string, password: string) {
    if (!username.trim() || !password) { setError("Informe usuário e senha."); return; }
    setBusy(true); setError("");
    try { await login(username.trim(), password); onSuccess(); }
    catch (error) { setError(error instanceof Error ? error.message : "Falha ao entrar."); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); void authenticate(String(data.get("username")), String(data.get("password"))); }
  return <Modal title="Acesso administrativo" id="login-dialog-title" onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} noValidate className="space-y-4 p-6">
      <p className="text-sm leading-6 text-slate-600">A consulta é pública. Entre para cadastrar ou editar produtos.</p>
      <div><label className="label" htmlFor="username">Usuário</label><input autoComplete="username" className="field" id="username" name="username" defaultValue="admin" disabled={busy} /></div>
      <div><label className="label" htmlFor="password">Senha</label><input autoComplete="current-password" type="password" className="field" id="password" name="password" disabled={busy} /></div>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      <button className="btn-primary w-full" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</button>
      {API_MODE === "mock" ? <button type="button" className="btn-secondary w-full" disabled={busy} onClick={() => void authenticate("admin", "Suzano@123")}>Usar acesso de demonstração</button>
        : <p className="text-xs leading-5 text-slate-500">Use a conta configurada no backend. Credenciais de demonstração estão no README.</p>}
    </form>
  </Modal>;
}
