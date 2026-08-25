import { Button } from '@/shared/components/ui';
import { formatMoney } from '@/shared/utils/money';
import { formatDistance } from '@/shared/utils/geo';
import type { AvailableDelivery } from '../types/delivery.types';

type DriverOfferCardProps = {
  offer: AvailableDelivery;
  onAccept: () => void;
  isAccepting?: boolean;
};

export function DriverOfferCard({ offer, onAccept, isAccepting }: DriverOfferCardProps) {
  return (
    <div className="flex items-center justify-between rounded-ticket border border-muted-border bg-paper p-4">
      <div>
        <p className="font-mono text-sm text-ink">{formatDistance(offer.distanceMeters)} · {formatMoney(offer.estimatedEarning)}</p>
        <p className="text-xs text-muted">Đơn #{offer.orderId.slice(0, 8)}</p>
      </div>
      <Button onClick={onAccept} isLoading={isAccepting}>
        Nhận đơn
      </Button>
    </div>
  );
}
