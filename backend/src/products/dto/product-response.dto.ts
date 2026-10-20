import { ApiProperty } from "@nestjs/swagger";

export class ProductResponseDto {
  @ApiProperty({ type: "integer", example: 1 })
  id!: number;
  @ApiProperty({ example: "Papel A4" })
  name!: string;
  @ApiProperty({ example: "Papelaria" })
  category!: string;
  @ApiProperty({ example: "Resma de papel A4 com 500 folhas." })
  description!: string;
  @ApiProperty({ type: String, example: "19.90" })
  price!: string;
  @ApiProperty({ type: "integer", minimum: 0, example: 10 })
  stockQuantity!: number;
  @ApiProperty({ format: "uri", example: "http://localhost:3000/images/papel.jpg" })
  imageUrl!: string;
}
