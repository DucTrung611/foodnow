import { useQuery } from '@tanstack/react-query';
import { paymentsService } from '../services/payments.service';

export const usePayment = (id: string) =>
  useQuery({
    queryKey: ['payments', 'detail', id],
    queryFn: () => paymentsService.getById(id),
    enabled: Boolean(id),
  });
