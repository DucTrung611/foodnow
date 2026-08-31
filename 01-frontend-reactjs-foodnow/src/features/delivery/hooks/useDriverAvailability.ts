import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deliveryService } from '../services/delivery.service';

const AVAILABILITY_KEY = ['drivers', 'me', 'availability'] as const;

/** Restores the toggle's real server-side state on load — it used to always
 * default to offline on reload even while still online server-side
 * (UX-AUDIT-REPORT.md §3.1). */
export const useDriverAvailability = () =>
  useQuery({
    queryKey: AVAILABILITY_KEY,
    queryFn: deliveryService.getAvailability,
  });

export const useSetDriverAvailability = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isAvailable: boolean) => deliveryService.setAvailability(isAvailable),
    onSuccess: (result) => queryClient.setQueryData(AVAILABILITY_KEY, result),
  });
};
