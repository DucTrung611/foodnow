import { Link, useParams } from 'react-router-dom';
import { Badge, Skeleton } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { useAuthStore } from '@/shared/stores/auth.store';
import { ROUTES } from '@/app/routes/routes.config';
import { PayOrderPanel, usePaymentByOrder, usePaymentSocket } from '@/features/payments';
import { OrderStatusTimeline } from '../components/OrderStatusTimeline';
import { useOrder } from '../hooks/useOrder';
import { useOrderStatusSocket } from '../hooks/useOrderStatusSocket';

export function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: order, isLoading } = useOrder(id);
  const isCustomer = useAuthStore((s) => s.user?.role === 'CUSTOMER');
  const { data: payment } = usePaymentByOrder(isCustomer ? id : '');
  useOrderStatusSocket(id);
  usePaymentSocket(id);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-10">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">{order.orderCode}</h1>
        {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <Link to={ROUTES.orderTracking(order.id)} className="text-sm font-medium text-primary">
            Theo dõi đơn hàng
          </Link>
        )}
      </div>

      <div className="mt-6">
        <OrderStatusTimeline status={order.status} />
      </div>

      <section className="mt-8 rounded-ticket border border-muted-border p-4">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b border-muted-border py-2.5 last:border-0">
            <span className="text-sm text-ink">
              {item.quantity}× {item.itemNameSnapshot}
            </span>
            <span className="font-mono text-sm text-ink">{formatMoney(item.subtotal)}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3">
          <span className="font-mono text-sm text-muted">Tổng cộng</span>
          <span className="font-mono text-base font-bold text-ink">{formatMoney(order.totalAmount)}</span>
        </div>
      </section>

      {isCustomer && order.status === 'PENDING' && payment?.status !== 'PAID' && (
        <div className="mt-6">
          <PayOrderPanel orderId={order.id} />
        </div>
      )}
      {isCustomer && payment?.status === 'PAID' && (
        <div className="mt-6 flex items-center justify-between rounded-ticket border border-success-bg bg-success-bg px-4 py-3">
          <span className="text-sm font-medium text-success">Đã thanh toán</span>
          <Badge variant="success">{payment.method}</Badge>
        </div>
      )}
    </div>
  );
}
