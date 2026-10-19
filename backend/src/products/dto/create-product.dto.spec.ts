import { BadRequestException } from "@nestjs/common";
import { createValidationPipe } from "../../common/validation/create-validation-pipe";
import { CreateProductDto } from "./create-product.dto";

describe("Contrato de entrada do cadastro de produtos", () => {
  const validInput = {
    name: "Papel A4",
    category: "Papelaria",
    description: "Resma com 500 folhas.",
    price: "19.90",
    stockQuantity: 10,
    imageUrl: "https://example.com/papel.jpg",
  };

  function validate(input: unknown) {
    return createValidationPipe().transform(input, { type: "body", metatype: CreateProductDto });
  }

  it.each(["0.01", "19", "19.9", "19.90", "9999999999.99"])(
    "aceita valor monetário exato dentro do limite: %s",
    async (price) => {
      const result = await validate({ ...validInput, price });
      expect(result.price).toBe(price);
      expect(typeof result.price).toBe("string");
    },
  );

  it.each([19.9, "0", "0.00", "-1.00", "19,90", "1e2", "1.234", "10000000000.00", "NaN", "", null, undefined])(
    "rejeita preço inválido sem coerção ou arredondamento: %s",
    async (price) => {
      await expect(validate({ ...validInput, price })).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it.each([0, 2147483647])("aceita estoque inteiro no limite: %s", async (stockQuantity) => {
    const result = await validate({ ...validInput, stockQuantity });
    expect(result.stockQuantity).toBe(stockQuantity);
  });

  it.each([-1, 1.5, "1", 2147483648, null, undefined])(
    "rejeita estoque fora do contrato: %s",
    async (stockQuantity) => {
      await expect(validate({ ...validInput, stockQuantity })).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it.each(["name", "category", "description", "imageUrl"])(
    "rejeita campo obrigatório vazio ou só com espaços: %s",
    async (field) => {
      await expect(validate({ ...validInput, [field]: "   " })).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it.each(["imagem.jpg", "ftp://example.com/imagem.jpg", "javascript:alert(1)"])(
    "rejeita imagem que não seja URL HTTP(S): %s",
    async (imageUrl) => {
      await expect(validate({ ...validInput, imageUrl })).rejects.toBeInstanceOf(BadRequestException);
    },
  );

  it("normaliza espaços de campos textuais sem converter preço/estoque", async () => {
    const result = await validate({ ...validInput, name: "  Papel A4  ", category: " Papelaria " });
    expect(result.name).toBe("Papel A4");
    expect(result.category).toBe("Papelaria");
    expect(result.price).toBe("19.90");
    expect(result.stockQuantity).toBe(10);
  });

  it("rejeita id fornecido pelo cliente em vez de permitir sobrescrever a geração", async () => {
    await expect(validate({ ...validInput, id: 1 })).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejeita corpo em formato de lista", async () => {
    await expect(validate([validInput])).rejects.toBeInstanceOf(BadRequestException);
  });
});
