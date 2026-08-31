import { Badge, Button, Skeleton } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { ORDER_STATUS_LABELS, useOrder } from '@/features/orders';
import { useCompleteDelivery, usePickupDelivery } from '../hooks/useDeliveryActions';
import type { Delivery } from '../types/delivery.types';

type ActiveDeliveryCardProps = {
  delivery: Delivery;
};

/**
 * Before this existed, an accepted delivery just vanished from the offers
 * list with no follow-up UI anywhere — `POST /deliveries/:id/pickup` and
 * `/complete` existed on the backend but nothing in the frontend called them
 * (UX-AUDIT-REPORT.md §3.1 "Driver flow dead-ends after accepting").
 */
export function ActiveDeliveryCard({ delivery }: ActiveDeliveryCardProps) {
  const { data: order, isLoading } = useOrder(delivery.orderId);
  const pickup = usePickupDelivery();
  const complete = useCompleteDelivery();

  return (
    <div className="rounded-ticket border border-primary bg-paper p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-primary">Đơn đang giao</span>
        <Badge variant={delivery.status === 'PICKED_UP' ? 'success' : 'primary'}>
          {delivery.status === 'PICKED_UP' ? 'Đã lấy hàng' : 'Chờ lấy hàng'}
        </Badge>
      </div>

      {isLoading && <Skeleton className="mt-2 h-6 w-2/3" />}
      {order && (
        <div className="mt-2">
          <p className="font-mono text-sm font-bold text-ink">{order.orderCode}</p>
          <p className="text-xs text-muted">
            {ORDER_STATUS_LABELS[order.status]} · <span className="font-mono">{formatMoney(order.totalAmount)}</span>
          </p>
        </div>
      )}

      {delivery.status === 'ASSIGNED' && (
        <Button
          onClick={() => pickup.mutate(delivery.orderId)}
          isLoading={pickup.isPending}
          className="mt-4 w-full"
        >
          Xác nhận lấy hàng
        </Button>
      )}
      {delivery.status === 'PICKED_UP' && (
        <Button
          onClick={() => complete.mutate(delivery.orderId)}
          isLoading={complete.isPending}
          className="mt-4 w-full"
        >
          Xác nhận đã giao
        </Button>
      )}
    </div>
  );
}
