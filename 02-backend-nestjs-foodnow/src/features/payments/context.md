# Payments Feature

## Owns
- `payments`
- `payment_transactions`

## Summary
Idempotent order payment, payment status, and refunds. No real PSP is wired
up yet — `utils/payment-provider.util.ts` simulates the provider round-trip
(CASH always succeeds; CARD/WALLET succeed unless `paymentToken` is the
sentinel test value `tok_decline`). Swap that util for a real client without
touching `PaymentsService`'s call sites.

## Public API
- `PaymentsService` (exported via `payments.module.ts`)
  - `payOrder(user, orderId, idempotencyKey, dto)` — idempotent charge
  - `getPaymentById(user, id)`
  - `refundPayment(id, dto)`

## Routes
- `POST /orders/:id/pay` (`OrderPaymentController`, CUSTOMER) — requires
  `Idempotency-Key` header (UUID)
- `GET /payments/:id` (`PaymentsController`, CUSTOMER/ADMIN)
- `POST /payments/:id/refund` (`PaymentsController`, ADMIN)

## Idempotency
Same `Idempotency-Key` + same payload (`orderId`/`method`/`paymentToken`,
snapshotted in `payment_transactions.raw_response.requestPayload`) replays
the original result (including a repeated `402` if the original charge was
declined) without hitting the provider again. Same key + different payload
→ `409 PAYMENT_5002`. A concurrent duplicate-key race (two requests racing
past the `findTransactionByIdempotencyKey` check) is caught via the unique
constraint on `idempotency_key` and resolved by replaying instead of
crashing. An order that already has a `PAID` payment short-circuits to that
payment regardless of the key, so a retried request with a *new* key still
can't double-charge.

## Error codes (beyond API_SPEC.md's table)
- `PAYMENT_5000` (404) — Payment not found
- `PAYMENT_5003` (422) — Payment is not in a refundable state (only `PAID`
  payments can be refunded)

## Events
- Emits: `payment:updated` — Socket.IO, room `order:<id>`, on every charge
  and refund outcome (success or decline)
- Listens: none
