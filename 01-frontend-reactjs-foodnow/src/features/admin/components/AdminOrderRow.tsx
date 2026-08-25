import { Badge } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { formatDateTime } from '@/shared/utils/date';
import type { Order } from '@/features/orders';

export function AdminOrderRow({ order }: { order: Order }) {
  return (
    <tr className="border-b border-muted-border">
      <td className="py-2.5 font-mono text-xs text-muted">{order.orderCode}</td>
      <td className="py-2.5 text-sm text-ink">
        <Badge>{order.status}</Badge>
      </td>
      <td className="py-2.5 text-right font-mono text-sm text-ink">{formatMoney(order.totalAmount)}</td>
      <td className="py-2.5 text-right text-xs text-muted">{formatDateTime(order.placedAt)}</td>
    </tr>
  );
}
