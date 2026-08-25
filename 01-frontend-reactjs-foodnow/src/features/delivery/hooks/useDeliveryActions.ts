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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['deliveries', 'available'] }),
    onError: (error) => showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Không thể nhận đơn'),
  });
};

export const usePickupDelivery = () =>
  useMutation({
    mutationFn: (id: string) => deliveryService.pickup(id),
  });

export const useCompleteDelivery = () =>
  useMutation({
    mutationFn: (id: string) => deliveryService.complete(id),
  });
