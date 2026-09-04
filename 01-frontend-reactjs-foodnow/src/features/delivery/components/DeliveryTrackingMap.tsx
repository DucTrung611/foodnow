import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { EmptyState } from '@/shared/components/ui';
import type { DeliveryTrackingSnapshot } from '../types/delivery.types';

type Point = { lat: number; lng: number };

type DeliveryTrackingMapProps = {
  snapshot: DeliveryTrackingSnapshot | undefined;
  destination?: Point;
};

// Custom pins (not Leaflet's default marker images, which need extra bundler
// config) that match the app's own tokens rather than generic map-blue.
const driverIcon = L.divIcon({
  className: '',
  html: '<span class="flex size-6 items-center justify-center rounded-full border-2 border-paper bg-primary shadow-float"><span class="size-2 rounded-full bg-paper"></span></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const destinationIcon = L.divIcon({
  className: '',
  html: '<span class="flex size-5 items-center justify-center rounded-full border-2 border-ink bg-paper"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

/** Imperatively re-fits the view when either point moves — MapContainer's own center/zoom props only apply on first mount. */
function FitBounds({ driver, destination }: { driver: Point; destination?: Point }) {
  const map = useMap();
  const destLat = destination?.lat;
  const destLng = destination?.lng;

  useEffect(() => {
    if (destLat === undefined || destLng === undefined) {
      map.setView([driver.lat, driver.lng], 15);
      return;
    }
    map.fitBounds(
      [
        [driver.lat, driver.lng],
        [destLat, destLng],
      ],
      { padding: [32, 32] },
    );
  }, [map, driver.lat, driver.lng, destLat, destLng]);

  return null;
}

export function DeliveryTrackingMap({ snapshot, destination }: DeliveryTrackingMapProps) {
  if (!snapshot) {
    return (
      <div className="flex h-64 items-center justify-center sm:h-80">
        <EmptyState title="Chưa có vị trí tài xế" description="Vị trí sẽ hiện khi tài xế bắt đầu di chuyển." />
      </div>
    );
  }

  const driver: Point = { lat: snapshot.lat, lng: snapshot.lng };

  return (
    <MapContainer center={[driver.lat, driver.lng]} zoom={15} scrollWheelZoom={false} className="h-64 w-full sm:h-80">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[driver.lat, driver.lng]} icon={driverIcon} />
      {destination && (
        <>
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon} />
          <Polyline
            positions={[
              [driver.lat, driver.lng],
              [destination.lat, destination.lng],
            ]}
            pathOptions={{ color: '#C1392B', weight: 2, dashArray: '6 6' }}
          />
        </>
      )}
      <FitBounds driver={driver} destination={destination} />
    </MapContainer>
  );
}
