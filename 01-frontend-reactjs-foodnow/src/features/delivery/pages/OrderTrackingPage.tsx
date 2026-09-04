import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, StatusBadge } from '@/shared/components/ui';
import { formatRelativeTime } from '@/shared/utils/date';
import { useAddresses } from '@/features/auth';
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, useOrder } from '@/features/orders';
import { ROUTES } from '@/app/routes/routes.config';
import { DeliveryTrackingMap } from '../components/DeliveryTrackingMap';
import { useOrderTracking } from '../hooks/useOrderTracking';

const STALE_AFTER_MS = 90_000;

export function OrderTrackingPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: order } = useOrder(id);
  const { data: addresses } = useAddresses();
  const { data: snapshot, refetch } = useOrderTracking(id);
  const [now, setNow] = useState(() => Date.now());

  // Ticks the staleness check even when no new socket message ever arrives —
  // without this a genuinely dropped connection would look "live" forever.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const destinationAddress = addresses?.find((a) => a.id === order?.deliveryAddressId);
  const destination = destinationAddress ? { lat: destinationAddress.lat, lng: destinationAddress.lng } : undefined;
  const isStale = Boolean(snapshot) && now - new Date(snapshot!.recordedAt).getTime() > STALE_AFTER_MS;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        to={order ? ROUTES.orderDetail(order.id) : ROUTES.orders}
        className="inline-flex items-center gap-1.5 text-body-sm text-muted hover:text-ink"
      >
        <svg className="size-3.5" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {order ? order.orderCode : 'Đơn hàng'}
      </Link>

      <h1 className="mt-3 font-display text-display-lg text-ink">Theo dõi đơn hàng</h1>

      <div className="mt-4 overflow-hidden rounded-card border border-muted-border">
        <DeliveryTrackingMap snapshot={snapshot} destination={destination} />
      </div>

      {isStale && snapshot && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-ticket border border-accent bg-accent-bg px-4 py-3">
          <div>
            <p className="text-body-sm font-medium text-ink">Mất kết nối trực tiếp</p>
            <p className="text-caption text-muted">Cập nhật gần nhất: {formatRelativeTime(snapshot.recordedAt)}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>
            Làm mới
          </Button>
        </div>
      )}

      <div className="mt-4 flex items-center justify-between rounded-card border border-muted-border p-4">
        <div>
          <p className="text-body font-medium text-ink">{order ? ORDER_STATUS_LABELS[order.status] : 'Đang tải...'}</p>
          {snapshot && <p className="text-body-sm text-muted">Còn khoảng {snapshot.etaMinutes} phút</p>}
        </div>
        {order && <StatusBadge tone={ORDER_STATUS_TONE[order.status]} label={ORDER_STATUS_LABELS[order.status]} />}
      </div>
    </div>
  );
}
