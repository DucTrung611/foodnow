# delivery

## Owns
- Driver availability toggle, incoming offers, accept/pickup/complete actions
- Live GPS push (driver side) and live tracking (customer side)
- Driver earnings summary (no separate "payouts" frontend feature exists, and it's driver-specific,
  so it lives here rather than in `payments`)
- Routes: `ROUTES.driverOffers`, `ROUTES.driverEarnings`, `ROUTES.orderTracking`

## Consumed endpoints
`PATCH /drivers/me/availability` · `GET /deliveries/available` · `POST /deliveries/:id/accept` ·
`POST /deliveries/:id/pickup` · `POST /deliveries/:id/complete` · `POST /drivers/me/locations` ·
`GET /orders/:id/tracking` · `GET /drivers/me/earnings`

Socket: emits `driver:location_update` (throttled 1/5s, `useLocationPush`); listens for
`driver:new_offer` (`useDriverOfferSocket`) and `delivery:location` (`useOrderTracking`).

## Public exports (via index.ts)
Pages: `DriverOffersPage`, `DriverEarningsPage`, `OrderTrackingPage`
Hooks: `useSetDriverAvailability`, `useAvailableDeliveries`, `useAcceptDelivery`, `usePickupDelivery`,
`useCompleteDelivery`, `useLocationPush`, `useDriverOfferSocket`, `useOrderTracking`, `useDriverEarnings`
Components: `DriverOfferCard`, `DeliveryTrackingMap`

## TODO
- `DeliveryTrackingMap` is a coordinate/ETA placeholder — swap in a real map SDK (Mapbox/Goong Maps)
  once one is chosen; the data hook (`useOrderTracking`) is already wired for it.
- `DeliveryStatus` values are inferred from the accept/pickup/complete action names, not a confirmed
  backend enum — reconcile once the delivery module lands on the backend.
- `DriverOffersPage`'s online toggle doesn't yet gate whether `useLocationPush` is active — it always
  pushes location while geolocation permission is granted; should only push while online.
