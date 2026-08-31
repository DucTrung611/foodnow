import { useQuery } from '@tanstack/react-query';
import { ordersService } from '../services/orders.service';
import type { CreateOrderPayload } from '../types/orders.types';

/**
 * Previews delivery fee + total before the customer commits to the order —
 * without this the checkout page only ever showed the subtotal, and the
 * real total (subtotal + delivery fee - discount) only appeared after the
 * order was already placed (UX-AUDIT-REPORT.md §1.3).
 */
export const useOrderQuote = (payload: CreateOrderPayload | null) =>
  useQuery({
    queryKey: ['orders', 'quote', payload],
    queryFn: () => ordersService.quote(payload!),
    enabled: Boolean(payload && payload.deliveryAddressId && payload.items.length > 0),
  });
