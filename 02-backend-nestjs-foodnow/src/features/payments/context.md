# Payments Feature

## Owns
- `payments`
- `payment_transactions`

## Summary
Idempotent order payment, payment status, and refunds.

## Public API
- `PaymentsService` (exported via `payments.module.ts`)

## Routes (planned)
- POST /orders/:id/pay
- GET /payments/:id
- POST /payments/:id/refund

## Events
- Emits: payment:updated — Socket.IO, room order:<id>
- Listens: none
