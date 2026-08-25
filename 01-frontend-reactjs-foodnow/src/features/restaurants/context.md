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
Components: `RestaurantCard`
Service: `restaurantsService` (only for feature-internal reuse; prefer hooks)

## TODO
- `VendorMenuPage` is read-only scaffolding — wire `useCreateMenuItem`/`useUpdateMenuItem` into an
  editable category/item form, and add option-group editing.
- `RestaurantListPage` geo search currently only sends `lat/lng/radius` when geolocation succeeds;
  add a manual address/city filter fallback.
