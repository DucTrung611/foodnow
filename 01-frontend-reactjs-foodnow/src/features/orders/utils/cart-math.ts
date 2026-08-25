import type { CartItem } from '../types/orders.types';

/** Extracted so cart/price math has an explicit test — see cart-math.test.ts. */
export function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + Number(item.basePrice) * item.quantity, 0);
}
