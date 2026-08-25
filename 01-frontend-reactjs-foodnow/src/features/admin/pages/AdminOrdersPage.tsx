import { Skeleton } from '@/shared/components/ui';
import { AdminOrderRow } from '../components/AdminOrderRow';
import { useAdminOrders } from '../hooks/useAdminOrders';

export function AdminOrdersPage() {
  const { data, isLoading } = useAdminOrders({ sort: '-placedAt' });

  return (
    <div className="px-8 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Tất cả đơn hàng</h1>

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
      </div>
    </div>
  );
}
