import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError } from '@/shared/types';
import { mapErrorCode } from '@/shared/utils/error-code-map';
import { paymentsService } from '../services/payments.service';
import type { PayOrderPayload } from '../types/payments.types';

/**
 * Generates one Idempotency-Key per mount and reuses it for every attempt on
 * this order — a network-failure retry replays the same key (safe, returns
 * the original result), while a genuinely new payment needs a fresh hook
 * instance (e.g. navigating away and back).
 */
export function usePayOrder(orderId: string) {
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const queryClient = useQueryClient();
  const showToast = useNotificationStore((s) => s.showToast);

  return useMutation({
    mutationFn: (payload: PayOrderPayload) => paymentsService.pay(orderId, payload, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
    },
    onError: (error) => {
      showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Thanh toán thất bại');
    },
  });
}
