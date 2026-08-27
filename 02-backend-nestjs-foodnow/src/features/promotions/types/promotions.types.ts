import { PromotionDiscountType } from '../../../generated/prisma/enums';
export { PromotionDiscountType } from '../../../generated/prisma/enums';

/** Shared contract between PromotionsService and PromotionsRepository for `createPromotion`. */
export type CreatePromotionData = {
  code: string;
  restaurantId: string | null;
  discountType: PromotionDiscountType;
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
};
