import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Geração do client não precisa de conexão; comandos migrate exigem a URL.
    url: process.env.DATABASE_URL ?? "",
  },
});
