import { BadRequestException } from "@nestjs/common";
import { createValidationPipe } from "../../common/validation/create-validation-pipe";
import { UpdateProductDto } from "./update-product.dto";

describe("Atualização parcial de produto", () => {
  it("permite omitir campos sem apagar os dados existentes", async () => {
    const input = await createValidationPipe().transform({ price: "0.10" }, { type: "body", metatype: UpdateProductDto });
    expect(input.price).toBe("0.10");
    expect(input.name).toBeUndefined();
  });
  it.each(["name", "category", "description", "price", "stockQuantity", "imageUrl"])(
    "não confunde null explícito com campo omitido: %s", async (field) => {
      await expect(createValidationPipe().transform({ [field]: null }, { type: "body", metatype: UpdateProductDto }))
        .rejects.toBeInstanceOf(BadRequestException);
    },
  );
});
