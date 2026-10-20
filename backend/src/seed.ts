import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "./generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const catalog = [
  ["Papel A4", "Papéis", "24.90", "papel.jpg"], ["Papel reciclado", "Papéis", "19.90", "papel.jpg"],
  ["Papel kraft", "Papéis", "12.50", "sacolas.jpg"], ["Cartolina", "Papéis", "8.90", "notas.jpg"],
  ["Envelope kraft", "Embalagens", "4.50", "envelope.jpg"], ["Caixa organizadora", "Embalagens", "34.90", "caixa.jpg"],
  ["Sacola de papel", "Embalagens", "6.90", "sacolas.jpg"], ["Papel para presente", "Embalagens", "9.90", "caixa.jpg"],
  ["Caderno", "Escritório", "21.90", "caderno.jpg"], ["Bloco de notas", "Escritório", "11.90", "notas.jpg"],
  ["Pasta de documentos", "Escritório", "14.50", "caderno.jpg"], ["Etiquetas", "Escritório", "7.90", "notas.jpg"],
] as const;

const publicUrl = process.env.FRONTEND_PUBLIC_URL ?? "http://localhost:3000";
const managedPaths = new Set(["/product-placeholder.svg", ...catalog.map((item) => `/images/${item[3]}`)]);
function isManagedImage(value: string): boolean {
  try {
    const url = new URL(value);
    return managedPaths.has(url.pathname) && [new URL(publicUrl).hostname, "localhost", "127.0.0.1", "web"].includes(url.hostname);
  } catch { return false; }
}

async function seed() {
  let created = 0;
  let imagesUpdated = 0;
  for (const [index, [name, category, price, image]] of catalog.entries()) {
    const imageUrl = new URL(`/images/${image}`, publicUrl).href;
    for (let variant = 1; variant <= 4; variant++) {
      const productName = `${name} — pacote ${variant}`;
      const existing = await prisma.product.findFirst({ where: { name: productName } });
      if (existing) {
        // Atualiza só a imagem gerenciada do demo, nunca preço/estoque ou fotos personalizadas.
        if (existing.imageUrl !== imageUrl && isManagedImage(existing.imageUrl)) {
          await prisma.product.update({ where: { id: existing.id }, data: { imageUrl } });
          imagesUpdated++;
        }
        continue;
      }
      await prisma.product.create({ data: {
        name: productName, category, description: `${name} para organizar sua rotina. Pacote ${variant} da linha de demonstração.`,
        price: new Prisma.Decimal(price).add((variant - 1) * 3), stockQuantity: (index * 13 + (variant - 1) * 17) % 81,
        imageUrl,
      } });
      created++;
    }
  }
  console.log(`Seed concluído: ${created} produtos adicionados, ${imagesUpdated} imagens demo atualizadas; preços/estoques existentes preservados.`);
}
seed().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
