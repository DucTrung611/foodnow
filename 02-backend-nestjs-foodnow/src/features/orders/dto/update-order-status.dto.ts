import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { OrderStatus } from '../../../generated/prisma/enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  version: number;

  @IsOptional()
  @IsString()
  note?: string;
}
