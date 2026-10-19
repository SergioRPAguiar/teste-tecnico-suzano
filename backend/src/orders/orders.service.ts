import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, OrderStatus } from "../generated/prisma/client";
import { CreateOrderDto, OrderStatusInput } from "./dto/create-order.dto";
import { OrderResponseDto } from "./dto/order-response.dto";
import { OrdersRepository, type StoredOrder } from "./orders.repository";

const statusToDatabase = {
  [OrderStatusInput.Pending]: OrderStatus.PENDING,
  [OrderStatusInput.Completed]: OrderStatus.COMPLETED,
  [OrderStatusInput.Cancelled]: OrderStatus.CANCELLED,
};
const statusToResponse = {
  [OrderStatus.PENDING]: OrderStatusInput.Pending,
  [OrderStatus.COMPLETED]: OrderStatusInput.Completed,
  [OrderStatus.CANCELLED]: OrderStatusInput.Cancelled,
};

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async create(input: CreateOrderDto): Promise<OrderResponseDto> {
    const ids = input.items.map((item) => item.productId);
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException("Um produto não pode aparecer duas vezes no mesmo pedido.");
    }
    const status = statusToDatabase[input.status ?? OrderStatusInput.Pending];
    try {
      const order = await this.ordersRepository.transaction(async (tx) => {
        const products = await this.ordersRepository.findProducts(ids, tx);
        const byId = new Map(products.map((product) => [product.id, product]));
        let total = new Prisma.Decimal(0);
        const items = input.items.map((item) => {
          const product = byId.get(item.productId);
          if (!product) throw new NotFoundException(`Produto ${item.productId} não encontrado.`);
          if (product.stockQuantity < item.quantity) {
            throw new ConflictException(`Estoque insuficiente para ${product.name}.`);
          }
          total = total.add(product.price.mul(item.quantity));
          return { productId: product.id, quantity: item.quantity, unitPrice: product.price };
        });
        if (total.gt("999999999999.99")) throw new BadRequestException("Total do pedido excede o limite suportado.");

        if (status === OrderStatus.COMPLETED) {
          // Mesma ordem de aquisição de locks entre pedidos, reduzindo risco de deadlock.
          for (const item of [...items].sort((a, b) => a.productId - b.productId)) {
            if (!await this.ordersRepository.decrementStock(item.productId, item.quantity, tx)) {
              throw new ConflictException("Estoque alterado durante a compra; disponibilidade insuficiente.");
            }
          }
        }
        return this.ordersRepository.create({ total, status, items }, tx);
      });
      return this.toResponse(order);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2003", "P2034"].includes(error.code)) {
        throw new ConflictException("Produtos/estoque foram alterados durante a criação. Tente novamente.");
      }
      throw error;
    }
  }

  async findAll(): Promise<OrderResponseDto[]> {
    return (await this.ordersRepository.findAll()).map((order) => this.toResponse(order));
  }

  private toResponse(order: StoredOrder): OrderResponseDto {
    return {
      id: order.id,
      status: statusToResponse[order.status],
      total: order.total.toFixed(2),
      items: order.items.map((item) => ({
        productId: item.productId,
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toFixed(2),
        subtotal: item.unitPrice.mul(item.quantity).toFixed(2),
      })),
    };
  }
}
