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
  const [resumeCreate, setResumeCreate] = useState(false);
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

  function newProduct() { setDraft(undefined); if (store.token) setProductOpen(true); else { setResumeCreate(true); setLoginOpen(true); } }
  const loading = store.status === "idle" || store.status === "loading";
  const error = initializationError || store.error;
  const pageNumbers = Array.from({ length: selected.totalPages }, (_, i) => i + 1).filter((page) => page === 1 || page === selected.totalPages || Math.abs(page - selected.page) <= 1);

  return <>
    <a href="#catalog-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4">Pular para o catálogo</a>
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-700 p-2.5 text-white"><Icon name="box" /></span><span className="text-lg font-bold tracking-tight">Catálogo<span className="ml-2 font-normal text-slate-400">/</span><span className="ml-2 text-sm font-normal text-slate-600">Produtos</span></span></div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">{API_MODE === "mock" ? "API simulada" : "API real"}</span>
          {store.username ? <><span className="hidden text-sm text-slate-600 sm:inline">{store.username}</span><button className="text-sm font-semibold text-slate-700 underline-offset-4 hover:underline" onClick={() => { store.logout(); setToast("Sessão encerrada."); }}>Sair</button></>
            : <button className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-700" onClick={() => { setResumeCreate(false); setLoginOpen(true); }}><Icon name="login" />Entrar</button>}
        </div>
      </div>
    </header>

    <main id="catalog-content" className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
      <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Organização que faz a diferença</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Gerenciamento de produtos</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">Encontre o que precisa e mantenha seu catálogo sempre atualizado.</p></div>
        <button className="btn-primary shrink-0 self-start sm:self-auto" onClick={newProduct} disabled={store.status !== "ready"}><Icon name="plus" />Novo produto</button>
      </section>

      <section aria-label="Filtros de produtos" className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
          <div><label className="label" htmlFor="search">Buscar por nome</label><div className="relative"><span className="pointer-events-none absolute left-3 top-3 text-slate-400"><Icon name="search" /></span><input id="search" type="search" className="field pl-10" placeholder="Qual produto você procura?" value={store.query} onChange={(event) => store.setFilter("query", event.target.value)} /></div></div>
          <div><label className="label" htmlFor="min-price">Preço mínimo (R$)</label><input id="min-price" inputMode="decimal" className="field" placeholder="0,00" value={store.minPrice} onChange={(event) => store.setFilter("minPrice", event.target.value)} /></div>
          <div><label className="label" htmlFor="max-price">Preço máximo (R$)</label><input id="max-price" inputMode="decimal" className="field" placeholder="Sem limite" value={store.maxPrice} onChange={(event) => store.setFilter("maxPrice", event.target.value)} /></div>
          <button className="btn-secondary" onClick={store.clearFilters} disabled={!store.query && !store.minPrice && !store.maxPrice}>Limpar filtros</button>
        </div>
        {selected.error && <p role="alert" className="mt-3 text-sm text-red-700">{selected.error}</p>}
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <p aria-live="polite" className="text-sm text-slate-600">{loading && !error ? "Carregando catálogo…" : <><strong className="text-slate-950">{selected.total}</strong> {selected.total === 1 ? "produto encontrado" : "produtos encontrados"}</>}</p>
        <div className="flex items-center gap-3"><label htmlFor="sort" className="text-sm text-slate-600">Ordenar por</label><select id="sort" className="field w-auto py-2.5" value={store.sort} onChange={(event) => store.setSort(event.target.value as SortOrder)}>
          <option value="name-asc">Nome: A–Z</option><option value="name-desc">Nome: Z–A</option><option value="price-asc">Menor preço</option><option value="price-desc">Maior preço</option>
        </select></div>
      </div>

      {error ? <section role="alert" className="rounded-2xl border border-red-200 bg-white p-10 text-center"><Icon name="alert" className="mx-auto mb-3 h-8 w-8 text-red-600" /><h2 className="text-lg font-bold">Não foi possível carregar o catálogo</h2><p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">{error}</p><button className="btn-secondary mt-5" onClick={() => { if (initializationError) window.location.reload(); else void store.load(); }}>Tentar novamente</button></section>
        : loading ? <div aria-label="Carregando produtos" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-96 animate-pulse rounded-2xl bg-slate-200" />)}</div>
        : selected.items.length ? <section aria-label="Lista de produtos" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{selected.items.map((product) => <ProductCard key={product.id} product={product} highlighted={product.id === store.highlightedId} />)}</section>
        : <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><Icon name="search" className="mx-auto mb-3 h-9 w-9 text-slate-400" /><h2 className="text-xl font-bold">Nenhum produto encontrado</h2><p className="mt-2 text-sm text-slate-600">{store.products.length ? "Experimente outro nome ou ajuste a faixa de preço." : "Comece cadastrando o primeiro produto do catálogo."}</p><button className="btn-secondary mt-5" onClick={store.products.length ? store.clearFilters : newProduct}>{store.products.length ? "Limpar busca" : "Cadastrar primeiro produto"}</button></section>}

      {!loading && !error && <footer className="mt-8 flex flex-col items-center justify-between gap-5 border-t border-slate-200 pt-6 sm:flex-row">
        <div className="flex items-center gap-3"><label className="text-sm text-slate-600" htmlFor="page-size">Produtos por página</label><select id="page-size" className="field w-auto py-2" value={store.pageSize} onChange={(event) => store.setPageSize(Number(event.target.value) as PageSize)}>{[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}</select></div>
        <nav aria-label="Paginação de produtos" className="flex flex-wrap items-center justify-center gap-2">
          <button className="btn-secondary px-2 py-2" aria-label="Página anterior" disabled={selected.page === 1} onClick={() => store.setPage(selected.page - 1)}><Icon name="left" /></button>
          {pageNumbers.map((page, index) => <span key={page} className="inline-flex items-center gap-2">{index > 0 && page - pageNumbers[index - 1]! > 1 && <span className="text-slate-400">…</span>}<button aria-label={`Página ${page}`} aria-current={page === selected.page ? "page" : undefined} className={`h-10 min-w-10 rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-emerald-600 ${page === selected.page ? "bg-emerald-700 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"}`} onClick={() => store.setPage(page)}>{page}</button></span>)}
          <button className="btn-secondary px-2 py-2" aria-label="Próxima página" disabled={selected.page === selected.totalPages} onClick={() => store.setPage(selected.page + 1)}><Icon name="right" /></button>
        </nav>
      </footer>}
      <p className="mt-10 text-center text-xs text-slate-400">Catálogo de produtos · Teste técnico Suzano</p>
    </main>

    {toast && <div role="status" className="fixed bottom-5 left-4 right-4 z-50 mx-auto flex max-w-lg items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950 shadow-lg"><Icon name="check" className="h-5 w-5 shrink-0" /><p>{toast}</p><button className="ml-auto" aria-label="Fechar mensagem" onClick={() => setToast("")}><Icon name="close" /></button></div>}
    {loginOpen && <LoginForm onClose={() => { setLoginOpen(false); setResumeCreate(false); }} onSuccess={() => { setLoginOpen(false); if (resumeCreate) { setProductOpen(true); setResumeCreate(false); } }} />}
    {productOpen && <ProductForm draft={draft} onClose={() => setProductOpen(false)} onSuccess={() => { setProductOpen(false); setDraft(undefined); setToast("Produto cadastrado com sucesso. Filtros limpos para mostrar o novo item."); }} onAuthRequired={(values) => { setDraft(values); setProductOpen(false); setResumeCreate(true); setLoginOpen(true); }} />}
  </>;
}
