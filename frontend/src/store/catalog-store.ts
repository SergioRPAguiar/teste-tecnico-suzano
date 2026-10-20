import { create } from "zustand";
import { api } from "../lib/api";
import { selectCatalog } from "../lib/catalog";
import type { NewProduct, PageSize, Product, SortOrder } from "../lib/contracts";

type State = {
  products: Product[]; status: "idle" | "loading" | "ready" | "error"; error: string | null;
  query: string; minPrice: string; maxPrice: string; sort: SortOrder; page: number; pageSize: PageSize;
  token: string | null; username: string | null; highlightedId: number | null; highlightedAction: "created" | "updated" | null;
  load: () => Promise<void>;
  setFilter: (key: "query" | "minPrice" | "maxPrice", value: string) => void;
  setSort: (sort: SortOrder) => void; setPage: (page: number) => void; setPageSize: (size: PageSize) => void;
  clearFilters: () => void; login: (username: string, password: string) => Promise<void>; logout: () => void;
  createProduct: (input: NewProduct) => Promise<Product>;
  updateProduct: (id: number, input: Partial<NewProduct>) => Promise<Product>;
};
let generation = 0;
export const useCatalogStore = create<State>((set, get) => ({
  products: [], status: "idle", error: null, query: "", minPrice: "", maxPrice: "", sort: "name-asc",
  page: 1, pageSize: 10, token: null, username: null, highlightedId: null, highlightedAction: null,
  async load() {
    const current = ++generation;
    set({ status: "loading", error: null });
    try { const products = await api.listProducts(); if (current === generation) set({ products, status: "ready" }); }
    catch (error) { if (current === generation) set({ status: "error", error: error instanceof Error ? error.message : "Falha ao carregar produtos." }); }
  },
  setFilter: (key, value) => set({ [key]: value, page: 1 }),
  setSort: (sort) => set({ sort, page: 1 }),
  setPage: (page) => set({ page }),
  setPageSize: (pageSize) => set({ pageSize, page: 1 }),
  clearFilters: () => set({ query: "", minPrice: "", maxPrice: "", page: 1 }),
  async login(username, password) { const response = await api.login(username, password); set({ token: response.accessToken, username: response.user.username }); },
  logout: () => set({ token: null, username: null }),
  async createProduct(input) {
    const product = await api.createProduct(input, get().token ?? "");
    ++generation;
    const current = get();
    const products = [...current.products.filter((item) => item.id !== product.id), product];
    const clean = { ...current, query: "", minPrice: "", maxPrice: "", page: 1 };
    const { sorted } = selectCatalog(products, clean);
    const page = Math.floor(sorted.findIndex((item) => item.id === product.id) / current.pageSize) + 1;
    set({ products, query: "", minPrice: "", maxPrice: "", page, highlightedId: product.id, highlightedAction: "created", status: "ready", error: null });
    return product;
  },
  async updateProduct(id, input) {
    const product = await api.updateProduct(id, input, get().token ?? "");
    ++generation;
    const current = get();
    const products = current.products.map((item) => item.id === product.id ? product : item);
    const clean = { ...current, query: "", minPrice: "", maxPrice: "", page: 1 };
    const { sorted } = selectCatalog(products, clean);
    const page = Math.floor(sorted.findIndex((item) => item.id === product.id) / current.pageSize) + 1;
    set({ products, query: "", minPrice: "", maxPrice: "", page, highlightedId: product.id, highlightedAction: "updated", status: "ready", error: null });
    return product;
  },
}));
