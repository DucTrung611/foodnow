# PROJECT-RULES.md — Backend

## Tech Stack
- **Language:** TypeScript
- **Framework:** NestJS (REST + Socket.IO)
- **ORM:** Prisma (PostgreSQL + PostGIS)

## 1. Feature Structure

```
src/features/orders/
├── orders.controller.ts        # HTTP routes only
├── orders.gateway.ts           # Socket.IO events (if realtime)
├── orders.service.ts           # business logic
├── orders.repository.ts        # all Prisma calls
├── dto/
│   ├── create-order.dto.ts
│   └── order-response.dto.ts
├── entities/orders.entity.ts   # domain model (not Prisma model)
├── types/orders.types.ts
├── utils/order-code.util.ts
├── orders.module.ts            # NestJS module wiring
├── tests/orders.service.spec.ts
└── context.md                  # what this feature owns + public API
```

Every feature exports **only** through `orders.module.ts` and `orders.service.ts`. Everything else is internal.

## 2. Naming Conventions

| Item | Style | Example |
|---|---|---|
| Feature folders | kebab-case | `driver-locations/` |
| Files | `<name>.<role>.ts` | `orders.service.ts`, `create-order.dto.ts` |
| Classes | PascalCase + role suffix | `OrdersService`, `CreateOrderDto` |
| Functions/methods | camelCase, verb-first | `assignDriver()`, `calculateSubtotal()` |
| Variables | camelCase | `deliveryFee` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_DELIVERY_RADIUS_KM` |
| Types / Interfaces | PascalCase, **no `I` prefix** | `OrderSnapshot`, `DriverMatchResult` |
| Enums | PascalCase name, SCREAMING values | `OrderStatus.READY_FOR_PICKUP` |

## 3. Feature Rules

- A feature owns its tables, its DTOs, its business rules. Nothing else reaches inside it.
- **No direct imports between features.**

```ts
// ❌ DON'T
import { PrismaOrderRepository } from '../orders/orders.repository';

// ✅ DO — inject the public service via the module
constructor(private readonly ordersService: OrdersService) {}
```

- Cross-feature communication, in order of preference:
  1. **Events** (`EventEmitter2`) for fire-and-forget: `order.confirmed` → delivery feature listens and starts driver matching.
  2. **Injected public service** when a synchronous answer is needed (`PaymentsService.charge()`).
  3. **Shared service** in `src/shared/` when logic belongs to no single feature.
- **Shared code location:** `src/shared/` (guards, interceptors, filters, `PrismaService`, `RedisService`, base DTOs, common utils). `src/config/` for env-driven config.

## 4. Code Patterns (MUST follow)

**Error handling** — throw Nest HTTP exceptions from services; never return error objects.
```ts
// ✅ DO
if (!restaurant) throw new NotFoundException('Restaurant not found');
if (result.count === 0) throw new ConflictException('Order was modified, retry');

// ❌ DON'T
return { success: false, error: 'not found' };
```

**Validation** — `class-validator` on DTOs, global `ValidationPipe({ whitelist: true, transform: true })`. Never validate manually in controllers.
```ts
export class CreateOrderDto {
  @IsUUID() restaurantId: string;
  @IsUUID() deliveryAddressId: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
```

**Logging** — Nest `Logger` scoped per class, structured context, never `console.log`.
```ts
private readonly logger = new Logger(OrdersService.name);
this.logger.log(`Order ${orderId} confirmed by restaurant ${restaurantId}`);
```
Never log payment payloads, tokens, or `password_hash`.

**Response format** — uniform envelope via global interceptor; controllers return plain data.
```ts
{ "data": { ... }, "meta": { "page": 1, "total": 42 } }   // success
{ "statusCode": 409, "message": "Order was modified, retry", "path": "/orders/:id" } // error
```

## 5. Anti-patterns (MUST NOT do)

| ❌ DON'T | ✅ DO |
|---|---|
| `import { OrderEntity } from '../orders/entities/...'` | Inject `OrdersService`, or move the type to `shared/` |
| Feature A imports B **and** B imports A | Break the cycle with an event (`order.delivered`) |
| Price/discount math inside `orders.controller.ts` | All logic in `OrdersService`; controller only maps DTO → service call |
| `this.prisma.order.findMany()` inside a service | Call `this.ordersRepository.findByCustomer()` |
| `const RADIUS = 5000;` in a service file | `this.config.get('DELIVERY_RADIUS_METERS')` |
| Reading Prisma models directly in DTO responses | Map to a response DTO — never leak `password_hash` or internal `version` |

## 6. Git Workflow

- **Branch:** `<type>/<feature>-<short-desc>` → `feat/orders-driver-matching`, `fix/payments-idempotency-race`
- **Commit:** Conventional Commits with feature scope → `feat(orders): add optimistic locking on status update`
- **PR requirements:** one feature per PR · migrations in a separate commit · tests pass · no `any` · `context.md` updated when the feature's public API changes.

## 7. Testing

- **Location:** `src/features/<feature>/tests/`
- **Naming:** `<name>.spec.ts` (unit), `<name>.e2e-spec.ts` (integration, in `/test`)
- **Structure:** Arrange–Act–Assert; mock the repository in service tests, mock the service in controller tests.
```ts
describe('OrdersService.confirmOrder', () => {
  it('throws ConflictException when version is stale', async () => { /* ... */ });
});
```
- **Coverage:** services ≥80%, repositories ≥60%, controllers smoke-tested. Money, idempotency, and status-transition logic require explicit test cases — no exceptions.

## NestJS-Specific Additions

- **Module wiring:** each feature has its own `@Module`; export only the public service. Use `forwardRef()` only as a last resort — prefer events.
- **Guards:** `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.VENDOR)`. Never check `req.user.role` inline in a controller.
- **Interceptors/Filters:** register globally in `main.ts` (`TransformInterceptor`, `AllExceptionsFilter`) — not per-controller.
- **Prisma:** `PrismaService` lives in `shared/`, injected **only** into repository classes. Transactions via `prisma.$transaction()` inside the repository.
- **PostGIS:** raw geo queries (`ST_DWithin`) live in the repository using `$queryRaw` with parameterized values — never string-interpolated.
- **Socket.IO:** gateways emit to rooms only (`order:<orderId>`, `driver:<driverId>`); auth via the same JWT guard as REST.
- **Config:** `@nestjs/config` with a validated schema; `process.env` is never read outside `src/config/`.
