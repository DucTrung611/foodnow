export { OrderStatus } from '../../../generated/prisma/enums';

export type ResolvedOrderItem = {
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  note?: string;
  options: { id: string; name: string; extraPrice: number }[];
};
