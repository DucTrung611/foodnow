import { IsDecimal, IsString, IsUUID } from 'class-validator';

export class ValidatePromotionDto {
  @IsString()
  code: string;

  @IsUUID()
  restaurantId: string;

  @IsDecimal({ decimal_digits: '0,2' })
  subtotal: string;
}
