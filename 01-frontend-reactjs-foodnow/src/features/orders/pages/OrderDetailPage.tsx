import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Button, ErrorState, Skeleton, StatusBadge } from '@/shared/components/ui';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useAddresses } from '@/features/auth';
import { useRestaurant } from '@/features/restaurants';
import { PayOrderPanel, usePaymentByOrder, usePaymentSocket } from '@/features/payments';
import { ReviewForm } from '@/features/reviews';
import { ROUTES } from '@/app/routes/routes.config';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { OrderItemsCard } from '../components/OrderItemsCard';
import { OrderStatusTimeline } from '../components/OrderStatusTimeline';
import { useOrder } from '../hooks/useOrder';
import { useOrderStatusSocket } from '../hooks/useOrderStatusSocket';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from '../utils/order-status';
import type { OrderStatus } from '../types/orders.types';

const TERMINAL_STATUSES: OrderStatus[] = ['DELIVERED', 'CANCELLED'];
const TRACKABLE_STATUSES: OrderStatus[] = ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ON_THE_WAY'];

export function OrderDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, isError, refetch } = useOrder(id);
  const isCustomer = useAuthStore((s) => s.user?.role === 'CUSTOMER');
  const { data: payment } = usePaymentByOrder(isCustomer ? id : '');
  const { data: restaurant } = useRestaurant(order?.restaurantId ?? '');
  const { data: addresses } = useAddresses({ enabled: isCustomer });
  useOrderStatusSocket(id);
  usePaymentSocket(id);

  const [cancelling, setCancelling] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="mt-4 h-32 w-full" />
      </div>
    );
  }

  if (isError) return <ErrorState title="Không tải được đơn hàng" onRetry={() => refetch()} />;
  if (!order) return <ErrorState title="Không tìm thấy đơn hàng" />;

  const address = addresses?.find((a) => a.id === order.deliveryAddressId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to={ROUTES.orders} className="inline-flex items-center gap-1.5 text-body-sm text-muted hover:text-ink">
        <svg className="size-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Đơn hàng
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-display-lg text-ink">{restaurant?.name ?? 'Đơn hàng'}</h1>
          <p className="mt-0.5 font-mono text-mono-code text-muted">{order.orderCode}</p>
        </div>
        <StatusBadge tone={ORDER_STATUS_TONE[order.status]} label={ORDER_STATUS_LABELS[order.status]} />
      </div>

      <div className="mt-6">
        <OrderStatusTimeline status={order.status} />
      </div>

      {TRACKABLE_STATUSES.includes(order.status) && (
        <Button variant="secondary" className="mt-4 w-full" onClick={() => navigate(ROUTES.orderTracking(order.id))}>
          Theo dõi đơn hàng
        </Button>
      )}

      {address && (
        <section className="mt-6">
          <h2 className="font-display text-display-md text-ink">Giao đến</h2>
          <p className="mt-1 text-body-sm text-ink">
            {address.label} · {address.streetAddress}
          </p>
        </section>
      )}

      <section className="mt-6">
        <OrderItemsCard order={order} />
      </section>

      {isCustomer && order.status === 'PENDING' && payment?.status !== 'PAID' && (
        <div className="mt-6">
          <PayOrderPanel orderId={order.id} />
        </div>
      )}
      {isCustomer && payment?.status === 'PAID' && (
        <div className="mt-6 flex items-center justify-between rounded-ticket border border-success bg-success-bg px-4 py-3">
          <span className="text-body-sm font-medium text-success">Đã thanh toán</span>
          <Badge variant="success">{payment.method}</Badge>
        </div>
      )}

      {isCustomer && order.status === 'DELIVERED' && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" size="sm" onClick={() => navigate(ROUTES.restaurantDetail(order.restaurantId))}>
            Đặt lại
          </Button>
          {!reviewing && (
            <Button variant="ghost" size="sm" onClick={() => setReviewing(true)}>
              Đánh giá đơn hàng
            </Button>
          )}
        </div>
      )}

      {isCustomer && order.status === 'DELIVERED' && reviewing && (
        <section className="mt-4 rounded-card border border-muted-border p-4">
          <ReviewForm orderId={order.id} onSubmitted={() => setReviewing(false)} />
        </section>
      )}

      {isCustomer && !TERMINAL_STATUSES.includes(order.status) && (
        <div className="mt-6 border-t border-muted-border pt-6">
          <Button variant="danger" size="sm" onClick={() => setCancelling(true)}>
            Hủy đơn
          </Button>
        </div>
      )}

      <CancelOrderModal orderId={order.id} open={cancelling} onClose={() => setCancelling(false)} />
    </div>
  );
}
