"use client";
import { formatPrice, type Product } from "../lib/contracts";
export function ProductCard({ product, highlighted }: { product: Product; highlighted: boolean }) {
  return <article id={`product-${product.id}`} data-testid="product-card" className={`product-card${highlighted ? " product-card--new" : ""}`}>
    <div className="product-photo-wrap">
      {/* URLs arbitrárias do contrato: img evita exigir uma lista fixa de hosts no otimizador Next. */}
      <img src={product.imageUrl} alt={product.name} width={640} height={480} loading="lazy" className="product-photo"
        onError={(event) => { const image = event.currentTarget; if (!image.src.endsWith("/product-placeholder.svg")) image.src = "/product-placeholder.svg"; }} />
      <span className="category-badge">{product.category}</span>
      <span className="product-code" aria-label={`Código ${product.id}`}>#{String(product.id).padStart(3, "0")}</span>
    </div>
    <div className="product-content">
      {highlighted && <span className="new-product-badge">Novo cadastro</span>}
      <h3 className="product-name">{product.name}</h3>
      <p className="product-description">{product.description}</p>
      <div className="product-foot">
        <div className="min-w-0"><span className="price-caption">Preço unitário</span><p className="product-price">{formatPrice(product.price)}</p></div>
        <span className={`stock-pill${product.stockQuantity ? "" : " stock-pill--empty"}`}><span className="status-dot" aria-hidden="true" />
          {product.stockQuantity ? `${product.stockQuantity} em estoque` : "Sem estoque"}
        </span>
      </div>
    </div>
  </article>;
}
