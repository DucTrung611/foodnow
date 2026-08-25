import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '../services/delivery.service';

export const useAvailableDeliveries = () =>
  useQuery({
    queryKey: ['deliveries', 'available'],
    queryFn: deliveryService.listAvailable,
    refetchInterval: 15_000,
  });
