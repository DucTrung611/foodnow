# Project: FoodNow

## Overview
A food delivery platform. Customers browse nearby restaurants (geo search), build a cart, checkout, pay, and track their order live; vendors manage restaurant menus and incoming orders; drivers receive delivery offers, push live location, and get paid out; admins approve users and monitor orders globally. Order status and driver location are broadcast live over Socket.IO.

## Tech Stack
  - Frontend: React 19 (Vite), TypeScript, Tailwind CSS
  - Backend: NestJS v11, TypeScript, Prisma
  - Database: PostgreSQL 16 + PostGIS (geo queries) · Redis 7+ (cache, BullMQ queues)

## Structure
```
├── 01-frontend-reactjs-foodnow/  → @01-frontend-reactjs-foodnow/CLAUDE.md
├── 02-backend-nestjs-foodnow/    → @02-backend-nestjs-foodnow/CLAUDE.md
└── 00-docs/                      → Shared documentation
```

## Shared Docs
- @00-docs/API_SPEC.md
- @00-docs/DATABASE.md

## Important
- Follow existing patterns in codebase
- Feature naming stays consistent across layers: frontend `features/<name>/`, backend `features/<name>/`, and `DATABASE.md` entity groupings all use the same name (e.g. `orders`, `restaurants`, `delivery`)
- The ordering flow is safety-critical: order status transitions are validated server-side and broadcast via Socket.IO (`order:status_changed`) — never write client logic that assumes a status transition without waiting for the server-confirmed event
