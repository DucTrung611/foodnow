import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/app/providers/SocketProvider';
import type { Order, OrderStatus } from '../types/orders.types';

type OrderStatusChangedPayload = {
  orderId: string;
  status: OrderStatus;
  version: number;
  changedAt: string;
};

/**
 * Writes server-confirmed `order:status_changed` events into the query
 * cache. Components never see the socket — and the order's status only
 * ever changes here or via a direct mutation response, never assumed.
 */
export function useOrderStatusSocket(orderId: string) {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !orderId) return;

    socket.emit('order:subscribe', { orderId });

    const handleStatusChanged = (payload: OrderStatusChangedPayload) => {
      if (payload.orderId !== orderId) return;
      queryClient.setQueryData<Order>(['orders', 'detail', orderId], (prev) =>
        prev ? { ...prev, status: payload.status, version: payload.version } : prev,
      );
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
    };

    socket.on('order:status_changed', handleStatusChanged);
    return () => {
      socket.off('order:status_changed', handleStatusChanged);
    };
  }, [socket, orderId, queryClient]);
}
