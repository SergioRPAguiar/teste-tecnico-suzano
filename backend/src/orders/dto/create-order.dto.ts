import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsEnum, IsInt, Max, Min, ValidateIf, ValidateNested } from "class-validator";

export enum OrderStatusInput {
  Pending = "Pendente",
  Completed = "Concluído",
  Cancelled = "Cancelado",
}

export class OrderItemInputDto {
  @ApiProperty({ type: "integer", minimum: 1, example: 1 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  productId!: number;

  @ApiProperty({ type: "integer", minimum: 1, example: 2 })
  @IsInt()
  @Min(1)
  @Max(2147483647)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty({ type: [OrderItemInputDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items!: OrderItemInputDto[];

  @ApiPropertyOptional({ enum: OrderStatusInput, default: OrderStatusInput.Pending })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(OrderStatusInput)
  status?: OrderStatusInput;
}
