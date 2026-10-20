import { api } from "../lib/api";
import { selectCatalog } from "../lib/catalog";
import type { NewProduct, Product } from "../lib/contracts";
import { useCatalogStore } from "./catalog-store";

it("após cadastro limpa filtros, mantém ordem/tamanho e mostra o novo produto na página correta", async () => {
  const products: Product[] = Array.from({ length: 25 }, (_, index) => ({ id: index + 1, name: `Papel ${index}`,
    category: "Papéis", description: "Teste", price: `${index + 1}.00`, stockQuantity: 1, imageUrl: "https://example.com/a.png" }));
  const input: NewProduct = { name: "Novo", category: "Papéis", description: "Teste", price: "0.50", stockQuantity: 0, imageUrl: "https://example.com/a.png" };
  const spy = jest.spyOn(api, "createProduct").mockResolvedValue({ ...input, id: 26 });
  useCatalogStore.setState({ ...useCatalogStore.getInitialState(), products, status: "ready", query: "não existe", minPrice: "100", maxPrice: "200", sort: "price-desc", pageSize: 10, page: 8, token: "test" });
  try {
    await useCatalogStore.getState().createProduct(input);
    const state = useCatalogStore.getState();
    expect([state.query, state.minPrice, state.maxPrice]).toEqual(["", "", ""]);
    expect(state.sort).toBe("price-desc"); expect(state.pageSize).toBe(10); expect(state.page).toBe(3);
    expect(selectCatalog(state.products, state).items.some((item) => item.id === 26)).toBe(true);
    expect(state.highlightedId).toBe(26);
  } finally { spy.mockRestore(); useCatalogStore.setState(useCatalogStore.getInitialState()); }
});

it("após edição substitui o mesmo ID, mantém os demais itens e revela a nova posição", async () => {
  const products: Product[] = Array.from({ length: 25 }, (_, index) => ({ id: index + 1, name: `Papel ${index}`,
    category: "Papéis", description: "Teste", price: `${index + 1}.00`, stockQuantity: 1, imageUrl: "https://example.com/a.png" }));
  const updated = { ...products[0]!, price: "100.00", stockQuantity: 7 };
  const spy = jest.spyOn(api, "updateProduct").mockResolvedValue(updated);
  useCatalogStore.setState({ ...useCatalogStore.getInitialState(), products, status: "ready", query: "Papel", minPrice: "1", maxPrice: "10", sort: "price-asc", pageSize: 20, token: "test" });
  try {
    await useCatalogStore.getState().updateProduct(1, { price: "100.00", stockQuantity: 7 });
    const state = useCatalogStore.getState();
    expect(spy).toHaveBeenCalledWith(1, { price: "100.00", stockQuantity: 7 }, "test");
    expect(state.products).toHaveLength(25); expect(state.products[0]).toEqual(updated);
    expect(state.products.slice(1)).toEqual(products.slice(1));
    expect([state.query, state.minPrice, state.maxPrice]).toEqual(["", "", ""]);
    expect(state.sort).toBe("price-asc"); expect(state.pageSize).toBe(20); expect(state.page).toBe(2);
    expect(state.highlightedAction).toBe("updated");
    expect(selectCatalog(state.products, state).items.some((item) => item.id === 1)).toBe(true);
  } finally { spy.mockRestore(); useCatalogStore.setState(useCatalogStore.getInitialState()); }
});

it("uma edição rejeitada pela API não modifica produtos, filtros ou paginação", async () => {
  const spy = jest.spyOn(api, "updateProduct").mockRejectedValue(new Error("Falha ao salvar"));
  useCatalogStore.setState({ ...useCatalogStore.getInitialState(), status: "ready", query: "Papel", page: 2, token: "test" });
  const before = useCatalogStore.getState();
  try {
    await expect(before.updateProduct(1, { price: "100.00" })).rejects.toThrow("Falha ao salvar");
    expect(useCatalogStore.getState()).toBe(before);
  } finally { spy.mockRestore(); useCatalogStore.setState(useCatalogStore.getInitialState()); }
});
