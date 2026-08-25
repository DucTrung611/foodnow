import { useMutation } from '@tanstack/react-query';
import { promotionsService } from '../services/promotions.service';
import type { CreatePromotionPayload } from '../types/promotions.types';

export const useCreatePromotion = () =>
  useMutation({
    mutationFn: (payload: CreatePromotionPayload) => promotionsService.create(payload),
  });
