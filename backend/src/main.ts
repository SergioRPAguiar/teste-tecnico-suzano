import "reflect-metadata";
import "dotenv/config";
import { Logger } from "@nestjs/common";
import { createApp } from "./create-app";

async function bootstrap(): Promise<void> {
  const port = Number(process.env.PORT ?? "3001");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT deve ser um inteiro entre 1 e 65535.");
  }

  const app = await createApp();
  app.enableShutdownHooks();
  await app.listen(port);
  Logger.log(`API disponível na porta ${port}`, "Bootstrap");
}

bootstrap().catch((error: unknown) => {
  Logger.error(
    error instanceof Error ? error.message : "Falha ao iniciar API.",
    "Bootstrap",
  );
  process.exitCode = 1;
});
