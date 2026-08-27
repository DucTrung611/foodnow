# Delivery Feature

## Owns
- `deliveries`
- `driver_locations`

## Summary
Driver availability, nearby-order matching (pull + event-driven push), accept/pickup/complete, live GPS push, and customer-facing order tracking. Implemented in full for `API_SPEC.md`'s Delivery section, minus `GET /drivers/me/earnings` (see Deferred).

## Public API
- `DeliveryService` (exported via `delivery.module.ts`). Nothing currently consumes it via DI — exported for convention/future use (e.g. a future `earnings` feature listening to `delivery.completed` doesn't need DI, just `@OnEvent`).
- Injects `RestaurantsService.getById`, `UsersService.getAddressById`/`getProfile`, and several new cross-feature-internal `OrdersService` methods added in this pass: `getOrderUnchecked` (no access check — safe only because it's DI-only, never routed), `listByStatus`, `assignDriver`.

## Routes
- `PATCH /drivers/me/availability`, `POST /drivers/me/locations` — `drivers.controller.ts` (`@Controller('drivers/me')`).
- `GET /deliveries/available`, `POST /deliveries/:id/accept|pickup|complete` — `deliveries.controller.ts`. **`:id` is the order id**, not a delivery id — confirmed from the frontend's `useDeliveryActions.ts` (`acceptDelivery.mutate(offer.orderId)`); no delivery row exists yet at accept time anyway.
- `GET /orders/:id/tracking` — `order-tracking.controller.ts`, despite living in `delivery` (reads `driver_locations`, delivery-owned data) rather than `orders.controller.ts`.
- Driver online/offline is Redis presence (`drivers:online` set via `RedisService.sadd`/`srem`/`smembers`), not a DB column — ephemeral, no schema change needed.
- "Nearby unassigned orders" = `orders` with `status=READY_FOR_PICKUP` and no `deliveries` row yet, distance = Haversine from the driver's last-pushed `driver_locations` point to the **restaurant** (not the delivery address — driver travels there to pick up first). No location on file yet → empty list. `estimatedEarning` reuses the order's own `deliveryFee`.
- `accept`/`pickup`/`complete` reuse `OrdersService.updateStatus`'s already-built safety-critical state machine (optimistic lock, `canAdvance`'s `READY_FOR_PICKUP→ON_THE_WAY`/`ON_THE_WAY→DELIVERED` DRIVER rules, `order:status_changed` emit) rather than re-implementing it — this feature only owns the `deliveries` row's own `status`/`pickupTime`/`deliveryTime`.

## Event-driven offer push
`OrdersService.updateStatus` emits `order.ready_for_pickup` (`EventEmitter2`) whenever a transition lands on `READY_FOR_PICKUP`. `delivery.listener.ts`'s `@OnEvent('order.ready_for_pickup')` finds online drivers (Redis), filters by radius using each one's last known location, and pushes `driver:new_offer` to matches via the gateway. `DELIVERY_4001` ("No available driver in radius") has no HTTP call site anywhere in this pass — the closest analogue is this fire-and-forget listener finding zero matches, which just logs and emits nothing (no response to attach an error code to).

`confirmComplete` also emits `delivery.completed` (customer/driver ids + amounts) for the future `earnings` feature — forward-compatible per `ARCHITECTURE.md`'s documented example, even though nothing listens yet.

## Socket.IO (`delivery.gateway.ts`, namespace `realtime`, own JWT handshake auth)
`delivery:assigned`/`delivery:location` target the same `order:<id>` rooms `orders.gateway.ts` manages — rooms are a Socket.IO primitive, not a NestJS DI concept, so this gateway emits to them directly without importing anything from `orders`.

**Circular-DI note**: `DeliveryGateway` does **not** inject `DeliveryService` (which itself injects `DeliveryGateway` to emit `delivery:assigned`/`driver:new_offer` — the reverse dependency would be circular). Its `driver:location_update` handler instead calls the same plain, DI-free helper functions (`utils/location-push.util.ts`'s `persistDriverLocation`/`computeLocationBroadcast`) that `DeliveryService.pushLocation` uses, injecting the same lower-level dependencies (`DeliveryRepository`, `OrdersService`, `UsersService`, `ConfigService`) directly instead.

## PostGIS + schema note
`driver_locations.location` is `Unsupported("geography(Point,4326)")` — raw `$queryRaw`/`$executeRaw` only, same pattern as `restaurants`/`addresses`. **`driver_locations.order_id` is a misnomer**: per the actual migration FK (`driver_locations_order_id_fkey`), it references `deliveries.id`, not `orders.id`, despite the column name. The public API's `orderId` field (in `POST /drivers/me/locations`, `driver:location_update`) is always an *order* id — `delivery.repository.ts`/`utils/location-push.util.ts` resolve it to the corresponding delivery's id before writing, and reverse the lookup for `GET /orders/:id/tracking`.

## Deferred (not in this pass)
- `GET /drivers/me/earnings` — reads `driver_earnings`, owned by the not-yet-built `earnings` feature (per `ARCHITECTURE.md`'s folder list). The frontend's `delivery.service.ts` already calls it; stays unimplemented here.
- `POST /orders/:id/cancel` doesn't notify `delivery` — an in-progress `deliveries` row isn't marked `CANCELLED` when its order is cancelled. Would need `orders` to emit an `order.cancelled`-shaped event for `delivery` to listen to.
- DRIVER ownership on `accept`/`pickup`/`complete` is enforced (`delivery.driverId === caller` after acceptance), but nothing stops two drivers racing to `accept` the same order simultaneously beyond the `uq_deliveries_order` unique constraint surfacing as an unhandled 500 in that exact race window — acceptable at this scale, not retried/locked explicitly.
- Frontend fix needed: `delivery.types.ts`'s `DeliveryStatus` uses `'COMPLETED'`, but the real Prisma enum (and this implementation) uses `DELIVERED` — same class of gap as `OrderStatus` was for the `orders` pass, now confirmed against the actual backend enum.

## Events
- Emits: `order.ready_for_pickup` (from `orders`, listened to here), `delivery.completed` (from here, for the future `earnings` feature)
- Listens: `order.ready_for_pickup`
