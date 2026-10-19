import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma, OrderStatus } from "../generated/prisma/client";
import { OrderStatusInput } from "./dto/create-order.dto";
import { OrdersRepository } from "./orders.repository";
import { OrdersService } from "./orders.service";

describe("Regras de criação de pedidos", () => {
  function setup() {
    const products = [
      { id: 1, name: "Papel", stockQuantity: 5, price: new Prisma.Decimal("19.90") },
      { id: 2, name: "Unidade", stockQuantity: 2, price: new Prisma.Decimal("0.10") },
    ];
    const repository = {
      transaction: jest.fn(async (operation: (tx: unknown) => Promise<unknown>) => operation({})),
      findProducts: jest.fn().mockResolvedValue(products),
      decrementStock: jest.fn().mockResolvedValue(true),
      create: jest.fn(async (data) => ({ id: 1, ...data, items: data.items.map((item: { productId: number }) => ({
        ...item, product: products.find((product) => product.id === item.productId),
      })) })),
    };
    return { service: new OrdersService(repository as unknown as OrdersRepository), repository };
  }

  it("calcula o total exato pelo preço do servidor e não baixa pedido pendente", async () => {
    const { service, repository } = setup();
    const result = await service.create({ items: [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 1 }] });
    expect(result.total).toBe("39.90");
    expect(result.status).toBe("Pendente");
    expect(result.items[0]?.unitPrice).toBe("19.90");
    expect(repository.decrementStock).not.toHaveBeenCalled();
  });
  it("aplica baixa somente em Concluído e em ordem estável de produto", async () => {
    const { service, repository } = setup();
    await service.create({ status: OrderStatusInput.Completed, items: [{ productId: 2, quantity: 1 }, { productId: 1, quantity: 1 }] });
    expect(repository.decrementStock.mock.calls.map((call) => call[0])).toEqual([1, 2]);
    expect(repository.create.mock.calls[0]?.[0].status).toBe(OrderStatus.COMPLETED);
  });
  it("rejeita duplicatas antes de consultar o banco", async () => {
    const { service, repository } = setup();
    await expect(service.create({ items: [{ productId: 1, quantity: 1 }, { productId: 1, quantity: 1 }] }))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(repository.transaction).not.toHaveBeenCalled();
  });
  it("rejeita produto inexistente", async () => {
    const { service } = setup();
    await expect(service.create({ items: [{ productId: 999, quantity: 1 }] })).rejects.toBeInstanceOf(NotFoundException);
  });
  it("verifica disponibilidade também para Cancelado e não cria pedido inválido", async () => {
    const { service, repository } = setup();
    await expect(service.create({ status: OrderStatusInput.Cancelled, items: [{ productId: 1, quantity: 6 }] }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });
  it("não cria pedido quando uma baixa condicional perde a disputa", async () => {
    const { service, repository } = setup();
    repository.decrementStock.mockResolvedValue(false);
    await expect(service.create({ status: OrderStatusInput.Completed, items: [{ productId: 1, quantity: 1 }] }))
      .rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
