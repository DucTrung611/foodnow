import {
  IsBoolean,
  IsDecimal,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateMenuItemDto {
  @IsUUID()
  categoryId: string;

  @IsString()
  name: string;

  @IsDecimal({ decimal_digits: '0,2' })
  basePrice: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}
