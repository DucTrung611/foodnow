import { Badge, Button, Skeleton } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { ORDER_STATUS_LABELS, nextStatusInSequence } from '../utils/order-status';
import { useOrders } from '../hooks/useOrders';
import { useUpdateOrderStatus } from '../hooks/useUpdateOrderStatus';
import type { Order } from '../types/orders.types';

function VendorOrderRow({ order }: { order: Order }) {
  const updateStatus = useUpdateOrderStatus(order.id);
  const next = nextStatusInSequence(order.status);

  return (
    <div className="flex items-center justify-between gap-4 rounded-ticket border border-muted-border p-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted">{order.orderCode}</span>
          <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
        </div>
        <p className="mt-1 text-sm text-ink">
          {order.items.length} món · <span className="font-mono">{formatMoney(order.totalAmount)}</span>
        </p>
      </div>

      {next && (
        <Button
          variant="secondary"
          isLoading={updateStatus.isPending}
          onClick={() => updateStatus.mutate({ status: next, version: order.version })}
        >
          Chuyển sang "{ORDER_STATUS_LABELS[next]}"
        </Button>
      )}
    </div>
  );
}

export function VendorOrdersPage() {
  const { data, isLoading } = useOrders({ sort: '-placedAt' });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Đơn hàng đến</h1>

      <div className="mt-6 flex flex-col gap-3">
        {isLoading && <Skeleton className="h-20 w-full" count={4} />}
        {data?.items.map((order) => (
          <VendorOrderRow key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
}
