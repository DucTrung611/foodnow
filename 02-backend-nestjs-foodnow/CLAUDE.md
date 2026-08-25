# Backend: FoodNow
## Tech Stack
  - NestJS (REST + Socket.IO): feature modules mirror `DATABASE.md` entity groups 1:1 — `orders/` owns `orders`, `order_items`, `order_status_history` and nothing else writes to them
  - TypeScript: type safety, better DX, catch errors early
  - Prisma (PostgreSQL + PostGIS): `$transaction()` for multi-table writes (e.g. order + order_items), `$queryRaw` with `ST_DWithin` for geo search — confined to repository classes only
  - Redis + BullMQ: cache client and async queues (e.g. `delivery/queues/driver-matching.queue.ts`) share one connection from `core/`
  - EventEmitter2: internal event bus for cross-feature fire-and-forget — `order.confirmed` → `delivery` starts driver matching, `delivery.completed` → `earnings` records payout, without direct repository imports
  - class-validator: DTO validation via global `ValidationPipe({ whitelist: true, transform: true })` — controllers never validate manually
  - Socket.IO: gateways emit to rooms (`order:<orderId>`, `driver:<driverId>`) only after the DB transaction commits, authenticated with the same `JwtAuthGuard` as REST

## Documentation
### Must Read
- @docs/PROJECT-RULES.md - Conventions, patterns, MUST/MUST NOT
- @docs/ARCHITECTURE.md - Folder structure, request flow, cross-feature communication

### Reference
- @../00-docs/API_SPEC.md - API contract to expose
- @../00-docs/DATABASE.md - Data model reference, entity-to-feature ownership

## Quick Reference
### Feature Location
`src/features/<name>/` - Each feature owns its controller, service, repository, gateway, dto, entities, types; `src/shared/` - Guards, decorators, interceptors, filters, common utils (no infra ownership); `src/core/` - Stateful infrastructure (Prisma, Redis, Logger), instantiated once app-wide

### Public Exports
Every feature exports only through `<name>.module.ts` and `<name>.service.ts` — no direct imports between features

## Skills
- **`testing`** (`.claude/skills/testing/`) — use whenever writing or running tests here. Jest + `@nestjs/testing`; unit specs in `src/features/<feature>/tests/<name>.spec.ts`, e2e in `test/<name>.e2e-spec.ts`. Service tests mock the repository, controller tests mock the service — never mock `PrismaService` directly inside a service test.
