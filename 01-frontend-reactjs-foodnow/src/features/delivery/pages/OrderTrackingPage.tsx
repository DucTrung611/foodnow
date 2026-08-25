import { useParams } from 'react-router-dom';
import { DeliveryTrackingMap } from '../components/DeliveryTrackingMap';
import { useOrderTracking } from '../hooks/useOrderTracking';

export function OrderTrackingPage() {
  const { id = '' } = useParams<{ id: string }>();
  const { data: snapshot } = useOrderTracking(id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="font-display text-2xl font-bold text-ink">Theo dõi đơn hàng</h1>
      <div className="mt-6">
        <DeliveryTrackingMap snapshot={snapshot} />
      </div>
    </div>
  );
}
