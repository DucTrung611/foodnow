export { PromoCodeInput } from './components/PromoCodeInput';

export { useValidatePromotion } from './hooks/useValidatePromotion';
export { useCreatePromotion } from './hooks/useCreatePromotion';

export { promotionsService } from './services/promotions.service';

export type {
  Promotion,
  DiscountType,
  ValidatePromotionPayload,
  ValidatePromotionResponse,
  CreatePromotionPayload,
} from './types/promotions.types';
