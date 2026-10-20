import { ApiProperty } from "@nestjs/swagger";
import { Transform, type TransformFnParams } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, IsUrl, Matches, Max, Min } from "class-validator";

// Decimal positivo: até 10 dígitos inteiros e 2 casas; cabe em DECIMAL(12,2).
const PRICE_PATTERN = /^(?!0(?:\.0{1,2})?$)(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

function trimText({ value }: TransformFnParams): unknown {
  return typeof value === "string" ? value.trim() : value;
}

export class CreateProductDto {
  @ApiProperty({ example: "Papel A4" })
  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "Papelaria" })
  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: "Resma de papel A4 com 500 folhas." })
  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({
    type: String,
    example: "19.90",
    pattern: PRICE_PATTERN.source,
    description: "Valor positivo em BRL como string decimal, com até duas casas, sem vírgula ou notação científica.",
  })
  @IsString()
  @Matches(PRICE_PATTERN, {
    message: "price deve ser string decimal positiva, com até 10 dígitos inteiros e 2 casas decimais",
  })
  price!: string;

  @ApiProperty({ type: "integer", minimum: 0, maximum: 2147483647, example: 10 })
  @IsInt()
  @Min(0)
  @Max(2147483647)
  stockQuantity!: number;

  @ApiProperty({ format: "uri", example: "http://localhost:3000/images/papel.jpg" })
  @Transform(trimText)
  @IsString()
  @IsNotEmpty()
  @IsUrl({ protocols: ["http", "https"], require_protocol: true, require_tld: false })
  imageUrl!: string;
}
