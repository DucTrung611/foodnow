# Restaurants Feature

## Owns
- `restaurants`
- `categories`
- `menu_items`
- `menu_item_option_groups`
- `menu_item_options`

## Summary
Restaurant profiles, opening hours, geo search, categories, and menu items/options.

## Public API
- `RestaurantsService` (exported via `restaurants.module.ts`)

## Routes (planned)
- GET /restaurants
- GET /restaurants/:id
- GET /restaurants/:id/menu
- POST /restaurants
- PATCH /restaurants/:id
- POST /restaurants/:id/categories
- POST /restaurants/:id/menu-items
- PATCH /menu-items/:id
- DELETE /menu-items/:id

## Events
- Emits: none
- Listens: none
