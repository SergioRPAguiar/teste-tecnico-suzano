import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { authConfig } from "./auth.config";
import { IS_PUBLIC } from "./public.decorator";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly jwt: JwtService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest<Request>();
    const authorization = request.headers.authorization;
    const match = authorization?.match(/^Bearer ([^\s]+)$/i);
    if (!match) throw new UnauthorizedException("Autenticação necessária.");
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; role: string }>(match[1]!);
      if (payload.sub !== authConfig().username || payload.role !== "admin") throw new Error("subject inválido");
      return true;
    } catch { throw new UnauthorizedException("Token inválido ou expirado."); }
  }
}
