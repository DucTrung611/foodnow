# orders

## Owns
- Cart (server-backed, `useCart`), checkout, order list/detail, order status timeline
- Vendor's incoming-orders view and status advancement
- Routes: `ROUTES.checkout`, `ROUTES.orders`, `ROUTES.orderDetail`, `ROUTES.vendorOrders`

## Consumed endpoints
`GET/POST/PATCH/DELETE /cart`, `/cart/items/:id` · `POST /orders` · `GET /orders` · `GET /orders/:id` ·
`PATCH /orders/:id/status` · `POST /orders/:id/cancel`

Socket: subscribes to `order:status_changed` via `useOrderStatusSocket` (emits `order:subscribe` first).

## Safety-critical rule (CLAUDE.md)
Order status transitions are validated **server-side only**. This feature never assumes a transition
succeeded before the server confirms it:
- `useUpdateOrderStatus` writes the new status into the query cache only `onSuccess` of the mutation
  response — never optimistically.
- On `409 ORDER_3009` (stale `version`), it does **not** retry automatically — it invalidates the
  detail query so the UI re-fetches the authoritative state, and shows a toast. The next action click
  reads the fresh `version` from cache.
- `utils/order-status.ts` deliberately has **no client-side "allowed transitions" map** — only a
  display-order sequence for the timeline UI and single "next status" helper for the vendor action
  button. Whether a transition is actually legal is entirely the server's call.
- `useOrderStatusSocket` only ever writes `order:status_changed` payloads into the cache — it doesn't
  infer status from other events.

## Cart mutation errors
`useAddCartItem` (in `useCart.ts`) toasts `mapErrorCode(error.code)` on failure — e.g. `CART_3001` when
the cart already holds items from a different restaurant. This is the entry point `restaurants`'
`MenuItemRow` calls via the barrel export; the other cart mutations (`useUpdateCartItem`,
`useRemoveCartItem`, `useClearCart`) don't have this yet since nothing surfaced a failure path for them.

## Cart architecture note
`stores/cart.store.ts` (Zustand) holds **only** client-local checkout draft state (current checkout
step, the promo-code input box) — the actual cart items are server state fetched via `useCart()`
(`GET /cart`) and never mirrored into Zustand, per PROJECT-RULES-FRONTEND.md §5's "server data never
goes into Zustand" rule.

## Public exports (via index.ts)
Pages: `CheckoutPage`, `OrderListPage`, `OrderDetailPage`, `VendorOrdersPage`
Hooks: `useCart` + cart mutations, `useOrders`, `useOrder`, `useCreateOrder`, `useUpdateOrderStatus`,
`useCancelOrder`, `useOrderStatusSocket`
Components: `OrderCard`, `OrderStatusTimeline`, `CartItemRow`

## TODO
- `OrderStatus` union includes `CONFIRMED`/`READY_FOR_PICKUP`/`ON_THE_WAY` as **inferred** states not
  yet confirmed against a backend enum (orders module isn't implemented on the backend yet) — reconcile
  `types/orders.types.ts` once `prisma/schema.prisma` defines the real `OrderStatus` enum.
- `CheckoutPage` doesn't call `POST /promotions/validate` before submit — promo code is passed through
  as-is and validated server-side inside `POST /orders`.
- No `useOptimistic`/`useTransition` yet for cart quantity changes (PROJECT-RULES-FRONTEND.md §React 19
  suggests this for the cart UX) — currently a plain mutation + refetch.
