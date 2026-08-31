import { apiClient, unwrap } from '@/shared/services/client';
import type { PayOrderPayload, Payment } from '../types/payments.types';

export const paymentsService = {
  // Idempotency-Key is required by API_SPEC.md §3 — same key + same payload
  // returns the original charge result instead of billing twice.
  pay: (orderId: string, payload: PayOrderPayload, idempotencyKey: string) =>
    unwrap<Payment>(
      apiClient.post(`/orders/${orderId}/pay`, payload, {
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
    ),

  getById: (id: string) => unwrap<Payment>(apiClient.get(`/payments/${id}`)),

  // `null` means the order has no charge attempt yet — not an error.
  getByOrderId: (orderId: string) => unwrap<Payment | null>(apiClient.get(`/orders/${orderId}/payment`)),

  refund: (id: string) => unwrap<Payment>(apiClient.post(`/payments/${id}/refund`)),
};
