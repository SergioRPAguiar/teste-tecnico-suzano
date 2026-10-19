import { selectCatalog } from "./catalog";
import { toApiPrice, toCents, validateProduct, type Product } from "./contracts";

const item = (id: number, name: string, price: string): Product => ({ id, name, price,
  category: "Papéis", description: "Teste", stockQuantity: 1, imageUrl: "https://example.com/p.png" });
const options = { query: "", minPrice: "", maxPrice: "", sort: "name-asc" as const, page: 1, pageSize: 10 };

describe("Filtros → ordenação → paginação", () => {
  const products = [item(4, "Caneta", "5.00"), item(3, "Papel kraft", "10.00"), item(2, "Papel A4", "25.00"), item(1, "Papel reciclado", "20.00")];
  it("combina nome/preço e ordena toda a seleção antes de paginar", () => {
    const result = selectCatalog(products, { ...options, query: "PAPEL", minPrice: "10,00", maxPrice: "25", sort: "price-asc", pageSize: 1, page: 2 });
    expect(result.items.map((product) => product.id)).toEqual([1]);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(3);
  });
  it("usa limites inclusivos em centavos, sem erro de ponto flutuante", () => {
    const result = selectCatalog([item(1, "Papel", "0.10"), item(2, "Papel", "0.11")], { ...options, minPrice: "0,10", maxPrice: "0.10" });
    expect(result.items.map((product) => product.id)).toEqual([1]);
  });
  it("desempata por ID mesmo ao ordenar preço decrescente", () => {
    expect(selectCatalog([item(3, "B", "1.00"), item(1, "A", "1.00")], { ...options, sort: "price-desc" }).items.map((p) => p.id)).toEqual([1, 3]);
  });
  it("rejeita intervalo invertido sem produzir página inválida", () => {
    const result = selectCatalog(products, { ...options, minPrice: "30", maxPrice: "10", page: 99 });
    expect(result.error).toBeTruthy(); expect(result.items).toEqual([]); expect(result.page).toBe(1);
  });
  it("limita página quando o conjunto diminui", () => {
    const result = selectCatalog(products, { ...options, query: "Caneta", page: 5, pageSize: 1 });
    expect(result.page).toBe(1); expect(result.items[0]?.id).toBe(4);
  });
});

describe("Entrada monetária e compatibilidade do cadastro", () => {
  it.each([["19,90", "19.90"], ["0,10", "0.10"], ["19", "19.00"], ["9999999999.99", "9999999999.99"]])("normaliza %s sem arredondar", (input, output) => expect(toApiPrice(input!)).toBe(output));
  it.each(["0", "-1", "1e2", "19.999", "10000000000.00"])("rejeita preço fora do contrato: %s", (input) => expect(toApiPrice(input)).toBeNull());
  it("mantém centavos inteiros exatos", () => { expect(toCents("0.29")).toBe(29); });
  it("não aceita preço numérico nem estoque fracionário no contrato HTTP", () => {
    const base = { name: "Papel", category: "Papéis", description: "Teste", imageUrl: "https://example.com/a.png", stockQuantity: 0, price: "1.00" };
    expect(validateProduct({ ...base, price: 1 }).errors.price).toBeTruthy();
    expect(validateProduct({ ...base, stockQuantity: 1.5 }).errors.stockQuantity).toBeTruthy();
    expect(validateProduct(base).data).toBeDefined();
  });
});
