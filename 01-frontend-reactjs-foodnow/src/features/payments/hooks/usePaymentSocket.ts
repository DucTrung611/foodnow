import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/app/providers/SocketProvider';

type PaymentUpdatedPayload = {
  orderId: string;
  paymentStatus: string;
};

/** Invalidates the order + payment queries when `payment:updated` arrives on the order room. */
export function usePaymentSocket(orderId: string) {
  const socket = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !orderId) return;

    const handlePaymentUpdated = (payload: PaymentUpdatedPayload) => {
      if (payload.orderId !== orderId) return;
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['payments', 'byOrder', orderId] });
    };

    socket.on('payment:updated', handlePaymentUpdated);
    return () => {
      socket.off('payment:updated', handlePaymentUpdated);
    };
  }, [socket, orderId, queryClient]);
}
