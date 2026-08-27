import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateOrderItemDto {
  @IsUUID()
  menuItemId: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity: number;

  @IsArray()
  @IsUUID('4', { each: true })
  optionIds: string[];

  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateOrderDto {
  @IsUUID()
  restaurantId: string;

  @IsUUID()
  deliveryAddressId: string;

  @IsOptional()
  @IsString()
  promotionCode?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
