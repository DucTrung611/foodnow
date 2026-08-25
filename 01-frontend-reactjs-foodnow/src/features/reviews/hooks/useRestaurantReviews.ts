import { useQuery } from '@tanstack/react-query';
import { reviewsService } from '../services/reviews.service';
import type { ReviewListParams } from '../types/reviews.types';

export const useRestaurantReviews = (restaurantId: string, params: ReviewListParams = {}) =>
  useQuery({
    queryKey: ['reviews', 'restaurant', restaurantId, params],
    queryFn: () => reviewsService.listByRestaurant(restaurantId, params),
    enabled: Boolean(restaurantId),
  });
