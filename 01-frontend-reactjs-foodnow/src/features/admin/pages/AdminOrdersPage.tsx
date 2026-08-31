import { useState } from 'react';
import { Button, Skeleton } from '@/shared/components/ui';
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/features/orders';
import { AdminOrderRow } from '../components/AdminOrderRow';
import { useAdminOrders, useAdminRestaurants } from '../hooks/useAdminOrders';
import { useAdminUsers } from '../hooks/useAdminUsers';

const STATUS_FILTERS: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'ON_THE_WAY',
  'DELIVERED',
  'CANCELLED',
];

const SELECT_CLASS =
  'rounded-ticket border border-muted-border bg-paper px-3 py-1.5 font-mono text-xs text-ink outline-none focus:border-primary';

export function AdminOrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [restaurantId, setRestaurantId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useAdminOrders({
    sort: '-placedAt',
    status: status || undefined,
    restaurantId: restaurantId || undefined,
    driverId: driverId || undefined,
    page,
  });
  // limit: 100 is a pragmatic ceiling for a filter dropdown, not real pagination.
  const { data: restaurants } = useAdminRestaurants({ limit: 100 });
  const { data: drivers } = useAdminUsers({ role: 'DRIVER', limit: 100 });

  const resetToPage1 = <T,>(setter: (v: T) => void) => (value: T) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="px-8 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Tất cả đơn hàng</h1>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => resetToPage1(setStatus)('')}
          className={`rounded-full px-3 py-1 font-mono text-xs ${status === '' ? 'bg-ink text-paper' : 'bg-muted-border text-muted'}`}
        >
          Tất cả
        </button>
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => resetToPage1(setStatus)(s)}
            className={`rounded-full px-3 py-1 font-mono text-xs ${status === s ? 'bg-ink text-paper' : 'bg-muted-border text-muted'}`}
          >
            {ORDER_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={restaurantId}
          onChange={(e) => resetToPage1(setRestaurantId)(e.target.value)}
          className={SELECT_CLASS}
        >
          <option value="">Tất cả nhà hàng</option>
          {restaurants?.items.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select value={driverId} onChange={(e) => resetToPage1(setDriverId)(e.target.value)} className={SELECT_CLASS}>
          <option value="">Tất cả tài xế</option>
          {drivers?.items.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
            </option>
          ))}
        </select>

        {(restaurantId || driverId) && (
          <button
            type="button"
            onClick={() => {
              resetToPage1(setRestaurantId)('');
              resetToPage1(setDriverId)('');
            }}
            className="font-mono text-xs text-primary hover:underline"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="mt-6 overflow-x-auto">
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-muted-border text-xs text-muted">
                <th className="pb-2 font-medium">Mã đơn</th>
                <th className="pb-2 font-medium">Trạng thái</th>
                <th className="pb-2 text-right font-medium">Tổng tiền</th>
                <th className="pb-2 text-right font-medium">Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {data?.items.map((order) => (
                <AdminOrderRow key={order.id} order={order} />
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && data?.items.length === 0 && <p className="py-6 text-sm text-muted">Không có đơn hàng nào.</p>}
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-muted">
            Trang {data.meta.page} / {data.meta.totalPages} · {data.meta.total} đơn
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <Button variant="ghost" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)}>
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
