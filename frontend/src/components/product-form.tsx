"use client";
import { useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { ApiError } from "../lib/api";
import { validateProduct, type ProductDraft } from "../lib/contracts";
import { formatPriceInput, priceDigitsToApi, readPriceDigits } from "../lib/price-input";
import { useCatalogStore } from "../store/catalog-store";
import { Icon, Modal } from "./ui";

export function ProductForm({ draft, onClose, onSuccess, onAuthRequired }: {
  draft?: ProductDraft; onClose: () => void; onSuccess: () => void; onAuthRequired: (draft: ProductDraft) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductDraft | "form", string>>>({});
  const [priceDigits, setPriceDigits] = useState(() => readPriceDigits(draft?.price ?? "") ?? "0");
  const [invalidPriceInput, setInvalidPriceInput] = useState(false);
  const priceRef = useRef<HTMLInputElement>(null);
  const createProduct = useCatalogStore((state) => state.createProduct);
  useLayoutEffect(() => {
    const input = priceRef.current;
    if (input && document.activeElement === input) input.setSelectionRange(input.value.length, input.value.length);
  }, [priceDigits]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form)) as ProductDraft;
    const parsed = validateProduct({ ...fields, price: priceDigitsToApi(priceDigits), stockQuantity: /^\d+$/.test(fields.stockQuantity.trim()) ? Number(fields.stockQuantity) : NaN });
    if (invalidPriceInput) parsed.errors.price = "Informe o preço usando apenas dígitos.";
    setErrors(parsed.errors);
    if (!parsed.data || Object.keys(parsed.errors).length) { (form.elements.namedItem(Object.keys(parsed.errors)[0]!) as HTMLElement | null)?.focus(); return; }
    setBusy(true);
    try { await createProduct(parsed.data); onSuccess(); }
    catch (error) {
      if (error instanceof ApiError && error.status === 401) { useCatalogStore.getState().logout(); onAuthRequired(fields); }
      else setErrors({ form: error instanceof Error ? error.message : "Não foi possível salvar o produto." });
    } finally { setBusy(false); }
  }
  const labels = { name: "Nome do produto", category: "Categoria", description: "Descrição", stockQuantity: "Estoque inicial", imageUrl: "URL da imagem" };
  function field(key: keyof typeof labels, placeholder?: string) {
    const shared = { id: `product-${key}`, name: key, className: "field", required: true, disabled: busy, "aria-invalid": !!errors[key], "aria-describedby": errors[key] ? `${key}-error` : undefined };
    const initial = draft?.[key] ?? (key === "imageUrl" ? `${window.location.origin}/images/papel.jpg` : "");
    return <div className={key !== "stockQuantity" ? "form-span" : ""}>
      <label className="label" htmlFor={shared.id}>{labels[key]} <span aria-hidden="true" className="text-emerald-700">*</span></label>
      {key === "description" ? <textarea {...shared} rows={3} defaultValue={initial} placeholder="Descreva as características do produto" />
        : <input {...shared} autoFocus={key === "name"} defaultValue={initial} type={key === "imageUrl" ? "url" : "text"} inputMode={key === "stockQuantity" ? "numeric" : undefined} placeholder={placeholder} />}
      {errors[key] && <p id={`${key}-error`} className="form-error">{errors[key]}</p>}
    </div>;
  }
  return <Modal title="Cadastrar produto" id="product-dialog-title" onClose={() => { if (!busy) onClose(); }}>
    <form onSubmit={submit} noValidate className="product-form">
      <p className="form-intro">Dê um lugar para um novo produto. Preencha os campos com <span aria-hidden="true">*</span> para adicioná-lo ao seu catálogo.</p>
      <div className="form-grid">
        {field("name", "Ex.: Papel A4")}
        {field("category", "Ex.: Papelaria")}
        <div>
          <label className="label" htmlFor="product-price">Preço (R$) <span aria-hidden="true" className="text-emerald-700">*</span></label>
          <div className="field-icon-wrap"><span className="currency-prefix" aria-hidden="true">R$</span>
          <input ref={priceRef} id="product-price" name="price" className="field field-with-icon tabular-nums" type="text" inputMode="numeric" required disabled={busy} value={formatPriceInput(priceDigits)} aria-invalid={!!errors.price} aria-describedby={`price-hint${errors.price ? " price-error" : ""}`}
            onFocus={(event) => event.currentTarget.setSelectionRange(event.currentTarget.value.length, event.currentTarget.value.length)}
            onClick={(event) => { const input = event.currentTarget; if (input.selectionStart === input.selectionEnd) input.setSelectionRange(input.value.length, input.value.length); }}
            onKeyDown={(event) => {
              if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return;
              if (!/^\d$/.test(event.key)) event.preventDefault();
              else if (event.currentTarget.selectionStart === event.currentTarget.selectionEnd) event.currentTarget.setSelectionRange(event.currentTarget.value.length, event.currentTarget.value.length);
            }}
            onChange={(event) => {
              const digits = readPriceDigits(event.target.value);
              setInvalidPriceInput(digits === null);
              if (digits === null) setErrors((current) => ({ ...current, price: "Informe o preço usando apenas dígitos." }));
              else { setPriceDigits(digits); setErrors((current) => ({ ...current, price: undefined })); }
            }} /></div>
          <p id="price-hint" className="form-hint">Só números. As duas últimas casas são os centavos.</p>
          {errors.price && <p id="price-error" className="form-error">{errors.price}</p>}
        </div>
        {field("stockQuantity", "Ex.: 10")}{field("description")}{field("imageUrl", "https://...")}
      </div>
      <p className="form-hint">Estoque zero é permitido. Imagens indisponíveis recebem uma ilustração de apoio.</p>
      {errors.form && <p role="alert" className="form-alert">{errors.form}</p>}
      <div className="form-actions">
        <button type="button" disabled={busy} onClick={onClose} className="btn-secondary">Cancelar</button>
        <button type="submit" disabled={busy} className="btn-primary"><Icon name="check" />{busy ? "Salvando…" : "Salvar produto"}</button>
      </div>
    </form>
  </Modal>;
}
