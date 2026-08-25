import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { AdminOrderListParams } from '../types/admin.types';

export const useAdminOrders = (params: AdminOrderListParams = {}) =>
  useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => adminService.listOrders(params),
  });
