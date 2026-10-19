import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, type Product } from "../generated/prisma/client";
import { CreateProductDto } from "./dto/create-product.dto";
import { ProductResponseDto } from "./dto/product-response.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsRepository } from "./products.repository";

@Injectable()
export class ProductsService {
  constructor(private readonly productsRepository: ProductsRepository) {}

  async findAll(): Promise<ProductResponseDto[]> {
    const products = await this.productsRepository.findAll();

    return products.map((product) => this.toResponse(product));
  }

  async create(input: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productsRepository.create({
      name: input.name,
      category: input.category,
      description: input.description,
      price: new Prisma.Decimal(input.price),
      stockQuantity: input.stockQuantity,
      imageUrl: input.imageUrl,
    });

    return this.toResponse(product);
  }

  private toResponse(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price.toFixed(2),
      stockQuantity: product.stockQuantity,
      imageUrl: product.imageUrl,
    };
  }

  async update(id: number, input: UpdateProductDto): Promise<ProductResponseDto> {
    this.validateId(id);
    if (!Object.values(input).some((value) => value !== undefined)) {
      throw new BadRequestException("Informe ao menos um campo para atualizar.");
    }
    try {
      const product = await this.productsRepository.update(id, {
        name: input.name,
        category: input.category,
        description: input.description,
        price: input.price === undefined ? undefined : new Prisma.Decimal(input.price),
        stockQuantity: input.stockQuantity,
        imageUrl: input.imageUrl,
      });
      return this.toResponse(product);
    } catch (error) {
      this.throwWriteError(error);
    }
  }

  async delete(id: number): Promise<void> {
    this.validateId(id);
    try {
      await this.productsRepository.delete(id);
    } catch (error) {
      this.throwWriteError(error);
    }
  }

  private validateId(id: number): void {
    if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
      throw new BadRequestException("ID de produto inválido.");
    }
  }

  private throwWriteError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") throw new NotFoundException("Produto não encontrado.");
      if (error.code === "P2003") throw new ConflictException("Produto referenciado por pedido não pode ser excluído.");
    }
    throw error;
  }
}
