"use client";
import { useEffect, useMemo, useState } from "react";
import { API_MODE, initializeApi } from "../lib/api";
import { selectCatalog } from "../lib/catalog";
import type { PageSize, ProductDraft, SortOrder } from "../lib/contracts";
import { useCatalogStore } from "../store/catalog-store";
import { LoginForm } from "./login-form";
import { ProductCard } from "./product-card";
import { ProductForm } from "./product-form";
import { Icon } from "./ui";

export function Catalog() {
  const store = useCatalogStore();
  const [loginOpen, setLoginOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [resumeProduct, setResumeProduct] = useState(false);
  const [draft, setDraft] = useState<ProductDraft>();
  const [toast, setToast] = useState("");
  const [initializationError, setInitializationError] = useState("");
  const selected = useMemo(() => selectCatalog(store.products, store), [store.products, store.query, store.minPrice, store.maxPrice, store.sort, store.page, store.pageSize]);

  useEffect(() => {
    let active = true;
    initializeApi().then(() => { if (active) void useCatalogStore.getState().load(); })
      .catch((error) => { if (active) setInitializationError(error instanceof Error ? error.message : "Falha ao preparar a API."); });
    return () => { active = false; };
  }, []);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(""), 7000); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => {
    if (!store.highlightedId) return;
    document.getElementById(`product-${store.highlightedId}`)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
  }, [store.highlightedId, selected.page]);

  function newProduct() { setDraft(undefined); if (store.token) setProductOpen(true); else { setResumeProduct(true); setLoginOpen(true); } }
  function closeProduct() { setProductOpen(false); setDraft(undefined); }
  const loading = store.status === "idle" || store.status === "loading";
  const error = initializationError || store.error;
  const pageNumbers = Array.from({ length: selected.totalPages }, (_, i) => i + 1).filter((page) => page === 1 || page === selected.totalPages || Math.abs(page - selected.page) <= 1);

  return <>
    <a href="#catalog-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-white focus:p-4">Pular para o catálogo</a>
    <header className="site-header">
      <div className="catalog-shell header-inner">
        <div className="flex min-w-0 items-center">
          <a href="#catalog-content" className="brand" aria-label="Catálogo de produtos, início"><span className="brand-mark"><Icon name="leaf" className="h-6 w-6" /></span><span><span className="brand-name">Catálogo<span className="text-[#8aa16e]">.</span></span><span className="brand-caption">PRODUTOS & ROTINA</span></span></a>
          <a href="#product-results" className="header-product-tab"><Icon name="grid" className="h-3.5 w-3.5" />Produtos</a>
        </div>
        <div className="header-actions">
          <span className="mode-badge"><span className="status-dot" aria-hidden="true" />{API_MODE === "mock" ? "API simulada" : "API real"}</span>
          {store.username ? <span className="header-session"><span className="session-name">{store.username}</span><button className="btn-secondary header-login" onClick={() => { store.logout(); setToast("Sessão encerrada."); }}>Sair<Icon name="login" className="h-4 w-4" /></button></span>
            : <button className="btn-secondary header-login" onClick={() => { setResumeProduct(false); setLoginOpen(true); }}>Entrar<Icon name="login" className="h-4 w-4" /></button>}
        </div>
      </div>
    </header>

    <main id="catalog-content" className="catalog-shell">
      <section className="hero" aria-labelledby="catalog-heading">
        <div>
          <p className="eyebrow"><Icon name="leaf" className="h-4 w-4" />Organização que faz a diferença</p>
          <h1 id="catalog-heading" className="hero-title">Seu catálogo,<br /><span className="serif-accent">em boa ordem.</span></h1>
          <p className="hero-description">Cada produto no seu lugar. Encontre o que precisa e mantenha tudo organizado para o próximo passo.</p>
          <div className="hero-actions"><button className="btn-primary" onClick={newProduct} disabled={store.status !== "ready"}><Icon name="plus" className="h-4 w-4" />Novo produto</button><a href="#product-results" className="text-link">Explorar catálogo<Icon name="arrow" className="h-4 w-4" /></a></div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <span className="hero-visual-caption">Pequenos detalhes. Novas possibilidades.</span>
          <span className="hero-seal"><Icon name="leaf" className="h-7 w-7" /></span>
          <img src="/images/papel.jpg" alt="" width={640} height={480} className="hero-photo hero-photo-main" />
          <img src="/images/caderno.jpg" alt="" width={640} height={480} className="hero-photo hero-photo-secondary" />
        </div>
      </section>

      <section aria-label="Filtros de produtos" className="filter-panel">
        <h2 className="filter-heading"><Icon name="sliders" className="h-4 w-4" />Um jeito mais fácil de encontrar</h2>
        <div className="filter-fields">
          <div className="filter-search"><label className="label" htmlFor="search">Buscar por nome</label><div className="field-icon-wrap"><span className="field-leading-icon"><Icon name="search" className="h-4 w-4" /></span><input id="search" type="search" className="field field-with-icon" placeholder="O que você está procurando?" value={store.query} onChange={(event) => store.setFilter("query", event.target.value)} /></div></div>
          <div><label className="label" htmlFor="min-price">Preço mínimo (R$)</label><input id="min-price" inputMode="decimal" className="field" placeholder="0,00" value={store.minPrice} onChange={(event) => store.setFilter("minPrice", event.target.value)} /></div>
          <div><label className="label" htmlFor="max-price">Preço máximo (R$)</label><input id="max-price" inputMode="decimal" className="field" placeholder="Sem limite" value={store.maxPrice} onChange={(event) => store.setFilter("maxPrice", event.target.value)} /></div>
          <button className="btn-secondary filter-reset" onClick={store.clearFilters} disabled={!store.query && !store.minPrice && !store.maxPrice}><Icon name="close" className="h-3.5 w-3.5" />Limpar filtros</button>
        </div>
        {selected.error && <p role="alert" className="form-error mt-3">{selected.error}</p>}
      </section>

      <section id="product-results" aria-labelledby="results-heading" className="scroll-mt-28">
      <div className="results-toolbar">
        <div><h2 id="results-heading" className="results-title">Explore os produtos</h2><p aria-live="polite" className="results-count">{loading && !error ? "Preparando seu catálogo…" : <><strong>{selected.total}</strong> {selected.total === 1 ? "produto encontrado" : "produtos encontrados"}</>}</p></div>
        <div className="sort-control"><label htmlFor="sort">Ordenar por</label><select id="sort" className="field" value={store.sort} onChange={(event) => store.setSort(event.target.value as SortOrder)}>
          <option value="name-asc">Nome: A–Z</option><option value="name-desc">Nome: Z–A</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option>
        </select></div>
      </div>

      {error ? <section role="alert" className="state-panel"><span className="state-icon"><Icon name="alert" className="h-7 w-7" /></span><h2>Não foi possível carregar o catálogo</h2><p>{error}</p><button className="btn-secondary" onClick={() => { if (initializationError) window.location.reload(); else void store.load(); }}>Tentar novamente<Icon name="arrow" className="h-4 w-4" /></button></section>
        : loading ? <div aria-label="Carregando produtos" className="product-grid">{Array.from({ length: 8 }, (_, i) => <div key={i} className="product-skeleton animate-pulse"><div className="skeleton-photo" /><div className="p-5"><div className="skeleton-line w-3/4" /><div className="skeleton-line" /><div className="skeleton-line w-1/2" /></div></div>)}</div>
        : selected.items.length ? <section aria-label="Lista de produtos" className="product-grid">{selected.items.map((product) => <ProductCard key={product.id} product={product} highlighted={product.id === store.highlightedId} />)}</section>
        : <section className="state-panel"><span className="state-icon"><Icon name="search" className="h-7 w-7" /></span><h2>Nenhum produto encontrado</h2><p>{store.products.length ? "Ainda não encontramos essa combinação. Experimente outro nome ou ajuste a faixa de preço." : "Seu catálogo está pronto para começar. Adicione o primeiro produto e dê espaço a novas possibilidades."}</p><button className="btn-secondary" onClick={store.products.length ? store.clearFilters : newProduct}>{store.products.length ? "Limpar busca" : "Cadastrar primeiro produto"}<Icon name="arrow" className="h-4 w-4" /></button></section>}

      {!loading && !error && <footer className="pagination-panel">
        <div className="page-size-control"><label htmlFor="page-size">Produtos por página</label><select id="page-size" className="field" value={store.pageSize} onChange={(event) => store.setPageSize(Number(event.target.value) as PageSize)}>{[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select></div>
        <nav aria-label="Paginação de produtos" className="pagination-nav">
          <button className="page-button" aria-label="Página anterior" disabled={selected.page === 1} onClick={() => store.setPage(selected.page - 1)}><Icon name="left" className="h-4 w-4" /></button>
          {pageNumbers.map((page, index) => <span key={page} className="inline-flex items-center gap-2">{index > 0 && page - pageNumbers[index - 1]! > 1 && <span className="text-[#75826d]">…</span>}<button aria-label={`Página ${page}`} aria-current={page === selected.page ? "page" : undefined} className="page-button" onClick={() => store.setPage(page)}>{page}</button></span>)}
          <button className="page-button" aria-label="Próxima página" disabled={selected.page === selected.totalPages} onClick={() => store.setPage(selected.page + 1)}><Icon name="right" className="h-4 w-4" /></button>
        </nav>
      </footer>}
      </section>
      <footer className="site-footer"><span className="footer-signature"><Icon name="leaf" className="h-4 w-4" />Organizar abre possibilidades.</span><span>Produtos & pedidos <span aria-hidden="true" className="mx-2">/</span> Case técnico Suzano</span></footer>
    </main>

    {toast && <div role="status" className="toast"><Icon name="check" className="h-5 w-5 shrink-0" /><p>{toast}</p><button className="icon-button ml-auto" aria-label="Fechar mensagem" onClick={() => setToast("")}><Icon name="close" className="h-4 w-4" /></button></div>}
    {loginOpen && <LoginForm onClose={() => { setLoginOpen(false); setResumeProduct(false); setDraft(undefined); }} onSuccess={() => { setLoginOpen(false); if (resumeProduct) { setProductOpen(true); setResumeProduct(false); } }} />}
    {productOpen && <ProductForm draft={draft} onClose={closeProduct} onSuccess={() => { setToast("Produto cadastrado com sucesso. Filtros limpos para mostrar o novo item."); closeProduct(); }} onAuthRequired={(values) => { setDraft(values); setProductOpen(false); setResumeProduct(true); setLoginOpen(true); }} />}
  </>;
}
