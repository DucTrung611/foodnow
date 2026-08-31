/**
 * PENDING/PREPARING/DELIVERED/CANCELLED are confirmed by API_SPEC.md §7 examples
 * and the cancel endpoint. CONFIRMED/READY_FOR_PICKUP/ON_THE_WAY are inferred to
 * cover the vendor-accept and driver pickup/en-route steps — confirm against the
 * backend Prisma enum once the orders module lands there.
 */
export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderItemOption = {
  id: string;
  optionNameSnapshot: string;
  optionPriceSnapshot: string;
};

export type OrderItem = {
  id: string;
  menuItemId: string;
  itemNameSnapshot: string;
  itemPriceSnapshot: string;
  quantity: number;
  subtotal: string;
  note: string | null;
  options: OrderItemOption[];
};

export type OrderStatusHistoryEntry = {
  id: string;
  status: OrderStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: string;
};

export type Order = {
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
  placedAt: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistoryEntry[];
};

export type CreateOrderItemPayload = {
  menuItemId: string;
  quantity: number;
  optionIds: string[];
  note?: string;
};

export type CreateOrderPayload = {
  restaurantId: string;
  deliveryAddressId: string;
  promotionCode?: string;
  note?: string;
  items: CreateOrderItemPayload[];
};

/** Same shape `POST /orders/quote` returns — subtotal/deliveryFee/discountAmount/totalAmount, no write. */
export type OrderQuote = {
  subtotal: string;
  deliveryFee: string;
  discountAmount: string;
  totalAmount: string;
};

/** Client must send the version it last read — API_SPEC.md §7 optimistic lock contract. */
export type UpdateOrderStatusPayload = {
  status: OrderStatus;
  version: number;
  note?: string;
};

export type OrderListParams = {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sort?: string;
};

export type CartItemOption = {
  id: string;
  name: string;
  extraPrice: string;
};

export type CartItem = {
  id: string;
  menuItemId: string;
  name: string;
  basePrice: string;
  quantity: number;
  selectedOptions: CartItemOption[];
  note: string | null;
};

export type Cart = {
  id: string;
  restaurantId: string | null;
  items: CartItem[];
};

export type AddCartItemPayload = {
  menuItemId: string;
  quantity: number;
  optionIds: string[];
  note?: string;
};

export type UpdateCartItemPayload = {
  quantity?: number;
  note?: string;
};
