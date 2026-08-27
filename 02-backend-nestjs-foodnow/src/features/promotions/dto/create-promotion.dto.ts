import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { PromotionDiscountType } from '../../../generated/prisma/enums';

export class CreatePromotionDto {
  @IsString()
  code: string;

  /** Omitted = global promotion (ADMIN only, checked in PromotionsService). */
  @IsOptional()
  @IsUUID()
  restaurantId?: string;

  @IsEnum(PromotionDiscountType)
  discountType: PromotionDiscountType;

  @IsDecimal({ decimal_digits: '0,2' })
  discountValue: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  minOrderAmount?: string;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  maxDiscountAmount?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usageLimitPerUser?: number;

  @IsDateString()
  startsAt: string;

  @IsDateString()
  endsAt: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
