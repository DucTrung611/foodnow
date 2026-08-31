# API_SPEC.md

## 1. Overview
- **Base URL:** `https://api.foodnow.app/api/v1` · local: `http://localhost:3000/api/v1`
- **Versioning:** URI versioning via NestJS `app.enableVersioning({ type: VersioningType.URI })`. Breaking changes → `/api/v2`; additive changes stay in v1.
- **Content-Type:** `application/json; charset=utf-8` (all endpoints except file upload → `multipart/form-data`)
- **Timestamps:** ISO 8601 UTC (`2026-08-24T10:30:00.000Z`)
- **Money:** decimal string (`"125000.00"`), never float — matches `@db.Decimal(10,2)`
- **IDs:** UUID v4 strings

## 2. Authentication
- **Method:** JWT (access + refresh), stateless. Refresh token JTI stored in Redis for revocation.
- **Header:** `Authorization: Bearer <access_token>`
- **Token flow:**

| Token | TTL | Storage (client) | Purpose |
|---|---|---|---|
| access_token | 15m | memory | every authenticated request |
| refresh_token | 7d | httpOnly cookie | `POST /auth/refresh` → new pair |

```
POST /auth/login → { accessToken, refreshToken, user }
401 AUTH_1001 (expired) → POST /auth/refresh → retry original request
POST /auth/logout → refresh JTI blacklisted in Redis
```

- **Auth errors:** `401` missing/invalid/expired token · `403` valid token, wrong role (`RolesGuard`). Never reveal whether an email exists on login failure — always `AUTH_1002`.

## 3. Request Conventions

**Pagination / sorting / filtering (query params):**
```
GET /restaurants?page=1&limit=20&sort=-avgRating&status=ACTIVE&lat=21.0245&lng=105.8412&radius=5000
```
| Param | Default | Notes |
|---|---|---|
| `page` | 1 | 1-indexed |
| `limit` | 20 | max 100 |
| `sort` | feature-specific | `-` prefix = DESC (`-createdAt`) |
| `search` | — | partial match on name |
| `lat` / `lng` / `radius` | — | radius in meters, PostGIS `ST_DWithin` |

- **Body:** camelCase JSON keys (mapped to `snake_case` columns by Prisma). Unknown fields rejected by `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`.
- **Idempotency:** `Idempotency-Key: <uuid>` header **required** on `POST /orders/:id/pay`; stored in `payment_transactions.idempotency_key`.
- **File upload:** `multipart/form-data`, field `file`, max 5MB, `image/jpeg|png|webp` only → returns `{ url }`.

## 4. Response Format

**Success**
```json
{
  "success": true,
  "data": { "id": "8f14e45f-...", "orderCode": "FN-240824-0042" },
  "meta": { "page": 1, "limit": 20, "total": 137, "totalPages": 7 }
}
```
`meta` present only on list endpoints. Applied globally by `TransformInterceptor`.

**Error**
```json
{
  "success": false,
  "error": {
    "code": "ORDER_3009",
    "message": "Order was modified by another party, please retry",
    "details": [{ "field": "version", "issue": "stale" }]
  },
  "path": "/api/v1/orders/8f14e45f/status",
  "timestamp": "2026-08-24T10:30:00.000Z"
}
```
Applied globally by `AllExceptionsFilter`. `details` is `null` unless validation or conflict info exists.

## 5. Error Codes

**Format:** `[FEATURE]_[4-DIGIT]` — feature prefix maps 1:1 to `src/features/` folders.

| Range | Feature | Prefix |
|---|---|---|
| 1000 | Auth / Users | `AUTH_`, `USER_` |
| 2000 | Restaurants & Menu | `RESTAURANT_`, `MENU_` |
| 3000 | Cart & Orders | `CART_`, `ORDER_` |
| 4000 | Delivery | `DELIVERY_` |
| 5000 | Payments | `PAYMENT_` |
| 6000 | Promotions | `PROMO_` |
| 7000 | Reviews | `REVIEW_` |
| 9000 | Common / system | `COMMON_` |

| Code | HTTP | Message |
|---|---|---|
| `COMMON_9000` | 400 | Validation failed |
| `COMMON_9001` | 429 | Too many requests |
| `COMMON_9002` | 500 | Internal server error |
| `AUTH_1001` | 401 | Access token expired |
| `AUTH_1002` | 401 | Invalid credentials |
| `AUTH_1003` | 403 | Insufficient role permission |
| `USER_1010` | 409 | Email or phone already registered |
| `RESTAURANT_2001` | 404 | Restaurant not found |
| `RESTAURANT_2002` | 422 | Restaurant is closed |
| `MENU_2010` | 422 | Menu item unavailable |
| `CART_3001` | 422 | Cart contains items from another restaurant |
| `ORDER_3005` | 404 | Order not found |
| `ORDER_3008` | 422 | Invalid status transition |
| `ORDER_3009` | 409 | Optimistic lock conflict — retry |
| `DELIVERY_4001` | 422 | No available driver in radius |
| `PAYMENT_5000` | 404 | Payment not found |
| `PAYMENT_5001` | 402 | Payment declined by provider |
| `PAYMENT_5002` | 409 | Duplicate idempotency key with different payload |
| `PAYMENT_5003` | 422 | Payment is not in a refundable state |
| `PROMO_6001` | 422 | Promotion expired or usage limit reached |
| `PROMO_6002` | 409 | Promotion code already exists |
| `REVIEW_7001` | 422 | Order is not yet reviewable (must be DELIVERED) |
| `REVIEW_7002` | 409 | Order has already been reviewed |

