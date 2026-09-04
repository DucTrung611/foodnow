import { Card } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import type { Order } from '../types/orders.types';

type OrderItemsCardProps = { order: Order };

/**
 * Checkout shows subtotal/fee/discount/total, but order detail used to show
 * only the grand total — the breakdown "disappeared" after placing the
 * order even though `Order` already carries every field needed to show it.
 */
export function OrderItemsCard({ order }: OrderItemsCardProps) {
  return (
    <Card variant="ticket" className="flex flex-col gap-1.5">
      {order.items.map((item) => (
        <div key={item.id} className="flex items-center justify-between border-b border-muted-border pb-2 pt-1 text-body-sm last:border-0">
          <span className="text-ink">
            {item.quantity}× {item.itemNameSnapshot}
          </span>
          <span className="text-ink">{formatMoney(item.subtotal)}</span>
        </div>
      ))}
      <div className="mt-2 flex items-center justify-between text-body-sm">
        <span className="text-muted">Tạm tính</span>
        <span className="text-ink">{formatMoney(order.subtotal)}</span>
      </div>
      <div className="flex items-center justify-between text-body-sm">
        <span className="text-muted">Phí giao hàng</span>
        <span className="text-ink">{formatMoney(order.deliveryFee)}</span>
      </div>
      {Number(order.discountAmount) > 0 && (
        <div className="flex items-center justify-between text-body-sm">
          <span className="text-muted">Giảm giá</span>
          <span className="text-success">-{formatMoney(order.discountAmount)}</span>
        </div>
      )}
      <div className="mt-1 flex items-center justify-between border-t border-muted-border pt-2">
        <span className="text-body font-medium text-ink">Tổng cộng</span>
        <span className="text-body-lg font-bold text-ink">{formatMoney(order.totalAmount)}</span>
      </div>
    </Card>
  );
}
