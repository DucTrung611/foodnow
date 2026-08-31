import { useNavigate } from 'react-router-dom';
import { Badge } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { formatDateTime } from '@/shared/utils/date';
import { ORDER_STATUS_LABELS, type Order } from '@/features/orders';
import { ROUTES } from '@/app/routes/routes.config';

export function AdminOrderRow({ order }: { order: Order }) {
  const navigate = useNavigate();
  const goToDetail = () => navigate(ROUTES.orderDetail(order.id));

  return (
    <tr
      className="cursor-pointer border-b border-muted-border hover:bg-primary-bg"
      tabIndex={0}
      role="link"
      onClick={goToDetail}
      onKeyDown={(e) => e.key === 'Enter' && goToDetail()}
    >
      <td className="py-2.5 font-mono text-xs text-muted">{order.orderCode}</td>
      <td className="py-2.5 text-sm text-ink">
        <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
      </td>
      <td className="py-2.5 text-right font-mono text-sm text-ink">{formatMoney(order.totalAmount)}</td>
      <td className="py-2.5 text-right text-xs text-muted">{formatDateTime(order.placedAt)}</td>
    </tr>
  );
}