**HTTP status usage:** `200` read/update · `201` create · `204` delete · `400` malformed · `401` unauthenticated · `403` unauthorized role · `404` not found · `409` conflict/lock · `422` business rule violation · `429` rate limited.

## 6. Endpoints by Feature

### Auth & Users
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register (role: CUSTOMER/VENDOR/DRIVER) | Public |
| POST | `/auth/login` | Login, returns token pair | Public |
| POST | `/auth/refresh` | Rotate token pair, returns `{ accessToken, user }` | Refresh token |
| POST | `/auth/logout` | Revoke refresh token | Any |
| GET | `/users/me` | Current profile | Any |
| PATCH | `/users/me` | Update profile | Any |
| GET | `/users/me/addresses` | List addresses | CUSTOMER |
| POST | `/users/me/addresses` | Add address (lat/lng) | CUSTOMER |
| PATCH | `/users/me/addresses/:id` | Update / set default | CUSTOMER |
| DELETE | `/users/me/addresses/:id` | Remove address | CUSTOMER |

### Restaurants & Menu
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/restaurants` | Search by geo radius, category, rating | Public |
| GET | `/restaurants/me` | Caller's own restaurant | VENDOR |
| GET | `/restaurants/:id` | Detail + opening hours | Public |
| GET | `/restaurants/:id/menu` | Categories + items + option groups | Public |
| POST | `/restaurants` | Register restaurant (status: PENDING) | VENDOR |
| PATCH | `/restaurants/:id` | Update info | VENDOR (owner) |
| POST | `/restaurants/:id/categories` | Create category | VENDOR (owner) |
| POST | `/restaurants/:id/menu-items` | Create menu item | VENDOR (owner) |
| PATCH | `/menu-items/:id` | Update item / toggle availability | VENDOR (owner) |
| DELETE | `/menu-items/:id` | Remove item | VENDOR (owner) |

### Cart & Orders
| Method | Path | Description | Auth |
|---|---|---|---|
| GET | `/cart` | Current cart | CUSTOMER |
| POST | `/cart/items` | Add item + selected options | CUSTOMER |
| PATCH | `/cart/items/:id` | Change quantity / note | CUSTOMER |
| DELETE | `/cart/items/:id` | Remove item | CUSTOMER |
| DELETE | `/cart` | Clear cart | CUSTOMER |
| POST | `/orders` | Place order (price snapshot) | CUSTOMER |
| POST | `/orders/quote` | Preview subtotal/deliveryFee/discount/total, no write | CUSTOMER |
| GET | `/orders` | List own orders (role-scoped) | Any |
| GET | `/orders/:id` | Order detail + items + history | Owner/Vendor/Driver/Admin |
| PATCH | `/orders/:id/status` | Advance status (optimistic lock) | VENDOR / DRIVER / ADMIN |
| POST | `/orders/:id/cancel` | Cancel with reason | CUSTOMER / ADMIN |

### Delivery
| Method | Path | Description | Auth |
|---|---|---|---|
| PATCH | `/drivers/me/availability` | Toggle online/offline | DRIVER |
| GET | `/deliveries/available` | Nearby unassigned orders | DRIVER |
| GET | `/deliveries/active` | Caller's current in-progress delivery, `null` if none | DRIVER |
| POST | `/deliveries/:id/accept` | Accept assignment | DRIVER |
| POST | `/deliveries/:id/pickup` | Confirm pickup | DRIVER |
| POST | `/deliveries/:id/complete` | Confirm delivered | DRIVER |
| POST | `/drivers/me/locations` | Push GPS point (append-only) | DRIVER |
| GET | `/orders/:id/tracking` | Latest driver position | CUSTOMER (owner) |

### Payments · Promotions · Reviews · Earnings · Admin
| Method | Path | Description | Auth |
|---|---|---|---|
| POST | `/orders/:id/pay` | Charge (requires `Idempotency-Key`) | CUSTOMER |
| GET | `/orders/:id/payment` | Payment for this order, `null` if unpaid | CUSTOMER (owner) |
| GET | `/payments/:id` | Payment status | CUSTOMER / ADMIN |
| POST | `/payments/:id/refund` | Refund order | ADMIN |
| POST | `/promotions/validate` | Preview discount for a cart | CUSTOMER |
| POST | `/promotions` | Create promo (vendor or global) | VENDOR / ADMIN |
| POST | `/orders/:id/reviews` | Rate restaurant + driver | CUSTOMER |
| GET | `/restaurants/:id/reviews` | List reviews | Public |
| GET | `/drivers/me/earnings` | Earnings summary | DRIVER |
| GET | `/admin/orders` | All orders, filterable by `status`/`customerId`/`restaurantId`/`driverId` | ADMIN |
| GET | `/admin/users` | All users, filterable by `status`/`role`/`search` (partial match on `fullName`) | ADMIN |
| GET | `/admin/restaurants` | All restaurants, filterable by `search` (partial match on `name`), no `lat`/`lng` required | ADMIN |
| PATCH | `/admin/users/:id/status` | Approve / suspend account | ADMIN |

## 7. Endpoint Details

### POST /orders — Place order

```json
// Request
{
  "restaurantId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "deliveryAddressId": "9c1b2d3e-...",
  "promotionCode": "FREESHIP50",
  "note": "Không hành",
  "items": [
    {
      "menuItemId": "7d2f...",
      "quantity": 2,
      "optionIds": ["a1b2...", "c3d4..."],
      "note": "ít đá"
    }
  ]
}
```
```json
// 201 Created
{
  "success": true,
  "data": {
    "id": "8f14e45f-...",
    "orderCode": "FN-240824-0042",
    "status": "PENDING",
    "subtotal": "125000.00",
    "deliveryFee": "15000.00",
    "discountAmount": "15000.00",
    "totalAmount": "125000.00",
    "items": [
      { "itemNameSnapshot": "Trà sữa trân châu", "itemPriceSnapshot": "45000.00", "quantity": 2, "subtotal": "100000.00" }
    ],
    "placedAt": "2026-08-24T10:30:00.000Z"
  }
}
```
**Errors:** `RESTAURANT_2002` closed · `MENU_2010` item unavailable · `CART_3001` mixed restaurants · `PROMO_6001` promo invalid.
**Note:** all names/prices are snapshotted at write time — later menu edits never alter this order.

### PATCH /orders/:id/status — Advance status (optimistic locking)

```json
// Request — client must send the version it last read
{ "status": "PREPARING", "version": 3, "note": "Bếp đã nhận" }
```
```json
// 200 OK
{ "success": true, "data": { "id": "8f14e45f-...", "status": "PREPARING", "version": 4 } }
```
```json
// 409 Conflict — someone else updated first
{ "success": false, "error": { "code": "ORDER_3009", "message": "Order was modified by another party, please retry", "details": [{ "field": "version", "expected": 3, "actual": 4 }] } }
```
**Client contract:** on `409`, re-fetch `GET /orders/:id` and retry with the fresh version. Invalid transitions (e.g. `DELIVERED → PREPARING`) return `ORDER_3008`.

### POST /orders/:id/pay — Idempotent charge

```
Headers: Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
Body:    { "method": "CARD", "paymentToken": "tok_xxx" }
```
- Same key + same payload → returns the **original** result, no second charge.
- Same key + different payload → `409 PAYMENT_5002`.
- Provider decline → `402 PAYMENT_5001`, order stays `PENDING`.

### GET /restaurants — Geo search

```
GET /restaurants?lat=21.0245&lng=105.8412&radius=5000&sort=distance&page=1&limit=20
```
Backed by `ST_DWithin` + `ST_Distance` via `$queryRaw` in `RestaurantsRepository`. Each item includes `distanceMeters` and `isOpen` (derived from `opening_hours`). Missing `lat`/`lng` → `COMMON_9000`.

## Socket.IO Events

**Connection:** `wss://api.foodnow.app/realtime` · handshake auth `{ token: "<access_token>" }`, validated by the same `JwtAuthGuard`. Rooms are joined server-side after authorization — clients cannot join arbitrary rooms.

