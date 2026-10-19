import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "./generated/prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const catalog = [
  ["Papel A4", "Papéis", "24.90"], ["Papel reciclado", "Papéis", "19.90"],
  ["Papel kraft", "Papéis", "12.50"], ["Cartolina", "Papéis", "8.90"],
  ["Envelope kraft", "Embalagens", "4.50"], ["Caixa organizadora", "Embalagens", "34.90"],
  ["Sacola de papel", "Embalagens", "6.90"], ["Papel para presente", "Embalagens", "9.90"],
  ["Caderno", "Escritório", "21.90"], ["Bloco de notas", "Escritório", "11.90"],
  ["Pasta de documentos", "Escritório", "14.50"], ["Etiquetas", "Escritório", "7.90"],
];

async function seed() {
  let created = 0;
  const imageUrl = new URL("/product-placeholder.svg", process.env.FRONTEND_PUBLIC_URL ?? "http://localhost:3000").href;
  for (const [index, [name, category, price]] of catalog.entries()) {
    for (let variant = 1; variant <= 4; variant++) {
      const productName = `${name} — pacote ${variant}`;
      if (await prisma.product.findFirst({ where: { name: productName } })) continue;
      await prisma.product.create({ data: {
        name: productName, category: category!, description: `${name} para organizar sua rotina. Pacote ${variant} da linha de demonstração.`,
        price: new Prisma.Decimal(price!).add((variant - 1) * 3), stockQuantity: (index * 13 + (variant - 1) * 17) % 81,
        imageUrl,
      } });
      created++;
    }
  }
  console.log(`Seed concluído: ${created} produtos adicionados; registros existentes preservados.`);
}
seed().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
