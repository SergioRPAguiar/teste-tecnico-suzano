"use client";
import { formatPrice, type Product } from "../lib/contracts";
export function ProductCard({ product, highlighted }: { product: Product; highlighted: boolean }) {
  return <article id={`product-${product.id}`} data-testid="product-card" className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md ${highlighted ? "border-emerald-600 ring-2 ring-emerald-200" : "border-slate-200"}`}>
    <div className="relative aspect-[2/1] overflow-hidden bg-emerald-50">
      {/* URLs arbitrárias do contrato: img evita exigir uma lista fixa de hosts no otimizador Next. */}
      <img src={product.imageUrl} alt={product.name} width={640} height={320} loading="lazy" className="h-full w-full object-cover"
        onError={(event) => { const image = event.currentTarget; if (!image.src.endsWith("/product-placeholder.svg")) image.src = "/product-placeholder.svg"; }} />
      {highlighted && <span className="absolute left-3 top-3 rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">Novo cadastro</span>}
    </div>
    <div className="flex flex-1 flex-col p-5">
      <span className="mb-3 w-fit max-w-full rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold break-words text-emerald-800">{product.category}</span>
      <h2 className="text-lg font-bold leading-6 break-words">{product.name}</h2>
      <p className="mt-2 flex-1 text-sm leading-6 break-words text-slate-600">{product.description}</p>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-2xl font-bold tracking-tight text-slate-950">{formatPrice(product.price)}</p>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.stockQuantity ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>
          {product.stockQuantity ? `${product.stockQuantity} em estoque` : "Sem estoque"}
        </span>
      </div>
    </div>
  </article>;
}
