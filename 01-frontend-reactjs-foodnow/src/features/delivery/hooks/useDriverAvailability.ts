import { useMutation } from '@tanstack/react-query';
import { deliveryService } from '../services/delivery.service';

export const useSetDriverAvailability = () =>
  useMutation({
    mutationFn: (isAvailable: boolean) => deliveryService.setAvailability(isAvailable),
  });
