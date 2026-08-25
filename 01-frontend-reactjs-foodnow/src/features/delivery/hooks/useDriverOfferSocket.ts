import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from '@/app/providers/SocketProvider';
import { useNotificationStore } from '@/shared/stores/notification.store';

/** Refetches the available-deliveries list when a `driver:new_offer` push arrives. */
export function useDriverOfferSocket() {
  const socket = useSocket();
  const queryClient = useQueryClient();
  const showToast = useNotificationStore((s) => s.showToast);

  useEffect(() => {
    if (!socket) return;

    const handleNewOffer = () => {
      showToast('info', 'Có đơn hàng mới gần bạn');
      queryClient.invalidateQueries({ queryKey: ['deliveries', 'available'] });
    };

    socket.on('driver:new_offer', handleNewOffer);
    return () => {
      socket.off('driver:new_offer', handleNewOffer);
    };
  }, [socket, queryClient, showToast]);
}
