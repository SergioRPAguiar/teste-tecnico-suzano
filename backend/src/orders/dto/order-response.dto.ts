import { ApiProperty } from "@nestjs/swagger";
import { OrderStatusInput } from "./create-order.dto";

export class OrderItemResponseDto {
  @ApiProperty({ type: "integer" }) productId!: number;
  @ApiProperty() name!: string;
  @ApiProperty({ type: "integer" }) quantity!: number;
  @ApiProperty({ type: String, example: "19.90" }) unitPrice!: string;
  @ApiProperty({ type: String, example: "39.80" }) subtotal!: string;
}

export class OrderResponseDto {
  @ApiProperty({ type: "integer" }) id!: number;
  @ApiProperty({ enum: OrderStatusInput }) status!: OrderStatusInput;
  @ApiProperty({ type: String, example: "39.80" }) total!: string;
  @ApiProperty({ type: [OrderItemResponseDto] }) items!: OrderItemResponseDto[];
}
