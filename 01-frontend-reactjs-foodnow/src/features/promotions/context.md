# promotions

## Owns
- Promo code preview/validation against a cart (`PromoCodeInput`)
- Promo creation for vendors/admins (no dedicated page yet — see TODO)
- No dedicated route; consumed by `orders`' `CheckoutPage` via barrel import

## Consumed endpoints
`POST /promotions/validate` · `POST /promotions`

## Public exports (via index.ts)
Components: `PromoCodeInput`
Hooks: `useValidatePromotion`, `useCreatePromotion`

## TODO
- `CheckoutPage` (in `orders`) currently passes the raw promo code string straight into
  `POST /orders` without calling `useValidatePromotion` first — wire `PromoCodeInput` in there so the
  discount previews before the order is placed, and use `onApplied`'s `discountAmount` in the on-screen
  total instead of only the server-computed one after order creation.
- No vendor/admin "manage promotions" page yet (`POST /promotions` service + hook exist, unused).
