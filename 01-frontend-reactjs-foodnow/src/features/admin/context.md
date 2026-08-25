# admin

## Owns
- Global order monitor, user approval/suspension
- Routes: `ROUTES.adminOrders`, `ROUTES.adminUsers`

## Consumed endpoints
`GET /admin/orders` · `PATCH /admin/users/:id/status`

`GET /admin/users` (used by `useAdminUsers`/`AdminUsersPage`) is **not** in API_SPEC.md — only the
status-update endpoint is documented. It's inferred to mirror `GET /admin/orders`'s listing shape;
confirm with the backend before shipping, since it may need to be added or may already exist under a
different path.

## Cross-feature reuse
Reuses `orders`' `Order` type and `AdminOrderRow` renders it — admin doesn't duplicate the order shape.

## Public exports (via index.ts)
Pages: `AdminOrdersPage`, `AdminUsersPage`
Hooks: `useAdminOrders`, `useAdminUsers`, `useUpdateUserStatus`
Components: `AdminOrderRow`, `UserApprovalRow`

## TODO
- `AdminOrdersPage` has no filter UI yet (`AdminOrderListParams` supports `status`/`restaurantId`/etc.,
  unused).
- Confirm the `GET /admin/users` endpoint with the backend (see note above) before relying on it.
