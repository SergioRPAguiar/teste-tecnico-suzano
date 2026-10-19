export interface Product {
  id: number;
  name: string;
  category: string;
  description: string;
  price: string;
  stockQuantity: number;
  imageUrl: string;
}
export type NewProduct = Omit<Product, "id">;
export type ProductDraft = Record<keyof NewProduct, string>;
export type SortOrder = "name-asc" | "name-desc" | "price-asc" | "price-desc";
export type PageSize = 10 | 20 | 50 | 100;
export interface LoginResponse { accessToken: string; user: { username: string }; expiresIn: number; tokenType: string }

export const PRICE_PATTERN = /^(?!0(?:\.0{1,2})?$)(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

// Os limites DECIMAL(12,2) deixam os centavos bem abaixo de Number.MAX_SAFE_INTEGER.
export function toCents(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(normalized)) return null;
  const [integer, decimal = ""] = normalized.split(".");
  return Number(integer) * 100 + Number(decimal.padEnd(2, "0"));
}
export function toApiPrice(value: string): string | null {
  const cents = toCents(value);
  if (cents === null || cents <= 0) return null;
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`;
}
export function formatPrice(price: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(price));
}

export function validateProduct(value: unknown): { data?: NewProduct; errors: Partial<Record<keyof NewProduct | "form", string>> } {
  const errors: Partial<Record<keyof NewProduct | "form", string>> = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return { errors: { form: "Dados inválidos." } };
  const input = value as Record<string, unknown>;
  const fields = ["name", "category", "description", "price", "stockQuantity", "imageUrl"];
  if (Object.keys(input).some((key) => !fields.includes(key))) errors.form = "Existem campos não previstos no cadastro.";
  for (const key of ["name", "category", "description", "imageUrl"] as const) {
    if (typeof input[key] !== "string" || !input[key].trim()) errors[key] = "Preencha este campo.";
  }
  if (typeof input.price !== "string" || !PRICE_PATTERN.test(input.price)) errors.price = "Informe um preço positivo, com até duas casas decimais.";
  if (typeof input.stockQuantity !== "number" || !Number.isInteger(input.stockQuantity) || input.stockQuantity < 0 || input.stockQuantity > 2147483647) {
    errors.stockQuantity = "Use um inteiro entre 0 e 2147483647.";
  }
  try {
    const url = new URL(typeof input.imageUrl === "string" ? input.imageUrl.trim() : "");
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch { errors.imageUrl = "Informe uma URL completa HTTP ou HTTPS."; }
  if (Object.keys(errors).length) return { errors };
  return { errors, data: {
    name: (input.name as string).trim(), category: (input.category as string).trim(),
    description: (input.description as string).trim(), price: input.price as string,
    stockQuantity: input.stockQuantity as number, imageUrl: (input.imageUrl as string).trim(),
  } };
}
