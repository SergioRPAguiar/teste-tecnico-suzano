import type { LoginResponse, NewProduct, Product } from "./contracts";
export const API_MODE = process.env.NEXT_PUBLIC_API_MODE ?? "mock";
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); }
}
async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { ...init, headers: { "Content-Type": "application/json", ...init?.headers } }); }
  catch { throw new ApiError(0, "Não foi possível conectar à API. Verifique o serviço e tente novamente."); }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message.join(" · ") : body?.message;
    throw new ApiError(response.status, message || "Não foi possível concluir a operação.");
  }
  return body as T;
}
export const api = {
  listProducts: () => call<Product[]>("/products"),
  createProduct: (input: NewProduct, token: string) => call<Product>("/products", {
    method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(input),
  }),
  login: (username: string, password: string) => call<LoginResponse>("/auth/login", {
    method: "POST", body: JSON.stringify({ username, password }),
  }),
};

let initialized: Promise<void> | undefined;
export function initializeApi(): Promise<void> {
  if (!initialized) initialized = (async () => {
    if (!["mock", "real"].includes(API_MODE)) throw new Error("NEXT_PUBLIC_API_MODE deve ser mock ou real.");
    if (API_MODE === "mock") {
      const { worker } = await import("../mocks/browser");
      await worker.start({ onUnhandledRequest: "bypass", quiet: true });
    }
  })();
  return initialized;
}
