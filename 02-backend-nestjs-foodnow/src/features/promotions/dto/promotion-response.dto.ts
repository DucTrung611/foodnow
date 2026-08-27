import { PromotionDiscountType } from '../../../generated/prisma/enums';

export class PromotionResponseDto {
  id: string;
  code: string;
  restaurantId: string | null;
  discountType: PromotionDiscountType;
  discountValue: string;
  minOrderAmount: string | null;
  maxDiscountAmount: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
}
