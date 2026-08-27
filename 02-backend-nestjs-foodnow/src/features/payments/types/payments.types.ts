export {
  PaymentMethod,
  PaymentStatus,
  PaymentTransactionType,
  PaymentTransactionStatus,
} from '../../../generated/prisma/enums';

import { PaymentMethod } from '../../../generated/prisma/enums';

/** Snapshotted into `payment_transactions.raw_response.requestPayload` so a
 * replayed `Idempotency-Key` can be compared against the original request. */
export type ChargeRequestPayload = {
  orderId: string;
  method: PaymentMethod;
  paymentToken: string | null;
};
