import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { authConfig } from "./auth.config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Module({
  imports: [JwtModule.registerAsync({ useFactory: () => ({
    secret: authConfig().secret,
    signOptions: { expiresIn: "1h", algorithm: "HS256", issuer: "suzano-case", audience: "suzano-app" },
    verifyOptions: { algorithms: ["HS256"], issuer: "suzano-case", audience: "suzano-app" },
  }) })],
  controllers: [AuthController],
  providers: [AuthService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AuthModule {}
