/**
 * CARD is confirmed by API_SPEC.md §7's `POST /orders/:id/pay` example;
 * CASH/WALLET and the status union are inferred — reconcile against the
 * backend Prisma enum once the payments module is implemented there.
 */
export type PaymentMethod = 'CARD' | 'CASH' | 'WALLET';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type Payment = {
  id: string;
  orderId: string;
  amount: string;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
};

export type PayOrderPayload = {
  method: PaymentMethod;
  paymentToken?: string;
};
