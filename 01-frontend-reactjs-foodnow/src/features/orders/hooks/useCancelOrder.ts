import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError } from '@/shared/types';
import { mapErrorCode } from '@/shared/utils/error-code-map';
import { ordersService } from '../services/orders.service';

export const useCancelOrder = (orderId: string) => {
  const queryClient = useQueryClient();
  const showToast = useNotificationStore((s) => s.showToast);

  return useMutation({
    mutationFn: (reason: string) => ordersService.cancel(orderId, reason),
    onSuccess: (order) => {
      queryClient.setQueryData(['orders', 'detail', orderId], order);
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
    onError: (error) => {
      showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Không thể hủy đơn hàng');
    },
  });
};
