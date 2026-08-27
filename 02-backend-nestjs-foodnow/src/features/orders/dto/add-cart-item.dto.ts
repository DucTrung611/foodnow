import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class AddCartItemDto {
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
