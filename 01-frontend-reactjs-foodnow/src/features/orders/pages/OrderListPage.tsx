import { Skeleton } from '@/shared/components/ui';
import { OrderCard } from '../components/OrderCard';
import { useOrders } from '../hooks/useOrders';

export function OrderListPage() {
  const { data, isLoading } = useOrders();

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Đơn hàng của tôi</h1>

      <div className="mt-6 flex flex-col gap-3">
        {isLoading && <Skeleton className="h-24 w-full" count={3} />}
        {data?.items.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
        {!isLoading && data?.items.length === 0 && <p className="text-sm text-muted">Bạn chưa có đơn hàng nào.</p>}
      </div>
    </div>
  );
}
