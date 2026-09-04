import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, ErrorState, Skeleton } from '@/shared/components/ui';
import { ROUTES } from '@/app/routes/routes.config';
import { OrderCard } from '../components/OrderCard';
import { useOrders } from '../hooks/useOrders';
import type { Order } from '../types/orders.types';

const ACTIVE_STATUSES: Order['status'][] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ON_THE_WAY'];

type Tab = 'active' | 'past';

export function OrderListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('active');
  const { data, isLoading, isError, refetch } = useOrders({ limit: 50, sort: '-placedAt' });

  const orders = data?.items ?? [];
  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));
  const shown = tab === 'active' ? activeOrders : pastOrders;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="font-display text-display-lg text-ink">Đơn hàng của tôi</h1>

      <div className="mt-5 flex gap-1 border-b border-muted-border">
        {(['active', 'past'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`min-h-11 border-b-2 px-3 text-body-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {t === 'active' ? `Đang xử lý${activeOrders.length ? ` (${activeOrders.length})` : ''}` : 'Đã hoàn tất'}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {isLoading && <Skeleton className="h-28 w-full" count={3} />}

        {!isLoading && isError && <ErrorState title="Không tải được danh sách đơn hàng" onRetry={() => refetch()} />}

        {!isLoading && !isError && shown.length === 0 && tab === 'active' && (
          <EmptyState
            title="Bạn chưa có đơn nào đang xử lý"
            description="Đặt món từ nhà hàng yêu thích để bắt đầu."
            action={
              <Button size="sm" onClick={() => navigate(ROUTES.restaurants)}>
                Khám phá nhà hàng
              </Button>
            }
          />
        )}

        {!isLoading && !isError && shown.length === 0 && tab === 'past' && (
          <EmptyState title="Chưa có đơn hàng nào đã hoàn tất" />
        )}

        {!isLoading && !isError && shown.map((order) => <OrderCard key={order.id} order={order} />)}
      </div>
    </div>
  );
}
