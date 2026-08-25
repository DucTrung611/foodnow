import { Link } from 'react-router-dom';
import { Badge } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { formatRelativeTime } from '@/shared/utils/date';
import { ROUTES } from '@/app/routes/routes.config';
import { ORDER_STATUS_LABELS } from '../utils/order-status';
import type { Order } from '../types/orders.types';

const STATUS_BADGE_VARIANT: Record<Order['status'], 'primary' | 'accent' | 'success' | 'danger' | 'neutral'> = {
  PENDING: 'neutral',
  CONFIRMED: 'accent',
  PREPARING: 'accent',
  READY_FOR_PICKUP: 'primary',
  ON_THE_WAY: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

type OrderCardProps = {
  order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link
      to={ROUTES.orderDetail(order.id)}
      className="flex flex-col gap-2 rounded-ticket border border-muted-border bg-paper p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-muted">{order.orderCode}</span>
        <Badge variant={STATUS_BADGE_VARIANT[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </div>
      <p className="text-sm text-ink">
        {order.items.length} món · <span className="font-mono">{formatMoney(order.totalAmount)}</span>
      </p>
      <span className="text-xs text-muted">{formatRelativeTime(order.placedAt)}</span>
    </Link>
  );
}
