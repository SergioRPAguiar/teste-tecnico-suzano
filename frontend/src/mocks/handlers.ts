import { http, HttpResponse } from "msw";
import { API_URL } from "../lib/api";
import { toApiPrice, validateProduct, type Product } from "../lib/contracts";
import { demoProducts, upgradeDemoImages } from "./data";

const KEY = "suzano-case-products-v1";
function products(): Product[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (Array.isArray(saved) && saved.every((item) => typeof item.id === "number" && validateProduct({
      name: item.name, category: item.category, description: item.description, price: item.price,
      stockQuantity: item.stockQuantity, imageUrl: item.imageUrl,
    }).data)) {
      const upgraded = upgradeDemoImages(saved);
      if (upgraded.some((product, index) => product !== saved[index])) {
        try { localStorage.setItem(KEY, JSON.stringify(upgraded)); } catch { /* Preserva a sessão mesmo se o armazenamento estiver cheio. */ }
      }
      return upgraded;
    }
  } catch { /* Cache antigo/corrompido não impede a demonstração. */ }
  return demoProducts();
}
function failure(status: number, message: string) { return HttpResponse.json({ statusCode: status, message }, { status }); }
export const handlers = [
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    const input = await request.json() as { username?: string; password?: string };
    if (input.username !== "admin" || input.password !== "Suzano@123") return failure(401, "Usuário ou senha inválidos.");
    return HttpResponse.json({ accessToken: "mock-demo-token", tokenType: "Bearer", expiresIn: 3600, user: { username: "admin" } });
  }),
  http.get(`${API_URL}/products`, () => HttpResponse.json(products().sort((a, b) => a.id - b.id))),
  http.post(`${API_URL}/products`, async ({ request }) => {
    if (request.headers.get("authorization") !== "Bearer mock-demo-token") return failure(401, "Autenticação necessária.");
    const parsed = validateProduct(await request.json());
    if (!parsed.data) return failure(400, Object.values(parsed.errors).join(" "));
    const current = products();
    const product = { ...parsed.data, id: Math.max(0, ...current.map((item) => item.id)) + 1, price: toApiPrice(parsed.data.price)! };
    localStorage.setItem(KEY, JSON.stringify([...current, product]));
    return HttpResponse.json(product, { status: 201 });
  }),
];
