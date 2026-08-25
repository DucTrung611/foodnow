# Users Feature

## Owns
- `users`
- `addresses`

## Summary
Auth (register/login/refresh/logout), profile, and address management. Implemented in full — not a stub.

## Public API
- `UsersService` (exported via `users.module.ts`) — profile + address CRUD, consumed by other features via DI (never `UsersRepository` directly)
- `AuthService` is internal to this module (not exported); other features never need it — `JwtAuthGuard`/`RolesGuard` in `shared/guards/` verify tokens directly via the globally-provided `JwtService`, not via this feature's services

## Routes
- `POST /auth/register` — Public. Role must be `CUSTOMER`/`VENDOR`/`DRIVER` (not `ADMIN`). `CUSTOMER` accounts start `ACTIVE`; `VENDOR`/`DRIVER` start `PENDING` pending admin approval (`PATCH /admin/users/:id/status`, not yet implemented).
- `POST /auth/login` — Public. Returns `{ accessToken, user }` in the body; sets `refreshToken` as an httpOnly cookie (per API_SPEC's token-flow table — the flow diagram's shorthand `{accessToken, refreshToken, user}` is treated as informal, since the detailed table is explicit that refresh token storage is httpOnly-cookie-only).
- `POST /auth/refresh` — reads the `refreshToken` cookie, verifies it, checks its `jti` is still valid in Redis, rotates (old `jti` deleted, new one stored), returns a new `accessToken` and sets a new cookie.
- `POST /auth/logout` — Any (authenticated). Revokes the refresh token's `jti` in Redis, clears the cookie.
- `GET/PATCH /users/me` — Any (authenticated).
- `GET/POST /users/me/addresses`, `PATCH/DELETE /users/me/addresses/:id` — `CUSTOMER` only, per API_SPEC's auth column.

## Auth mechanics
- Access token: 15m (`JWT_ACCESS_EXPIRES_IN`), verified by `JwtAuthGuard` on every guarded route via `Authorization: Bearer`.
- Refresh token: 7d (`JWT_REFRESH_EXPIRES_IN`), httpOnly cookie only, one-time-use (rotated on every `/auth/refresh`, deleted on `/auth/logout`) — its `jti` is the source of truth in Redis (`refresh:<jti>` → `userId`), so a stolen-but-already-used or logged-out refresh token is rejected even if not yet expired.
- Passwords hashed with `bcrypt` (10 rounds).
- Error codes used: `USER_1010` (register conflict), `AUTH_1002` (bad login / suspended account — same code for both, matching the spec's "never reveal whether an email exists" rule), `AUTH_1001` (missing/invalid/expired access or refresh token), `AUTH_1003` (role check failed in `RolesGuard`).

## PostGIS note
`addresses.location` is an `Unsupported("geography(Point,4326)")` column — Prisma Client cannot read/write it at all. Every address read/write goes through `$queryRaw`/`$executeRaw` in `users.repository.ts` (never plain `prisma.address.*` calls), converting `lat`/`lng` ⇄ `ST_MakePoint`/`ST_X`/`ST_Y`. Raw SQL there always explicitly sets `updated_at = now()` too, since bypassing Prisma Client also bypasses its `@updatedAt` auto-touch.

## Events
- Emits: none
- Listens: none

## Deferred (not in this pass)
- `config/jwt.config.ts` values are wired but there's no `PATCH /admin/users/:id/status` yet (lives in a future `admin`-scoped feature or an addition here — not decided).
- No email/phone verification flow.
