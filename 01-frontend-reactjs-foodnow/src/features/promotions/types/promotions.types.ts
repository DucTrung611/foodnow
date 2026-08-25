export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type Promotion = {
  id: string;
  code: string;
  restaurantId: string | null;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

export type ValidatePromotionPayload = {
  code: string;
  restaurantId: string;
  subtotal: string;
};

export type ValidatePromotionResponse = {
  code: string;
  discountAmount: string;
};

export type CreatePromotionPayload = {
  code: string;
  restaurantId?: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount?: string;
  maxDiscountAmount?: string;
  usageLimit?: number;
  usageLimitPerUser?: number;
  startsAt: string;
  endsAt: string;
};
