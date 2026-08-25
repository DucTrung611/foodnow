# payments

## Owns
- Idempotent order payment (`PayOrderPanel`, embedded in `orders`' `OrderDetailPage` while
  `status === 'PENDING'`), payment status polling, refund (admin)
- No dedicated route — payments has no page of its own in ARCHITECTURE-FRONTEND.md's routing table;
  it's consumed by `orders` via a barrel import (the documented "genuine reuse across features" path)

## Consumed endpoints
`POST /orders/:id/pay` (requires `Idempotency-Key` header) · `GET /payments/:id` · `POST /payments/:id/refund`

Socket: listens for `payment:updated` on the order room (`usePaymentSocket`).

## Idempotency contract (API_SPEC.md §3, §7)
`usePayOrder(orderId)` generates one `Idempotency-Key` (UUID) per hook instance via `useRef` and
reuses it across retries of the same mount — a network-failure retry replays the same key (safe,
returns the original charge), while a genuinely new attempt requires remounting (e.g. leaving and
returning to the order). Never regenerate the key on every submit click — that would defeat the
duplicate-charge guard.

## Public exports (via index.ts)
Components: `PaymentMethodSelector`, `PayOrderPanel`
Hooks: `usePayOrder`, `usePayment`, `usePaymentSocket`

## TODO
- `PaymentMethod`/`PaymentStatus` unions are inferred (only `CARD` is confirmed by API_SPEC.md) —
  reconcile against the backend Prisma enum once the payments module is implemented there.
- No card-tokenization UI yet — `paymentToken` is passed through as an optional field for when a
  provider SDK (Stripe/VNPay/MoMo) is wired in.
