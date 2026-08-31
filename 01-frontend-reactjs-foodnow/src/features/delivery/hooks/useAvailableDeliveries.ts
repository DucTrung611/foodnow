import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '../services/delivery.service';

export const useAvailableDeliveries = () =>
  useQuery({
    queryKey: ['deliveries', 'available'],
    queryFn: deliveryService.listAvailable,
    refetchInterval: 15_000,
  });

/** The driver's current in-progress delivery (`null` if none) — lets the UI
 * resume the pickup/complete flow after a reload instead of dead-ending
 * once an accepted order disappears from the offers list. */
export const useActiveDelivery = () =>
  useQuery({
    queryKey: ['deliveries', 'active'],
    queryFn: deliveryService.getActive,
  });
