import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError } from '@/shared/types';
import { mapErrorCode } from '@/shared/utils/error-code-map';
import { deliveryService } from '../services/delivery.service';

export const useAcceptDelivery = () => {
  const queryClient = useQueryClient();
  const showToast = useNotificationStore((s) => s.showToast);
  return useMutation({
    mutationFn: (id: string) => deliveryService.accept(id),
    onSuccess: (delivery) => {
      queryClient.invalidateQueries({ queryKey: ['deliveries', 'available'] });
      queryClient.setQueryData(['deliveries', 'active'], delivery);
      showToast('success', 'Đã nhận đơn giao hàng');
    },
    onError: (error) => showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Không thể nhận đơn'),
  });
};

export const usePickupDelivery = () => {
  const queryClient = useQueryClient();
  const showToast = useNotificationStore((s) => s.showToast);
  return useMutation({
    mutationFn: (id: string) => deliveryService.pickup(id),
    onSuccess: (delivery) => {
      queryClient.setQueryData(['deliveries', 'active'], delivery);
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', delivery.orderId] });
      showToast('success', 'Đã xác nhận lấy hàng');
    },
    onError: (error) => showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Không thể xác nhận lấy hàng'),
  });
};

export const useCompleteDelivery = () => {
  const queryClient = useQueryClient();
  const showToast = useNotificationStore((s) => s.showToast);
  return useMutation({
    mutationFn: (id: string) => deliveryService.complete(id),
    onSuccess: (delivery) => {
      queryClient.setQueryData(['deliveries', 'active'], null);
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', delivery.orderId] });
      queryClient.invalidateQueries({ queryKey: ['drivers', 'me', 'earnings'] });
      showToast('success', 'Đã hoàn thành đơn giao hàng');
    },
    onError: (error) => showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Không thể xác nhận giao hàng'),
  });
};
