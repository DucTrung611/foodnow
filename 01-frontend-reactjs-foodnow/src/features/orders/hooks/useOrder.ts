import { useQuery } from '@tanstack/react-query';
import { ordersService } from '../services/orders.service';

export const useOrder = (id: string) =>
  useQuery({
    queryKey: ['orders', 'detail', id],
    queryFn: () => ordersService.getById(id),
    enabled: Boolean(id),
  });
