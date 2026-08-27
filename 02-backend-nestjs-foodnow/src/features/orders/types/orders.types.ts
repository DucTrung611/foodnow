import { OrderStatus } from '../../../generated/prisma/enums';
export { OrderStatus } from '../../../generated/prisma/enums';

export type ResolvedOrderItem = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  note?: string;
  options: { id: string; name: string; extraPrice: number }[];
};

/** Unscoped filter for `OrdersService.listForAdmin` — access control is the caller's job. */
export type AdminOrderFilter = {
  page?: number;
  limit?: number;
  sort?: string;
  status?: OrderStatus;
  customerId?: string;
  restaurantId?: string;
  driverId?: string;
};
