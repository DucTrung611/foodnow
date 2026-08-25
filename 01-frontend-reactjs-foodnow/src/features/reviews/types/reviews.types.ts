/**
 * `uq_reviews_order` (DATABASE.md) means exactly one review row per order —
 * a single rating/comment pair, with restaurantId/driverId as denormalized
 * references to who was involved, not two separate ratings.
 */
export type Review = {
  id: string;
  orderId: string;
  customerId: string;
  restaurantId: string | null;
  driverId: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type CreateReviewPayload = {
  rating: number;
  comment?: string;
};

export type ReviewListParams = {
  page?: number;
  limit?: number;
};
