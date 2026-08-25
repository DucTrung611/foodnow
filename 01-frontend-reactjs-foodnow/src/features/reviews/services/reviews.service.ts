import { apiClient, unwrap } from '@/shared/services/client';
import type { PaginatedResult } from '@/shared/types';
import type { CreateReviewPayload, Review, ReviewListParams } from '../types/reviews.types';

export const reviewsService = {
  create: (orderId: string, payload: CreateReviewPayload) =>
    unwrap<Review>(apiClient.post(`/orders/${orderId}/reviews`, payload)),

  listByRestaurant: (restaurantId: string, params: ReviewListParams = {}) =>
    unwrap<PaginatedResult<Review>>(apiClient.get(`/restaurants/${restaurantId}/reviews`, { params })),
};
