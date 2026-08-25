import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/app/providers/SocketProvider';
import { deliveryService } from '../services/delivery.service';
import type { DeliveryTrackingSnapshot } from '../types/delivery.types';

const trackingKey = (orderId: string) => ['deliveries', 'tracking', orderId] as const;

export function useOrderTracking(orderId: string) {
  const socket = useSocket();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: trackingKey(orderId),
    queryFn: () => deliveryService.getTracking(orderId),
    enabled: Boolean(orderId),
  });

  useEffect(() => {
    if (!socket || !orderId) return;

    socket.emit('order:subscribe', { orderId });

    const handleLocation = (payload: DeliveryTrackingSnapshot & { orderId?: string }) => {
      queryClient.setQueryData(trackingKey(orderId), payload);
    };

    socket.on('delivery:location', handleLocation);
    return () => {
      socket.off('delivery:location', handleLocation);
    };
  }, [socket, orderId, queryClient]);

  return query;
}
