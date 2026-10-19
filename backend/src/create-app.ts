import "reflect-metadata";
import "dotenv/config";
import type { NestApplicationOptions } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { createValidationPipe } from "./common/validation/create-validation-pipe";

export async function createApp(options?: NestApplicationOptions) {
  const app = await NestFactory.create(AppModule, options);
  app.useGlobalPipes(createValidationPipe());
  app.enableCors({
    origin: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://127.0.0.1:3000")
      .split(",").map((origin) => origin.trim()).filter(Boolean),
  });
  const config = new DocumentBuilder()
    .setTitle("API de produtos e pedidos")
    .setDescription("Teste técnico Suzano: contratos e operações disponíveis.")
    .setVersion("0.1.0")
    .addBearerAuth()
    .build();
  SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  return app;
}
