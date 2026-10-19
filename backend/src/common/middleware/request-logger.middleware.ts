import { Injectable, Logger, NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";
import { performance } from "node:perf_hooks";

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = performance.now();
    const path = request.originalUrl.split("?")[0];

    response.once("finish", () => {
      const elapsedMs = (performance.now() - startedAt).toFixed(1);
      this.logger.log(`${request.method} ${path} ${response.statusCode} ${elapsedMs}ms`);
    });

    next();
  }
}
