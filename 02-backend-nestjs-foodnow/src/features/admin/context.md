# Admin Feature

## Owns
Nothing — no dedicated tables. Pure orchestration over `users` (owned by `users`) and `orders` (owned by `orders`), consumed via DI.

## Summary
Global account approval/suspension, account listing, and an unrestricted, filterable order list for `ADMIN`. Closes the routes that were previously unimplemented (`PATCH /admin/users/:id/status`, `GET /admin/orders` from `API_SPEC.md`; `GET /admin/users` added to match the frontend's `admin` feature, which had already scaffolded a consumer for it — see that feature's `context.md`).

## Public API
- `AdminService` (not exported — nothing else needs an admin orchestration layer)
  - `updateUserStatus(userId, dto)` → `UsersService.updateStatus`
  - `listUsers(query)` → `UsersService.listUsers`
  - `listOrders(query)` → `OrdersService.listForAdmin`

## Routes
- `PATCH /admin/users/:id/status` — approve (`ACTIVE`) or suspend (`SUSPENDED`) any account, including the `VENDOR`/`DRIVER` accounts that `users` registers as `PENDING`. Any `UserStatus` value is accepted; no transition table — an admin can set any status at any time.
- `GET /admin/users` — filterable by `status`/`role`/`search` (partial, case-insensitive match on `fullName`, same convention as `restaurants`' `search`). Not in `API_SPEC.md` — added here to back the frontend's `AdminUsersPage`; should be added to `API_SPEC.md`'s endpoint table alongside the other Admin routes.
- `GET /admin/orders` — like `GET /orders` for an `ADMIN` caller (no customer/vendor/driver scoping), but additionally filterable by `customerId`/`restaurantId`/`driverId`, not just `status`. Separate from `OrdersService.listOrders`'s role-scoped path (`orders.service.ts`'s `listForAdmin` builds its own unscoped `where` — it does not reuse `scopeWhereForRole`).

## Cross-feature integration
- Both guards (`JwtAuthGuard`, `RolesGuard` + `@Roles(Role.ADMIN)`) sit on the controller class, not per-route — every route here is admin-only by construction.
