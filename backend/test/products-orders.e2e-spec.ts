import type { INestApplication } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import supertest from "supertest";
import { JwtService } from "@nestjs/jwt";
import { createApp } from "../src/create-app";
import { OrdersRepository } from "../src/orders/orders.repository";
import { PrismaService } from "../src/prisma/prisma.service";

describe("Produtos/pedidos com PostgreSQL real", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const ids: number[] = [];
  const prefix = `e2e-${randomUUID()}`;
  let sequence = 0;
  let token = "";
  const request = (server: Parameters<typeof supertest>[0]) =>
    supertest.agent(server).set("Authorization", `Bearer ${token}`);

  beforeAll(async () => {
    app = await createApp({ logger: false });
    await app.init();
    prisma = app.get(PrismaService);
    const response = await supertest(app.getHttpServer()).post("/auth/login")
      .send({ username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD }).expect(200);
    token = response.body.accessToken;
  });
  afterAll(async () => {
    try {
      if (prisma && ids.length) {
        const orders = await prisma.order.findMany({ where: { items: { some: { productId: { in: ids } } } }, select: { id: true } });
        const orderIds = orders.map((order) => order.id);
        await prisma.$transaction([
          prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } }),
          prisma.order.deleteMany({ where: { id: { in: orderIds } } }),
          prisma.product.deleteMany({ where: { id: { in: ids } } }),
        ]);
      }
    } finally { if (app) await app.close(); }
  });

  function payload(price = "19.90", stockQuantity = 5) {
    return { name: `${prefix}-${sequence++}`, category: "Teste", description: "Fixture de integração",
      price, stockQuantity, imageUrl: "https://example.com/item.png" };
  }
  async function product(price = "19.90", stock = 5) {
    const response = await request(app.getHttpServer()).post("/products").send(payload(price, stock)).expect(201);
    ids.push(response.body.id);
    return response.body as { id: number; price: string; name: string; stockQuantity: number };
  }

  it("exige JWT nas escritas/pedidos, rejeita credenciais e tokens inválidos/expirados", async () => {
    await supertest(app.getHttpServer()).get("/products").expect(200);
    await supertest(app.getHttpServer()).post("/products").send(payload()).expect(401);
    await supertest(app.getHttpServer()).get("/orders").expect(401);
    await supertest(app.getHttpServer()).post("/auth/login")
      .send({ username: process.env.ADMIN_USERNAME, password: "incorreta" }).expect(401);
    await supertest(app.getHttpServer()).get("/orders").auth(`${token}x`, { type: "bearer" }).expect(401);
    const expired = await app.get(JwtService).signAsync({ sub: process.env.ADMIN_USERNAME, role: "admin" }, { expiresIn: -1 });
    await supertest(app.getHttpServer()).get("/orders").auth(expired, { type: "bearer" }).expect(401);
  });

  it("publica documentação OpenAPI das operações, validação e autenticação", async () => {
    const response = await supertest(app.getHttpServer()).get("/docs-json").expect(200);
    expect(response.body.paths["/products"].post).toBeDefined();
    expect(response.body.paths["/products/{id}"].patch).toBeDefined();
    expect(response.body.paths["/products/{id}"].delete).toBeDefined();
    expect(response.body.paths["/orders"].post).toBeDefined();
    expect(response.body.paths["/auth/login"].post).toBeDefined();
    expect(response.body.components.schemas.CreateProductDto.properties.price.type).toBe("string");
    expect(response.body.components.securitySchemes.bearer).toBeDefined();
  });

  it("cadastra, persiste e lista preço exato com estoque zero", async () => {
    const created = await product("0.10", 0);
    expect(created.price).toBe("0.10");
    expect(created.stockQuantity).toBe(0);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: created.id } })).price.toFixed(2)).toBe("0.10");
    const listed = await request(app.getHttpServer()).get("/products").expect(200);
    expect(listed.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.id, price: "0.10" })]));
  });

  it("rejeita entrada inválida sem gravar e não aceita null em PATCH", async () => {
    const count = await prisma.product.count();
    await request(app.getHttpServer()).post("/products").send({ ...payload(), price: 19.9 }).expect(400);
    expect(await prisma.product.count()).toBe(count);
    const created = await product();
    await request(app.getHttpServer()).patch(`/products/${created.id}`).send({ price: null }).expect(400);
    await request(app.getHttpServer()).patch(`/products/${created.id}`).send({}).expect(400);
    const updated = await request(app.getHttpServer()).patch(`/products/${created.id}`).send({ price: "25.00" }).expect(200);
    expect(updated.body.price).toBe("25.00");
    expect(updated.body.name).toBe(created.name);
  });

  it("exclui sem referências e diferencia ID inválido de produto inexistente", async () => {
    const created = await product();
    await request(app.getHttpServer()).delete(`/products/${created.id}`).expect(204);
    await request(app.getHttpServer()).delete(`/products/${created.id}`).expect(404);
    await request(app.getHttpServer()).patch(`/products/${created.id}`).send({ name: "outro" }).expect(404);
    await request(app.getHttpServer()).delete("/products/-1").expect(400);
    await request(app.getHttpServer()).delete("/products/2147483648").expect(400);
  });

  it("calcula pedido pendente no servidor, preserva preço histórico e bloqueia exclusão", async () => {
    const a = await product("19.90", 5);
    const b = await product("0.10", 2);
    const created = await request(app.getHttpServer()).post("/orders")
      .send({ items: [{ productId: a.id, quantity: 2 }, { productId: b.id, quantity: 1 }] }).expect(201);
    expect(created.body.status).toBe("Pendente");
    expect(created.body.total).toBe("39.90");
    expect((await prisma.product.findUniqueOrThrow({ where: { id: a.id } })).stockQuantity).toBe(5);
    await request(app.getHttpServer()).patch(`/products/${a.id}`).send({ price: "30.00" }).expect(200);
    const listed = await request(app.getHttpServer()).get("/orders").expect(200);
    const historical = listed.body.find((order: { id: number }) => order.id === created.body.id);
    expect(historical.total).toBe("39.90");
    expect(historical.items[0].unitPrice).toBe("19.90");
    await request(app.getHttpServer()).delete(`/products/${a.id}`).expect(409);
  });

  it("baixa apenas Concluído e valida disponibilidade também em Cancelado", async () => {
    const created = await product("2.00", 2);
    const body = { items: [{ productId: created.id, quantity: 1 }] };
    await request(app.getHttpServer()).post("/orders").send({ ...body, status: "Cancelado" }).expect(201);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: created.id } })).stockQuantity).toBe(2);
    await request(app.getHttpServer()).post("/orders").send({ ...body, status: "Concluído" }).expect(201);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: created.id } })).stockQuantity).toBe(1);
    await request(app.getHttpServer()).post("/orders")
      .send({ status: "Cancelado", items: [{ productId: created.id, quantity: 2 }] }).expect(409);
  });

  it("rejeita itens repetidos, quantidade zero, total fornecido e status inválido", async () => {
    const created = await product();
    const item = { productId: created.id, quantity: 1 };
    for (const body of [
      { items: [item, item] }, { items: [] }, { items: [{ ...item, quantity: 0 }] },
      { items: [item], total: "0.01" }, { items: [{ ...item, unitPrice: "0.01" }] },
      { items: [item], status: "Inválido" }, { items: [item], status: null },
    ]) await request(app.getHttpServer()).post("/orders").send(body).expect(400);
    const deleted = await product();
    await request(app.getHttpServer()).delete(`/products/${deleted.id}`).expect(204);
    await request(app.getHttpServer()).post("/orders").send({ items: [{ productId: deleted.id, quantity: 1 }] }).expect(404);
  });

  it("reverte uma baixa já feita quando o segundo item perde disponibilidade", async () => {
    const a = await product("1.00", 1);
    const b = await product("1.00", 1);
    const repository = app.get(OrdersRepository);
    const original = repository.decrementStock.bind(repository);
    let firstWritten = false;
    const spy = jest.spyOn(repository, "decrementStock").mockImplementation(async (id, quantity, tx) => {
      if (id === b.id) await prisma.product.update({ where: { id }, data: { stockQuantity: 0 } });
      const result = await original(id, quantity, tx);
      if (id === a.id) firstWritten = result;
      return result;
    });
    try {
      await request(app.getHttpServer()).post("/orders").send({ status: "Concluído",
        items: [{ productId: a.id, quantity: 1 }, { productId: b.id, quantity: 1 }] }).expect(409);
      expect(firstWritten).toBe(true);
      expect((await prisma.product.findUniqueOrThrow({ where: { id: a.id } })).stockQuantity).toBe(1);
      expect(await prisma.order.count({ where: { items: { some: { productId: a.id } } } })).toBe(0);
    } finally { spy.mockRestore(); }
  });

  it("rejeita total que ultrapassa DECIMAL(14,2) sem baixar estoque ou criar pedido", async () => {
    const created = await product("9999999999.99", 2147483647);
    await request(app.getHttpServer()).post("/orders").send({ status: "Concluído",
      items: [{ productId: created.id, quantity: 101 }] }).expect(400);
    expect((await prisma.product.findUniqueOrThrow({ where: { id: created.id } })).stockQuantity).toBe(2147483647);
    expect(await prisma.order.count({ where: { items: { some: { productId: created.id } } } })).toBe(0);
  });

  it("duas compras leem a última unidade antes da baixa: só uma conclui", async () => {
    const last = await product("9.90", 1);
    const repository = app.get(OrdersRepository);
    const original = repository.findProducts.bind(repository);
    let arrivals = 0;
    let release!: () => void;
    let timer: ReturnType<typeof setTimeout>;
    const gate = new Promise<void>((resolve, reject) => {
      release = resolve;
      timer = setTimeout(() => reject(new Error("As duas transações não chegaram à barreira.")), 5000);
    });
    const spy = jest.spyOn(repository, "findProducts").mockImplementation(async (ids, tx) => {
      const result = await original(ids, tx);
      if (ids.includes(last.id)) {
        arrivals++;
        if (arrivals === 2) release();
        await gate;
      }
      return result;
    });
    try {
      const body = { status: "Concluído", items: [{ productId: last.id, quantity: 1 }] };
      const responses = await Promise.all([
        request(app.getHttpServer()).post("/orders").send(body),
        request(app.getHttpServer()).post("/orders").send(body),
      ]);
      expect(arrivals).toBe(2);
      expect(responses.map((response) => response.status).sort()).toEqual([201, 409]);
      expect((await prisma.product.findUniqueOrThrow({ where: { id: last.id } })).stockQuantity).toBe(0);
      expect(await prisma.order.count({ where: { items: { some: { productId: last.id } } } })).toBe(1);
    } finally { clearTimeout(timer!); spy.mockRestore(); }
  });
});
