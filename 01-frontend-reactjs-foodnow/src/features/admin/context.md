# admin

## Owns
- Global order monitor, user approval/suspension
- Routes: `ROUTES.adminOrders`, `ROUTES.adminUsers`

## Consumed endpoints
`GET /admin/orders` · `GET /admin/users` · `PATCH /admin/users/:id/status`

`GET /admin/users` is now implemented on the backend (`features/admin`) and documented in
API_SPEC.md, filterable by `status`/`role`/`search` — matching what this feature had already
inferred.

## Cross-feature reuse
Reuses `orders`' `Order` type and `AdminOrderRow` renders it — admin doesn't duplicate the order shape.

## Public exports (via index.ts)
Pages: `AdminOrdersPage`, `AdminUsersPage`
Hooks: `useAdminOrders`, `useAdminUsers`, `useUpdateUserStatus`
Components: `AdminOrderRow`, `UserApprovalRow`

## TODO
- `AdminOrdersPage` has no filter UI yet (`AdminOrderListParams` supports `status`/`restaurantId`/etc.,
  unused).
- `AdminUsersPage` has no filter UI yet either (`AdminUserListParams` supports `status`/`role`/`search`,
  unused) and no pagination controls (`meta` is fetched but never rendered/paged through).
