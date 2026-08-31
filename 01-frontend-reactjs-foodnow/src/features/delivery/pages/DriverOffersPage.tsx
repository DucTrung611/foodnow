import { Skeleton } from '@/shared/components/ui';
import { ActiveDeliveryCard } from '../components/ActiveDeliveryCard';
import { DriverOfferCard } from '../components/DriverOfferCard';
import { useActiveDelivery, useAvailableDeliveries } from '../hooks/useAvailableDeliveries';
import { useAcceptDelivery } from '../hooks/useDeliveryActions';
import { useDriverAvailability, useSetDriverAvailability } from '../hooks/useDriverAvailability';
import { useDriverOfferSocket } from '../hooks/useDriverOfferSocket';
import { useLocationPush } from '../hooks/useLocationPush';

export function DriverOffersPage() {
  const { data: availability } = useDriverAvailability();
  const { data: activeDelivery, isLoading: isLoadingActive } = useActiveDelivery();
  const { data: offers, isLoading } = useAvailableDeliveries();
  const acceptDelivery = useAcceptDelivery();
  const setAvailability = useSetDriverAvailability();

  useDriverOfferSocket();
  useLocationPush();

  const isOnline = availability?.isAvailable ?? false;
  const toggleOnline = () => setAvailability.mutate(!isOnline);

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
        {isLoadingActive && <Skeleton className="h-32 w-full" />}
        {activeDelivery && <ActiveDeliveryCard delivery={activeDelivery} />}

        {!activeDelivery && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
