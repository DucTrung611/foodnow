import { useEffect, useState } from 'react';
import type { GeoPoint } from '@/shared/utils/geo';

type GeolocationState = {
  position: GeoPoint | null;
  error: string | null;
  loading: boolean;
};

export function useGeolocation(): GeolocationState {
  const [state, setState] = useState<GeolocationState>(() =>
    navigator.geolocation
      ? { position: null, error: null, loading: true }
      : { position: null, error: 'Trình duyệt không hỗ trợ định vị', loading: false },
  );

  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) =>
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          error: null,
          loading: false,
        }),
      (err) => setState({ position: null, error: err.message, loading: false }),
      { enableHighAccuracy: true },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return state;
}
