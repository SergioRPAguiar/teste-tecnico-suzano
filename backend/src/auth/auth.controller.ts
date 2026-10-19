import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { Public } from "./public.decorator";

@ApiTags("Autenticação")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "Autenticar conta administrativa configurada no ambiente" })
  @ApiOkResponse({ schema: { type: "object", properties: {
    accessToken: { type: "string" }, tokenType: { type: "string", example: "Bearer" },
    expiresIn: { type: "integer", example: 3600 }, user: { type: "object", properties: { username: { type: "string" } } },
  } } })
  @ApiBadRequestResponse()
  @ApiUnauthorizedResponse()
  login(@Body() input: LoginDto) { return this.auth.login(input); }
}
