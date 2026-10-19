import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";
import { ApiBadRequestResponse, ApiBearerAuth, ApiConflictResponse, ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { Public } from "../auth/public.decorator";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductResponseDto } from "./dto/product-response.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@ApiTags("Produtos")
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: "Listar produtos" })
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  findAll(): Promise<ProductResponseDto[]> {
    return this.productsService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiOperation({ summary: "Cadastrar produto" })
  @ApiCreatedResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ description: "Campos ausentes, inválidos ou não previstos no contrato." })
  create(@Body() input: CreateProductDto): Promise<ProductResponseDto> {
    return this.productsService.create(input);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @ApiOperation({ summary: "Atualizar parcialmente um produto" })
  @ApiOkResponse({ type: ProductResponseDto })
  @ApiBadRequestResponse({ description: "ID, campos ou corpo de atualização inválidos." })
  @ApiNotFoundResponse({ description: "Produto não encontrado." })
  update(@Param("id", ParseIntPipe) id: number, @Body() input: UpdateProductDto): Promise<ProductResponseDto> {
    return this.productsService.update(id, input);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @ApiUnauthorizedResponse()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Excluir produto sem referência em pedidos" })
  @ApiNoContentResponse()
  @ApiBadRequestResponse({ description: "ID inválido." })
  @ApiNotFoundResponse({ description: "Produto não encontrado." })
  @ApiConflictResponse({ description: "Produto referenciado por pedido." })
  delete(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.productsService.delete(id);
  }
}
