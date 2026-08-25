import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError } from '@/shared/types';
import { mapErrorCode } from '@/shared/utils/error-code-map';
import { reviewsService } from '../services/reviews.service';
import type { CreateReviewPayload } from '../types/reviews.types';

export const useCreateReview = (orderId: string) => {
  const queryClient = useQueryClient();
  const showToast = useNotificationStore((s) => s.showToast);

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => reviewsService.create(orderId, payload),
    onSuccess: (review) => {
      showToast('success', 'Cảm ơn bạn đã đánh giá!');
      if (review.restaurantId) {
        queryClient.invalidateQueries({ queryKey: ['reviews', 'restaurant', review.restaurantId] });
      }
    },
    onError: (error) => showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Không thể gửi đánh giá'),
  });
};
