import type { Role, UserStatus } from '@/shared/types';
import type { OrderStatus } from '@/features/orders';

export type AdminOrderListParams = {
  page?: number;
  limit?: number;
  sort?: string;
  status?: OrderStatus;
  restaurantId?: string;
  customerId?: string;
  driverId?: string;
};

/**
 * `GET /admin/users` isn't in API_SPEC.md (only `PATCH /admin/users/:id/status`
 * is documented) — inferred to mirror `GET /admin/orders`'s listing pattern.
 * Confirm with backend before relying on it.
 */
export type AdminUserListParams = {
  page?: number;
  limit?: number;
  status?: UserStatus;
  role?: Role;
  search?: string;
};

export type UpdateUserStatusPayload = {
  status: UserStatus;
};
