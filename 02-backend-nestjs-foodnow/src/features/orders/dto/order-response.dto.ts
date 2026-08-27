import { OrderStatus } from '../../../generated/prisma/enums';

export class OrderItemOptionResponseDto {
  id: string;
  optionNameSnapshot: string;
  optionPriceSnapshot: string;
}

export class OrderItemResponseDto {
  id: string;
  menuItemId: string;
  itemNameSnapshot: string;
  itemPriceSnapshot: string;
  quantity: number;
  subtotal: string;
  note: string | null;
  options: OrderItemOptionResponseDto[];
}

export class OrderStatusHistoryResponseDto {
  id: string;
  status: OrderStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: Date;
}

export class OrderResponseDto {
  id: string;
  orderCode: string;
  customerId: string;
  restaurantId: string;
  driverId: string | null;
  deliveryAddressId: string;
  status: OrderStatus;
  subtotal: string;
  deliveryFee: string;
  discountAmount: string;
  totalAmount: string;
  version: number;
  placedAt: Date;
  items: OrderItemResponseDto[];
  statusHistory?: OrderStatusHistoryResponseDto[];
}
