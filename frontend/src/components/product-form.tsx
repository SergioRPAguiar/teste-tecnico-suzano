"use client";
import { useState, type FormEvent } from "react";
import { ApiError } from "../lib/api";
import { toApiPrice, validateProduct, type ProductDraft } from "../lib/contracts";
import { useCatalogStore } from "../store/catalog-store";
import { Icon, Modal } from "./ui";

export function ProductForm({ draft, onClose, onSuccess, onAuthRequired }: {
  draft?: ProductDraft; onClose: () => void; onSuccess: () => void; onAuthRequired: (draft: ProductDraft) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductDraft | "form", string>>>({});
  const createProduct = useCatalogStore((state) => state.createProduct);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form)) as ProductDraft;
    const parsed = validateProduct({ ...fields, price: toApiPrice(fields.price) ?? "", stockQuantity: /^\d+$/.test(fields.stockQuantity.trim()) ? Number(fields.stockQuantity) : NaN });
    setErrors(parsed.errors);
    if (!parsed.data) { (form.elements.namedItem(Object.keys(parsed.errors)[0]!) as HTMLElement | null)?.focus(); return; }
    setBusy(true);
    try { await createProduct(parsed.data); onSuccess(); }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) { useCatalogStore.getState().logout(); onAuthRequired(fields); }
      else setErrors({ form: error instanceof Error ? error.message : "Não foi possível cadastrar." });
    } finally { setBusy(false); }
  }
  const labels: Record<keyof ProductDraft, string> = { name: "Nome do produto", category: "Categoria", description: "Descrição", price: "Preço (R$)", stockQuantity: "Estoque inicial", imageUrl: "URL da imagem" };
  function field(key: keyof ProductDraft, placeholder?: string) {
    const shared = { id: `product-${key}`, name: key, className: "field", required: true, disabled: busy, "aria-invalid": !!errors[key], "aria-describedby": errors[key] ? `${key}-error` : undefined };
    const initial = draft?.[key] ?? (key === "imageUrl" ? `${window.location.origin}/product-placeholder.svg` : "");
    return <div className={key === "description" || key === "imageUrl" || key === "name" || key === "category" ? "sm:col-span-2" : ""}>
      <label className="label" htmlFor={shared.id}>{labels[key]} <span aria-hidden="true" className="text-emerald-700">*</span></label>
      {key === "description" ? <textarea {...shared} rows={3} defaultValue={initial} placeholder="Descreva as características do produto" />
        : <input {...shared} defaultValue={initial} type={key === "imageUrl" ? "url" : "text"} inputMode={key === "price" ? "decimal" : key === "stockQuantity" ? "numeric" : undefined} placeholder={placeholder} />}
      {errors[key] && <p id={`${key}-error`} className="mt-1 text-sm text-red-700">{errors[key]}</p>}
    </div>;
  }
  return <Modal title="Cadastrar produto" id="product-dialog-title" onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} noValidate className="p-6">
      <p className="mb-6 text-sm leading-6 text-slate-600">Preencha os dados do produto. Os campos com * são obrigatórios.</p>
      <div className="grid gap-4 sm:grid-cols-2">{field("name", "Ex.: Papel A4")}{field("category", "Ex.: Papelaria")}{field("price", "Ex.: 19,90")}{field("stockQuantity", "Ex.: 10")}{field("description")}{field("imageUrl", "https://...")}</div>
      <p className="mt-3 text-xs leading-5 text-slate-500">Preço com até duas casas decimais. Estoque zero é permitido. Imagens indisponíveis usam uma ilustração de apoio.</p>
      {errors.form && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{errors.form}</p>}
      <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
        <button type="button" disabled={busy} onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={busy} className="btn-primary"><Icon name="check" />{busy ? "Salvando…" : "Salvar produto"}</button>
      </div>
    </form>
  </Modal>;
}
