# Promotions Feature

## Owns
- `promotions`
- `promotion_usages`

## Summary
Promo code validation and creation (vendor-scoped or global). `PromotionsService.validate()` is called both from `POST /promotions/validate` (preview) and from `OrdersService.createOrder()` (real application) — one implementation, two call sites.

## Public API
- `PromotionsService` (exported via `promotions.module.ts`)
  - `validate(customerId, dto)` — throws `PROMO_6001` if the code is invalid/expired/over its usage limit; returns `{ id, code, discountAmount }` otherwise
  - `createPromotion(user, dto)` — VENDOR must own `restaurantId` (and can't create a restaurant-less/global promo); ADMIN can do either
  - `recordUsage(promotionId, customerId, orderId, discountApplied)` — fire-and-forget, called by `OrdersService` after its order-creation transaction commits

## Routes
- `POST /promotions/validate` (CUSTOMER)
- `POST /promotions` (VENDOR/ADMIN)

## Cross-feature integration
`OrdersService.createOrder()` injects `PromotionsService` directly (DI, not an event — the discount amount is needed synchronously to compute `totalAmount` before the order is written). Usage accounting (`recordUsage`) happens *after* order creation, unawaited — a failure there means undercounted usage, never a broken order.

## Error codes (beyond API_SPEC.md's table)
- `PROMO_6002` (409) — Promotion code already exists (unique constraint on `code`)

## Events
- Emits: none
- Listens: none
