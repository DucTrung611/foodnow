import { useQuery } from '@tanstack/react-query';
import { restaurantsService } from '../services/restaurants.service';

export const useRestaurant = (id: string) =>
  useQuery({
    queryKey: ['restaurants', 'detail', id],
    queryFn: () => restaurantsService.getById(id),
    enabled: Boolean(id),
  });

export const useMyRestaurant = () =>
  useQuery({
    queryKey: ['restaurants', 'mine'],
    queryFn: () => restaurantsService.getMine(),
  });

export const useRestaurantMenu = (id: string) =>
  useQuery({
    queryKey: ['restaurants', 'menu', id],
    queryFn: () => restaurantsService.getMenu(id),
    enabled: Boolean(id),
  });
