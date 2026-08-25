import { useState } from 'react';
import { Skeleton } from '@/shared/components/ui';
import { DriverOfferCard } from '../components/DriverOfferCard';
import { useAvailableDeliveries } from '../hooks/useAvailableDeliveries';
import { useAcceptDelivery } from '../hooks/useDeliveryActions';
import { useSetDriverAvailability } from '../hooks/useDriverAvailability';
import { useDriverOfferSocket } from '../hooks/useDriverOfferSocket';
import { useLocationPush } from '../hooks/useLocationPush';

export function DriverOffersPage() {
  const [isOnline, setIsOnline] = useState(false);
  const { data: offers, isLoading } = useAvailableDeliveries();
  const acceptDelivery = useAcceptDelivery();
  const setAvailability = useSetDriverAvailability();

  useDriverOfferSocket();
  useLocationPush();

  const toggleOnline = () => {
    const next = !isOnline;
    setIsOnline(next);
    setAvailability.mutate(next);
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Đơn hàng gần bạn</h1>
        <button
          type="button"
          onClick={toggleOnline}
          className={`rounded-full px-4 py-1.5 font-mono text-xs font-medium ${isOnline ? 'bg-success text-paper' : 'bg-paper/10 text-paper/70'}`}
        >
          {isOnline ? 'Đang trực tuyến' : 'Ngoại tuyến'}
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isLoading && <Skeleton className="h-16 w-full" count={3} />}
        {offers?.map((offer) => (
          <DriverOfferCard
            key={offer.orderId}
            offer={offer}
            onAccept={() => acceptDelivery.mutate(offer.orderId)}
            isAccepting={acceptDelivery.isPending}
          />
        ))}
        {!isLoading && offers?.length === 0 && <p className="text-sm text-paper/60">Chưa có đơn hàng nào gần bạn.</p>}
      </div>
    </div>
  );
}
