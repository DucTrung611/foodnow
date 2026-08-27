import { apiClient, unwrap, unwrapPaginated } from '@/shared/services/client';
import type { User } from '@/shared/types';
import type { Order } from '@/features/orders';
import type { AdminOrderListParams, AdminUserListParams, UpdateUserStatusPayload } from '../types/admin.types';

export const adminService = {
  listOrders: (params: AdminOrderListParams) => unwrapPaginated<Order>(apiClient.get('/admin/orders', { params })),

  listUsers: (params: AdminUserListParams) => unwrapPaginated<User>(apiClient.get('/admin/users', { params })),

  updateUserStatus: (id: string, payload: UpdateUserStatusPayload) =>
    unwrap<User>(apiClient.patch(`/admin/users/${id}/status`, payload)),
};
