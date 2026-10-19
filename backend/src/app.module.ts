import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { RequestLoggerMiddleware } from "./common/middleware/request-logger.middleware";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [AuthModule, ProductsModule, OrdersModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes({ path: "{*path}", method: RequestMethod.ALL });
  }
}
