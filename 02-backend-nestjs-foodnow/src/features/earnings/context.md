# Earnings Feature

## Owns
- `driver_earnings`

## Summary
Driver payout records, credited when a delivery completes.

## Public API
- `EarningsService` (exported via `earnings.module.ts`)

## Routes (planned)
- GET /drivers/me/earnings

## Events
- Emits: none
- Listens: delivery.completed — from delivery, records payout
