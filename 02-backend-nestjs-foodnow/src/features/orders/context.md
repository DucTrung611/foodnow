# Orders Feature

## Owns
- `carts`
- `cart_items`
- `orders`
- `order_items`
- `order_item_options`
- `order_status_history`

## Summary
Cart management and the order lifecycle: placement, status transitions (optimistic locking), cancellation.

## Public API
- `OrdersService` (exported via `orders.module.ts`)

## Routes (planned)
- GET /cart
- POST /cart/items
- PATCH /cart/items/:id
- DELETE /cart/items/:id
- DELETE /cart
- POST /orders
- GET /orders
- GET /orders/:id
- PATCH /orders/:id/status
- POST /orders/:id/cancel

## Events
- Emits: order:created — Socket.IO, room restaurant:<id>; order:status_changed — Socket.IO, room order:<id>; order:cancelled — Socket.IO, room order:<id>; order.confirmed — EventEmitter2, internal (delivery listens)
- Listens: none
