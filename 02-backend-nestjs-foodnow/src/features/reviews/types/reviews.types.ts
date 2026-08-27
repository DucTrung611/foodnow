/** Shared contract between ReviewsService and ReviewsRepository for `createReview`. */
export type CreateReviewData = {
  orderId: string;
  customerId: string;
  restaurantId: string | null;
  driverId: string | null;
  rating: number;
  comment?: string;
};
