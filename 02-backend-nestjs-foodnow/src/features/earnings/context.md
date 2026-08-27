# Earnings Feature

## Owns
- `driver_earnings`

## Summary
Driver payout records, credited when a delivery completes. Amount credited
equals the order's `deliveryFee`. No payout/mark-as-paid endpoint exists yet
— not in `API_SPEC.md`, so rows stay `PENDING` until an admin payout flow is
added.

## Public API
- `EarningsService` (exported via `earnings.module.ts`)
  - `getSummary(driverId, limit?)` — total pending/paid + recent earnings
  - `recordEarning(driverId, deliveryId, amount)` — called by `EarningsListener`

## Routes
- `GET /drivers/me/earnings` (DRIVER)

## Events
- Emits: none
- Listens: `delivery.completed` — from `delivery`; injects `OrdersService.getOrderUnchecked()` to read the order's `deliveryFee`, then records a `PENDING` `DriverEarning`. Fire-and-forget: a failure here only logs, it never surfaces to the driver or blocks delivery completion.
