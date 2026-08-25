import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError } from '@/shared/types';
import { mapErrorCode } from '@/shared/utils/error-code-map';
import { ordersService } from '../services/orders.service';
import type { UpdateOrderStatusPayload } from '../types/orders.types';

/**
 * Optimistic-lock contract (API_SPEC.md §7): on 409 ORDER_3009 the client
 * must re-fetch and retry with the fresh version — never re-send the stale
 * version, and never assume the transition applied before the server says so.
 */
export const useUpdateOrderStatus = (orderId: string) => {
  const queryClient = useQueryClient();
  const showToast = useNotificationStore((s) => s.showToast);

  return useMutation({
    mutationFn: (payload: UpdateOrderStatusPayload) => ordersService.updateStatus(orderId, payload),
    onSuccess: (order) => {
      queryClient.setQueryData(['orders', 'detail', orderId], order);
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === 'ORDER_3009') {
        showToast('error', 'Đơn vừa được cập nhật bởi người khác, đang tải lại...');
        queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
        return;
      }
      showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Không thể cập nhật đơn hàng');
    },
  });
};
