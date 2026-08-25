import { apiClient, unwrap } from '@/shared/services/client';
import type { CreatePromotionPayload, Promotion, ValidatePromotionPayload, ValidatePromotionResponse } from '../types/promotions.types';

export const promotionsService = {
  validate: (payload: ValidatePromotionPayload) =>
    unwrap<ValidatePromotionResponse>(apiClient.post('/promotions/validate', payload)),

  create: (payload: CreatePromotionPayload) => unwrap<Promotion>(apiClient.post('/promotions', payload)),
};
