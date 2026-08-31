# Restaurants Feature

## Owns
- `restaurants`
- `categories`
- `menu_items`
- `menu_item_option_groups` (read-only in this pass)
- `menu_item_options` (read-only in this pass)

## Summary
Geo search + detail + menu for customers, and restaurant/category/menu-item CRUD for vendors. Implemented in full for everything in `API_SPEC.md`'s Restaurants & Menu section.

## Public API
- `RestaurantsService` (exported via `restaurants.module.ts`) — consumed by `orders`/`promotions` for restaurant/menu-item lookups during checkout (via DI, never `RestaurantsRepository` directly). `getById(id)` and `getMenu(restaurantId)` resolve order-creation line items against the in-memory menu tree; `getMenuItemById(id)` (no restaurant context needed) resolves cart mutations, which only receive a bare `menuItemId` from the client. `updateAvgRating(restaurantId, avgRating)` is a write-only entry point for `reviews` — it recomputes the average from its own `reviews` rows and hands the number here, since `restaurants` owns the `avg_rating` column but not the rating data.

## Routes
- `GET /restaurants` — Public. Geo search via PostGIS `ST_DWithin`/`ST_Distance`. `lat`/`lng` are **required** query params (no default) — a missing value fails `RestaurantSearchQueryDto` validation and the global pipe/filter auto-resolve it to `COMMON_9000`, matching the spec's "Missing lat/lng → COMMON_9000" without any manual check. `radius` defaults to `restaurant.defaultSearchRadiusMeters` (env `RESTAURANT_DEFAULT_RADIUS_METERS`, default 5000m). `status` defaults to `ACTIVE`. `sort` supports `distance` (default), `-avgRating`/`avgRating`, `-createdAt`/`createdAt`.
- `GET /restaurants/me` — VENDOR. Resolves the caller's own restaurant by `owner_id` server-side (404 `RESTAURANT_2001` if they don't own one). Registered before `GET /restaurants/:id` in the controller so Express doesn't match `me` as an `:id`. Added because the frontend's vendor menu page was previously guessing a restaurant id from the vendor's *user* id (UX-AUDIT-REPORT.md §2.3).
- `GET /restaurants/:id` — Public. 404 `RESTAURANT_2001` if missing.
- `GET /restaurants/:id/menu` — Public. Categories → menu items → option groups → options, one tree.
- `POST /restaurants` — VENDOR. Always created `status: PENDING`, `ownerId` from the JWT.
- `PATCH /restaurants/:id` — VENDOR, owner only (`AUTH_1003` if not the owner). Bumps `version` on every write.
- `POST /restaurants/:id/categories` — VENDOR, owner only. `sortOrder` defaults to the current category count (append at the end).
- `POST /restaurants/:id/menu-items` — VENDOR, owner only. `categoryId` must belong to the same restaurant, else 404 ("Category not found").
- `PATCH /menu-items/:id`, `DELETE /menu-items/:id` — VENDOR, owner of the item's restaurant only. Live in `menu-items.controller.ts` since their routes aren't nested under `/restaurants/:id` (matches `restaurants.service.ts`'s frontend contract).

## PostGIS note
`restaurants.location` is `Unsupported("geography(Point,4326)")` — same as `addresses` in the `users` feature. Every restaurant read/write goes through `$queryRaw`/`$executeRaw` in `restaurants.repository.ts` (`RESTAURANT_COLUMNS` sql fragment, `ST_MakePoint`/`ST_X`/`ST_Y`), never plain `prisma.restaurant.*`. `categories`/`menu_items`/`menu_item_option_groups`/`menu_item_options` have no geography column, so those use plain Prisma Client calls with `include`.

## Events
- Emits: none
- Listens: none

## Deferred (not in this pass)
- No dedicated endpoints for creating/editing `menu_item_option_groups`/`menu_item_options` — not in `API_SPEC.md`'s endpoint table or the frontend's `restaurants.service.ts`. The read path (`GET /restaurants/:id/menu`) already returns them, so a future PR only needs to add the write endpoints + DTOs.
- Restaurant/menu-item photos: `image_url` (nullable string) exists on both tables now — `create`/`update` DTOs accept it, response DTOs return it, and the frontend renders it with an emoji-icon fallback when absent (UX-AUDIT-REPORT.md's "add photos" fix). What's still missing is the spec's generic `multipart/form-data` upload endpoint — a vendor can only set `imageUrl` by pasting a URL, not uploading a file. Seed data (`prisma/seed.ts`) backfills all 6 demo restaurants with `picsum.photos` placeholder URLs; menu items are left `null` (not seeded per-item).
