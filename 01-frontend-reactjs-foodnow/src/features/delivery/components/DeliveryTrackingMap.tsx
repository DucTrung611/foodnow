import type { DeliveryTrackingSnapshot } from '../types/delivery.types';

type DeliveryTrackingMapProps = {
  snapshot: DeliveryTrackingSnapshot | undefined;
};

/**
 * Placeholder for a real map SDK (Mapbox/Goong Maps) integration — renders
 * the latest known position as coordinates + ETA so the tracking flow is
 * wireable end-to-end without pulling in a map library yet.
 */
export function DeliveryTrackingMap({ snapshot }: DeliveryTrackingMapProps) {
  if (!snapshot) {
    return (
      <div className="flex h-64 items-center justify-center rounded-ticket border border-dashed border-muted-border text-sm text-muted">
        Đang chờ vị trí tài xế...
      </div>
    );
  }

  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-ticket border border-muted-border bg-ink text-paper">
      <span className="font-mono text-sm">{snapshot.lat.toFixed(5)}, {snapshot.lng.toFixed(5)}</span>
      <span className="text-xs text-paper/70">Còn khoảng {snapshot.etaMinutes} phút</span>
    </div>
  );
}
