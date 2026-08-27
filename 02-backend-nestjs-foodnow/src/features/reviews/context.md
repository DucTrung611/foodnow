# Reviews Feature

## Owns
- `reviews`

## Summary
Post-order rating of restaurant and driver. One review per order (`uq_reviews_order`), only postable once the order is `DELIVERED`, only by the order's own customer.

## Public API
- `ReviewsService` (exported via `reviews.module.ts`)
  - `createReview(user, orderId, dto)`
  - `listByRestaurant(restaurantId, query)`

## Routes
- `POST /orders/:id/reviews` (`OrderReviewController`, CUSTOMER) — lives here
  despite the `/orders` prefix, same cross-feature-URL pattern as
  `delivery`'s `OrderTrackingController` / `payments`' `OrderPaymentController`
- `GET /restaurants/:id/reviews` (`RestaurantReviewsController`, Public)

## Cross-feature integration
- Injects `OrdersService.getOrderById()` for the DELIVERED-status + ownership
  check (re-checked explicitly in the service even though the controller
  already restricts the route to CUSTOMER — same defense-in-depth pattern as
  `DeliveryService.getTracking`).
- After creating a review, recomputes the restaurant's average rating from
  its own `reviews` rows and writes it via `RestaurantsService.updateAvgRating()`
  — reviews owns the rating data, restaurants owns the `avg_rating` column,
  so neither feature reaches into the other's table directly.

## Error codes (beyond API_SPEC.md's table)
- `REVIEW_7001` (422) — Order is not yet reviewable (must be `DELIVERED`)
- `REVIEW_7002` (409) — Order has already been reviewed

## Events
- Emits: none
- Listens: none
