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
