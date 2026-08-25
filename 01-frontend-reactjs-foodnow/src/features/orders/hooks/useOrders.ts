import { useQuery } from '@tanstack/react-query';
import { ordersService } from '../services/orders.service';
import type { OrderListParams } from '../types/orders.types';

export const useOrders = (params: OrderListParams = {}) =>
  useQuery({
    queryKey: ['orders', 'list', params],
    queryFn: () => ordersService.list(params),
  });
