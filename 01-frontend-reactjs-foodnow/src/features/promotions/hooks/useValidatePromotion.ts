import { useMutation } from '@tanstack/react-query';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError } from '@/shared/types';
import { mapErrorCode } from '@/shared/utils/error-code-map';
import { promotionsService } from '../services/promotions.service';
import type { ValidatePromotionPayload } from '../types/promotions.types';

export const useValidatePromotion = () => {
  const showToast = useNotificationStore((s) => s.showToast);
  return useMutation({
    mutationFn: (payload: ValidatePromotionPayload) => promotionsService.validate(payload),
    onError: (error) => showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Mã khuyến mãi không hợp lệ'),
  });
};
