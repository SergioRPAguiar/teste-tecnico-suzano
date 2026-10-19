import { Injectable } from "@nestjs/common";
import { Prisma, OrderStatus } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type StoredOrder = Prisma.OrderGetPayload<{ include: { items: { include: { product: true } } } }>;

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  transaction<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 5000,
      timeout: 10000,
    });
  }

  async findProducts(ids: number[], tx: Prisma.TransactionClient) {
    return tx.product.findMany({ where: { id: { in: ids } }, orderBy: { id: "asc" } });
  }

  async decrementStock(productId: number, quantity: number, tx: Prisma.TransactionClient): Promise<boolean> {
    const result = await tx.product.updateMany({
      where: { id: productId, stockQuantity: { gte: quantity } },
      data: { stockQuantity: { decrement: quantity } },
    });
    return result.count === 1;
  }

  create(data: {
    total: Prisma.Decimal;
    status: OrderStatus;
    items: { productId: number; quantity: number; unitPrice: Prisma.Decimal }[];
  }, tx: Prisma.TransactionClient): Promise<StoredOrder> {
    return tx.order.create({
      data: { total: data.total, status: data.status, items: { create: data.items } },
      include: { items: { include: { product: true }, orderBy: { id: "asc" } } },
    });
  }

  findAll(): Promise<StoredOrder[]> {
    return this.prisma.order.findMany({
      orderBy: { id: "asc" },
      include: { items: { include: { product: true }, orderBy: { id: "asc" } } },
    });
  }
}
