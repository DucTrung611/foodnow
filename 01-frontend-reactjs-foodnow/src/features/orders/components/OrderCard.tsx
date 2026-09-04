import { Link } from 'react-router-dom';
import { StatusBadge } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { formatRelativeTime } from '@/shared/utils/date';
import { useRestaurant } from '@/features/restaurants';
import { ROUTES } from '@/app/routes/routes.config';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from '../utils/order-status';
import type { Order } from '../types/orders.types';

type OrderCardProps = {
  order: Order;
};

export function OrderCard({ order }: OrderCardProps) {
  const { data: restaurant } = useRestaurant(order.restaurantId);
  const preview = order.items.map((i) => i.itemNameSnapshot).join(', ');

  return (
    <Link
      to={ROUTES.orderDetail(order.id)}
      className="flex flex-col gap-2 rounded-card border border-muted-border bg-paper p-4 transition-shadow hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-body font-medium text-ink">{restaurant?.name ?? order.orderCode}</span>
        <StatusBadge tone={ORDER_STATUS_TONE[order.status]} label={ORDER_STATUS_LABELS[order.status]} />
      </div>
      <p className="truncate text-body-sm text-muted">{preview}</p>
      <div className="flex items-center justify-between">
        <span className="font-mono text-mono-code text-muted">{order.orderCode}</span>
        <span className="text-body-sm font-medium text-ink">{formatMoney(order.totalAmount)}</span>
      </div>
      <span className="text-caption text-muted">{formatRelativeTime(order.placedAt)}</span>
    </Link>
  );
}
