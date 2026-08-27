import { apiClient, unwrap, unwrapPaginated } from '@/shared/services/client';
import type { CreateReviewPayload, Review, ReviewListParams } from '../types/reviews.types';

export const reviewsService = {
  create: (orderId: string, payload: CreateReviewPayload) =>
    unwrap<Review>(apiClient.post(`/orders/${orderId}/reviews`, payload)),

  listByRestaurant: (restaurantId: string, params: ReviewListParams = {}) =>
    unwrapPaginated<Review>(apiClient.get(`/restaurants/${restaurantId}/reviews`, { params })),
};
