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
