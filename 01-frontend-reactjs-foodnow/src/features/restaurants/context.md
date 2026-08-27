# restaurants

## Owns
- Geo search & discovery (`/`, `/restaurants`, `/restaurants/:id`)
- Vendor menu CRUD (`/vendor/menu`) — categories, menu items, option groups
- Routes: `ROUTES.home`, `ROUTES.restaurants`, `ROUTES.restaurantDetail`, `ROUTES.vendorMenu`

## Consumed endpoints (API_SPEC.md §6)
`GET /restaurants` · `GET /restaurants/:id` · `GET /restaurants/:id/menu` · `POST /restaurants` ·
`PATCH /restaurants/:id` · `POST /restaurants/:id/categories` · `POST /restaurants/:id/menu-items` ·
`PATCH /menu-items/:id` · `DELETE /menu-items/:id`

## Public exports (via index.ts)
Pages: `HomePage`, `RestaurantListPage`, `RestaurantDetailPage`, `VendorMenuPage`
Hooks: `useRestaurants`, `useRestaurant`, `useRestaurantMenu`, `useCreateMenuItem`, `useUpdateMenuItem`
Components: `RestaurantCard`, `MenuItemRow`, `MenuItemOptionsModal`
Service: `restaurantsService` (only for feature-internal reuse; prefer hooks)
Utils: `calculateMenuItemUnitPrice`, `isOptionGroupSatisfied` (`utils/menu-item-price.ts`)

## Add-to-cart (`MenuItemRow`)
`RestaurantDetailPage` renders each menu item through `MenuItemRow`, which is the only place this
feature reaches into `orders` (via the barrel: `import { useAddCartItem } from '@/features/orders'`,
the sanctioned cross-feature pattern — see ARCHITECTURE-FRONTEND.md §5). Two paths, driven by whether
the item has `optionGroups`:
- **No options** — clicking "Thêm" adds the item straight away with `quantity: 1`. The backend never
  merges duplicate `cart_items` rows for the same `menuItemId` (`OrdersRepository.createCartItem`
  always inserts), so repeated clicks intentionally create separate cart lines rather than
  client-side-incrementing a shared quantity — matches what the API actually does. Quantity per line
  is then adjusted in `CheckoutPage` via the existing `CartItemRow` stepper.
- **Has options** — clicking "Tùy chỉnh" opens `MenuItemOptionsModal` (radio for `maxSelect === 1`
  groups, checkboxes otherwise, capped at `maxSelect`). "Thêm vào giỏ" stays disabled until every
  group with `minSelect > 0` is satisfied (`isOptionGroupSatisfied`).
- Unauthenticated clicks redirect to `/login` instead of hitting the API (`useCart`/cart mutations
  require a session; `RestaurantDetailPage` itself is a public route).
- `!item.isAvailable` disables the button and shows a "Hết món" badge — `isAvailable` existed on the
  `MenuItem` type already but was unused in the UI before this.
- Error toasts (`CART_3001` mixed-restaurant, etc.) are wired at the hook level in
  `orders/hooks/useCart.ts`'s `useAddCartItem`, not per-caller — same pattern as `useCreateOrder`.

## TODO
- `VendorMenuPage` is read-only scaffolding — wire `useCreateMenuItem`/`useUpdateMenuItem` into an
  editable category/item form, and add option-group editing (there's also no `POST` endpoint for
  option groups/options yet on the backend — see `02-backend-nestjs-foodnow`'s restaurants
  `context.md`'s Deferred section).
- `RestaurantListPage` geo search currently only sends `lat/lng/radius` when geolocation succeeds;
  add a manual address/city filter fallback.