| Room | Who joins |
|---|---|
| `order:<orderId>` | order's customer, vendor, assigned driver |
| `restaurant:<restaurantId>` | vendor staff |
| `driver:<driverId>` | that driver only |
| `admin:global` | ADMIN role |

**Server → Client**
| Event | Room | Payload |
|---|---|---|
| `order:created` | `restaurant:<id>` | `{ orderId, orderCode, totalAmount, itemCount }` |
| `order:status_changed` | `order:<id>` | `{ orderId, status, version, changedAt }` |
| `order:cancelled` | `order:<id>` | `{ orderId, reason, cancelledBy }` |
| `delivery:assigned` | `order:<id>` | `{ deliveryId, driver: { id, fullName, phone } }` |
| `delivery:location` | `order:<id>` | `{ lat, lng, recordedAt, etaMinutes }` |
| `driver:new_offer` | `driver:<id>` | `{ orderId, distanceMeters, estimatedEarning, expiresAt }` |
| `payment:updated` | `order:<id>` | `{ orderId, paymentStatus }` |

**Client → Server**
| Event | Sender | Payload |
|---|---|---|
| `driver:location_update` | DRIVER | `{ lat, lng, orderId? }` — throttled to 1/5s; persisted append-only |
| `order:subscribe` | any | `{ orderId }` — server verifies ownership before joining |

**Rules:** events are emitted **after** the DB transaction commits, never inside it. Socket payloads mirror REST response DTOs (no raw Prisma models). Realtime is a delivery mechanism only — every event has a REST equivalent for reconnect/replay.
