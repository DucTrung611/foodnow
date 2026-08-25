import { useQuery } from '@tanstack/react-query';
import { deliveryService } from '../services/delivery.service';

export const useDriverEarnings = () =>
  useQuery({
    queryKey: ['drivers', 'me', 'earnings'],
    queryFn: deliveryService.getEarnings,
  });
