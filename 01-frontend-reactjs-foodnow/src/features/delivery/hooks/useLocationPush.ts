import { useEffect, useRef } from 'react';
import { useSocket } from '@/app/providers/SocketProvider';
import { useGeolocation } from '@/shared/hooks/useGeolocation';

const THROTTLE_MS = 5_000;

/**
 * Pushes the driver's GPS position over the socket, throttled to 1/5s per
 * API_SPEC.md's `driver:location_update` contract. Uses the socket event
 * (not the REST /drivers/me/locations endpoint) for the live push.
 */
export function useLocationPush(orderId?: string) {
  const socket = useSocket();
  const { position } = useGeolocation();
  const lastSentAt = useRef(0);

  useEffect(() => {
    if (!socket || !position) return;
    const now = Date.now();
    if (now - lastSentAt.current < THROTTLE_MS) return;

    lastSentAt.current = now;
    socket.emit('driver:location_update', { lat: position.lat, lng: position.lng, orderId });
  }, [socket, position, orderId]);
}
