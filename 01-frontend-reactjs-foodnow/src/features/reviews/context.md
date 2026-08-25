# reviews

## Owns
- Post-delivery rating (`ReviewForm`) and display (`ReviewCard`)
- No dedicated route — meant to be embedded in `orders`' `OrderDetailPage` (after delivery) and
  `restaurants`' `RestaurantDetailPage` (review list), both still TODO

## Data model note
`uq_reviews_order` (DATABASE.md) means **one review row per order** — a single `rating` (1-5) +
`comment`, not separate restaurant/driver ratings, even though the endpoint description says "rate
restaurant + driver". `restaurantId`/`driverId` are just denormalized references to who was involved.

## Consumed endpoints
`POST /orders/:id/reviews` · `GET /restaurants/:id/reviews`

## Public exports (via index.ts)
Components: `ReviewForm`, `ReviewCard`
Hooks: `useCreateReview`, `useRestaurantReviews`

## TODO
- Wire `ReviewForm` into `orders`' `OrderDetailPage` when `status === 'DELIVERED'`.
- Wire `useRestaurantReviews` + `ReviewCard` list into `restaurants`' `RestaurantDetailPage`.
