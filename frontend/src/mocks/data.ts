import type { Product } from "../lib/contracts";
export function demoProducts(): Product[] {
  const names = ["Papel A4", "Papel reciclado", "Papel kraft", "Cartolina", "Envelope kraft", "Caixa organizadora",
    "Sacola de papel", "Papel para presente", "Caderno", "Bloco de notas", "Pasta de documentos", "Etiquetas"];
  const prices = [2490, 1990, 1250, 890, 450, 3490, 690, 990, 2190, 1190, 1450, 790];
  return names.flatMap((name, index) => Array.from({ length: 4 }, (_, variant) => {
    const cents = prices[index]! + variant * 300;
    return { id: index * 4 + variant + 1, name: `${name} — pacote ${variant + 1}`,
      category: index < 4 ? "Papéis" : index < 8 ? "Embalagens" : "Escritório",
      description: `${name} para organizar sua rotina. Pacote ${variant + 1} da linha de demonstração.`,
      price: `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, "0")}`,
      stockQuantity: (index * 13 + variant * 17) % 81, imageUrl: `${window.location.origin}/product-placeholder.svg` };
  }));
}
