# Orders Feature

## Owns
- `carts`, `cart_items`
- `orders`, `order_items`, `order_item_options`, `order_status_history`

## Summary
Server-backed cart, checkout (price snapshot), order list/detail, safety-critical status transitions (optimistic-locked), cancellation, and the `realtime` Socket.IO namespace. Implemented in full for everything in `API_SPEC.md`'s Cart & Orders section.

## Public API
- `OrdersService` (exported via `orders.module.ts`).
- Injects `RestaurantsService` (`getById`, `getMenu`, `getMenuItemById`), `UsersService` (`getAddressById`), and `PromotionsService` (`validate`, `recordUsage`) via DI — never their repositories.

## Routes
- `GET/POST/PATCH/DELETE /cart`, `/cart/items/:id` — CUSTOMER only. Live in `cart.controller.ts` (separate from `orders.controller.ts`, matching the `restaurants`/`menu-items` two-controller split).
- `POST /orders` — CUSTOMER. Resolves every `menuItemId`/`optionIds` against a single `RestaurantsService.getMenu()` call (no per-item RPC). `promotionCode`, if provided, is validated via `PromotionsService.validate()` (subtotal computed first, since the promo check needs it) and folded into `totalAmount`; usage is recorded via `PromotionsService.recordUsage()` *after* the order-creation transaction commits, unawaited (fire-and-forget — a failure there means undercounted usage, never a broken order). `deliveryFee` is distance-based (`shared/utils/geo.util.ts`'s Haversine + `order.baseDeliveryFee`/`order.perKmDeliveryFee` config). Clears the customer's cart in the same DB transaction as order creation.
- `GET /orders` — Any, role-scoped: CUSTOMER sees their own, VENDOR sees orders for restaurants they own (`restaurant.ownerId` Prisma relation filter — no cross-feature call needed), DRIVER sees orders assigned to them, ADMIN sees all (no dedicated `/admin/orders` restriction implemented yet).
- `GET /orders/:id` — owner customer / restaurant-owner vendor / assigned driver / admin, via `utils/order-access.util.ts`'s `hasOrderAccess` (also reused by the gateway's `order:subscribe` check, see below).
- `PATCH /orders/:id/status` — stage-scoped state machine in `utils/order-status-transitions.util.ts`: VENDOR drives `PENDING→CONFIRMED→PREPARING→READY_FOR_PICKUP` (must own the restaurant), DRIVER drives `READY_FOR_PICKUP→ON_THE_WAY→DELIVERED`, ADMIN can do any of the above. `CANCELLED` is deliberately absent from this map — it only happens via `POST /orders/:id/cancel`. Optimistic lock (`version`): `409 ORDER_3009` on mismatch, `422 ORDER_3008` on an invalid transition.
- `POST /orders/:id/cancel` — CUSTOMER (own order) or ADMIN, only while status is one of `PENDING`/`CONFIRMED`/`PREPARING` (else `422 ORDER_3008`).

## Socket.IO (`orders.gateway.ts`, namespace `realtime`)
- `handleConnection` verifies the JWT from `client.handshake.auth.token` directly via the globally-provided `JwtService`/`ConfigService` (same secret as `JwtAuthGuard`) — no separate WS guard class.
- `order:subscribe` joins `order:<orderId>` only if `hasOrderAccess` passes (fetches the order via `OrdersRepository` directly — the gateway is same-feature, not a cross-feature import).
- `emitOrderCreated`/`emitStatusChanged`/`emitCancelled` are called by `OrdersService` **after** its write transaction commits, never inside one. Payloads mirror the REST response DTOs, matching API_SPEC's socket rules.

## Deferred (not in this pass)
- DRIVER status transitions don't check `order.driverId === caller` yet — `delivery`'s driver-assignment isn't implemented, so any authenticated DRIVER can currently advance `READY_FOR_PICKUP`/`ON_THE_WAY` for any order. Tighten once `delivery` assigns drivers.
- `GET /orders` for ADMIN is unscoped (sees everything) since `/admin/orders` isn't a separate implemented feature yet.
- Cart's "no row yet" state is represented as a synthetic `{ id: '', restaurantId: null, items: [] }` rather than `404` — `carts.restaurant_id` is `NOT NULL` in the schema, so a cart can't be persisted before its first item; matches the frontend's non-nullable `Cart` type.

## Schema note
`order_items.note` was added in migration `20260826120000_add_note_to_order_items` — the initial schema/`DATABASE.md` had no column for the per-item note that both `API_SPEC.md`'s `POST /orders` example and the frontend's `OrderItem.note` expect. The order-level `note` (top of `CreateOrderDto`) has nowhere on `orders` to live either, so it's stored as the `note` on the initial `PENDING` `order_status_history` row instead — `orders` itself still has no `note` column, unchanged.

## Events
- Emits: none via `EventEmitter2` (Socket.IO only, see above) — no other feature listens for order lifecycle changes yet (future: `order.confirmed` → `delivery` driver matching, once that feature exists).
- Listens: none
