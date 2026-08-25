# Delivery Feature

## Owns
- `deliveries`
- `driver_locations`

## Summary
Driver availability, delivery assignment/pickup/completion, and live location tracking.

## Public API
- `DeliveryService` (exported via `delivery.module.ts`)

## Routes (planned)
- PATCH /drivers/me/availability
- GET /deliveries/available
- POST /deliveries/:id/accept
- POST /deliveries/:id/pickup
- POST /deliveries/:id/complete
- POST /drivers/me/locations
- GET /orders/:id/tracking

## Events
- Emits: delivery:assigned — Socket.IO, room order:<id>; delivery:location — Socket.IO, room order:<id>; driver:new_offer — Socket.IO, room driver:<id>; delivery.completed — EventEmitter2, internal (earnings listens)
- Listens: order.confirmed — from orders, starts driver matching
