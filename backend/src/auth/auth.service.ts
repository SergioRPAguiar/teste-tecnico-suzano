import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { createHash, timingSafeEqual } from "node:crypto";
import { authConfig } from "./auth.config";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(private readonly jwt: JwtService) {}
  async login(input: LoginDto) {
    const config = authConfig();
    const digest = (username: string, password: string) => createHash("sha256").update(`${username}\0${password}`).digest();
    if (!timingSafeEqual(digest(input.username, input.password), digest(config.username, config.password))) {
      throw new UnauthorizedException("Usuário ou senha inválidos.");
    }
    return {
      accessToken: await this.jwt.signAsync({ sub: config.username, role: "admin" }),
      tokenType: "Bearer",
      expiresIn: 3600,
      user: { username: config.username },
    };
  }
}
