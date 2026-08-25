import { apiClient, unwrap } from '@/shared/services/client';
import type { PaginatedResult, User } from '@/shared/types';
import type { Order } from '@/features/orders';
import type { AdminOrderListParams, AdminUserListParams, UpdateUserStatusPayload } from '../types/admin.types';

export const adminService = {
  listOrders: (params: AdminOrderListParams) => unwrap<PaginatedResult<Order>>(apiClient.get('/admin/orders', { params })),

  // See types/admin.types.ts — GET /admin/users is inferred, not in API_SPEC.md.
  listUsers: (params: AdminUserListParams) => unwrap<PaginatedResult<User>>(apiClient.get('/admin/users', { params })),

  updateUserStatus: (id: string, payload: UpdateUserStatusPayload) =>
    unwrap<User>(apiClient.patch(`/admin/users/${id}/status`, payload)),
};
