import type { StatusTone } from '@/shared/components/ui';
import type { OrderStatus } from '../types/orders.types';

/** Feeds the shared, generic `<StatusBadge>` — one status→color mapping used by every role (G9). */
export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_PICKUP: 'ready',
  ON_THE_WAY: 'enroute',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  PREPARING: 'Đang chuẩn bị',
  READY_FOR_PICKUP: 'Chờ tài xế lấy',
  ON_THE_WAY: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

/** Display order for OrderStatusTimeline — not a transition-validity map. */
export const ORDER_STATUS_SEQUENCE: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'ON_THE_WAY',
  'DELIVERED',
];

/**
 * There is deliberately no client-side "allowed next status" map here.
 * Transition validity is the server's call (ORDER_3008/ORDER_3009) — see
 * CLAUDE.md's ordering-flow rule. UI only offers the single "next" action
 * and lets the server accept or reject it.
 */
export function nextStatusInSequence(status: OrderStatus): OrderStatus | null {
  const index = ORDER_STATUS_SEQUENCE.indexOf(status);
  if (index === -1 || index === ORDER_STATUS_SEQUENCE.length - 1) return null;
  return ORDER_STATUS_SEQUENCE[index + 1];
}
