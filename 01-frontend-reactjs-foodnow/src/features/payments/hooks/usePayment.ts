import { useQuery } from '@tanstack/react-query';
import { paymentsService } from '../services/payments.service';

export const usePayment = (id: string) =>
  useQuery({
    queryKey: ['payments', 'detail', id],
    queryFn: () => paymentsService.getById(id),
    enabled: Boolean(id),
  });

/** `data` is `null` before the order's first charge attempt — not loading, not an error. */
export const usePaymentByOrder = (orderId: string) =>
  useQuery({
    queryKey: ['payments', 'byOrder', orderId],
    queryFn: () => paymentsService.getByOrderId(orderId),
    enabled: Boolean(orderId),
  });
