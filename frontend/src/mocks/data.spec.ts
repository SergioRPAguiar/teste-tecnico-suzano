import { demoProducts, upgradeDemoImages } from "./data";

const origin = "http://localhost:3000";
describe("Imagens locais dos produtos de demonstração", () => {
  it("associa os 48 itens a fotografias locais sem exigir um servidor externo", () => {
    const products = demoProducts(origin);
    expect(products).toHaveLength(48);
    expect(products.every((product) => product.imageUrl.startsWith(`${origin}/images/`))).toBe(true);
    expect(new Set(products.map((product) => product.imageUrl)).size).toBe(6);
  });
  it("atualiza imagem antiga sem perder preço/estoque, fotos próprias ou novos cadastros", () => {
    const [first, second] = demoProducts(origin);
    const old = { ...first!, price: "1.00", stockQuantity: 123, imageUrl: `${origin}/product-placeholder.svg` };
    const custom = { ...second!, imageUrl: "https://example.com/minha-foto.jpg" };
    const added = { ...first!, id: 49, name: "Cadastro próprio", imageUrl: `${origin}/product-placeholder.svg` };
    const result = upgradeDemoImages([old, custom, added], origin);
    expect(result[0]).toEqual({ ...old, imageUrl: first!.imageUrl });
    expect(result[1]).toBe(custom); expect(result[2]).toBe(added);
    expect(old.imageUrl).toBe(`${origin}/product-placeholder.svg`);
  });
  it("é idempotente para os itens que já usam fotos", () => {
    const current = demoProducts(origin);
    expect(upgradeDemoImages(current, origin)).toEqual(current);
    expect(upgradeDemoImages(current, origin)[0]).toBe(current[0]);
  });
});
