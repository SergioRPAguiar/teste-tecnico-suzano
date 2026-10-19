import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderResponseDto } from "./dto/order-response.dto";
import { OrdersService } from "./orders.service";

@ApiTags("Pedidos")
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: "Listar pedidos" })
  @ApiOkResponse({ type: OrderResponseDto, isArray: true })
  findAll(): Promise<OrderResponseDto[]> { return this.ordersService.findAll(); }

  @Post()
  @ApiOperation({ summary: "Criar pedido; somente Concluído baixa estoque" })
  @ApiCreatedResponse({ type: OrderResponseDto })
  @ApiBadRequestResponse({ description: "Entrada inválida ou produto repetido." })
  @ApiNotFoundResponse({ description: "Produto inexistente." })
  @ApiConflictResponse({ description: "Estoque insuficiente ou conflito concorrente." })
  create(@Body() input: CreateOrderDto): Promise<OrderResponseDto> { return this.ordersService.create(input); }
}
