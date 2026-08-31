export { CheckoutPage } from './pages/CheckoutPage';
export { OrderListPage } from './pages/OrderListPage';
export { OrderDetailPage } from './pages/OrderDetailPage';
export { VendorOrdersPage } from './pages/VendorOrdersPage';

export { OrderCard } from './components/OrderCard';
export { OrderStatusTimeline } from './components/OrderStatusTimeline';
export { CartItemRow } from './components/CartItemRow';
export { CartBadge } from './components/CartBadge';

export { useCart, useAddCartItem, useUpdateCartItem, useRemoveCartItem, useClearCart } from './hooks/useCart';
export { useOrders } from './hooks/useOrders';
export { useOrder } from './hooks/useOrder';
export { useCreateOrder } from './hooks/useCreateOrder';
export { useOrderQuote } from './hooks/useOrderQuote';
export { useUpdateOrderStatus } from './hooks/useUpdateOrderStatus';
export { useCancelOrder } from './hooks/useCancelOrder';
export { useOrderStatusSocket } from './hooks/useOrderStatusSocket';

export { useCartDraftStore } from './stores/cart.store';

export { ordersService } from './services/orders.service';
export { cartService } from './services/cart.service';

export { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE, nextStatusInSequence } from './utils/order-status';

export type {
  Order,
  OrderStatus,
  OrderItem,
  OrderItemOption,
  OrderStatusHistoryEntry,
  CreateOrderPayload,
  CreateOrderItemPayload,
  UpdateOrderStatusPayload,
  OrderListParams,
  Cart,
  CartItem,
  CartItemOption,
  AddCartItemPayload,
  UpdateCartItemPayload,
  OrderQuote,
} from './types/orders.types';
