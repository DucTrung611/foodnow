import { randomUUID } from 'crypto';
import { PaymentMethod } from '../../../generated/prisma/enums';

export type ProviderResult = {
  success: boolean;
  providerTransactionId: string;
};

/**
 * Stand-in for a real PSP integration — none is configured yet (see
 * ARCHITECTURE.md's `F5 --> PSP` line, `config/` has no payment provider
 * keys). CASH needs no round-trip and always succeeds; CARD/WALLET simulate
 * a provider call and decline only for the documented test token
 * `tok_decline`, mirroring how real gateways (e.g. Stripe) expose
 * deterministic test tokens. Swap this out for a real client without
 * touching PaymentsService's call sites.
 */
export function simulateCharge(
  method: PaymentMethod,
  paymentToken: string | undefined,
): ProviderResult {
  if (method === PaymentMethod.CASH) {
    return { success: true, providerTransactionId: `cash_${randomUUID()}` };
  }
  return {
    success: paymentToken !== 'tok_decline',
    providerTransactionId: `${method.toLowerCase()}_${randomUUID()}`,
  };
}

export function simulateRefund(): ProviderResult {
  return { success: true, providerTransactionId: `refund_${randomUUID()}` };
}
