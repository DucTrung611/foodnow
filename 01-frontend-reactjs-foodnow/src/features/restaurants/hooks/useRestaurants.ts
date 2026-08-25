import { useQuery } from '@tanstack/react-query';
import { restaurantsService } from '../services/restaurants.service';
import type { RestaurantSearchParams } from '../types/restaurants.types';

export const useRestaurants = (params: RestaurantSearchParams) =>
  useQuery({
    queryKey: ['restaurants', 'list', params],
    queryFn: () => restaurantsService.search(params),
  });
