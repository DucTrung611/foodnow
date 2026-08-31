import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/admin.service';
import type { AdminOrderListParams, AdminRestaurantListParams } from '../types/admin.types';

export const useAdminOrders = (params: AdminOrderListParams = {}) =>
  useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => adminService.listOrders(params),
  });

/** Powers the restaurant filter dropdown on AdminOrdersPage. */
export const useAdminRestaurants = (params: AdminRestaurantListParams = {}) =>
  useQuery({
    queryKey: ['admin', 'restaurants', params],
    queryFn: () => adminService.listRestaurants(params),
  });
