import { useMutation, useQueryClient } from '@tanstack/react-query';
import { restaurantsService } from '../services/restaurants.service';
import type { CreateMenuItemPayload } from '../types/restaurants.types';

export const useCreateMenuItem = (restaurantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMenuItemPayload) => restaurantsService.createMenuItem(restaurantId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurants', 'menu', restaurantId] }),
  });
};

export const useUpdateMenuItem = (restaurantId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateMenuItemPayload> }) =>
      restaurantsService.updateMenuItem(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restaurants', 'menu', restaurantId] }),
  });
};
