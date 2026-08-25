import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError } from '@/shared/types';
import { mapErrorCode } from '@/shared/utils/error-code-map';
import { ordersService } from '../services/orders.service';
import type { CreateOrderPayload } from '../types/orders.types';

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  const showToast = useNotificationStore((s) => s.showToast);

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => ordersService.create(payload),
    onSuccess: () => {
      // The cart is cleared server-side once an order is placed from it.
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
    onError: (error) => {
      showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Không thể đặt hàng');
    },
  });
};
