import { apiClient, unwrap } from '@/shared/services/client';
import type { PaginatedResult } from '@/shared/types';
import type {
  CreateMenuItemPayload,
  CreateRestaurantPayload,
  MenuItem,
  Restaurant,
  RestaurantMenu,
  RestaurantSearchParams,
} from '../types/restaurants.types';

export const restaurantsService = {
  search: (params: RestaurantSearchParams) =>
    unwrap<PaginatedResult<Restaurant>>(apiClient.get('/restaurants', { params })),

  getById: (id: string) => unwrap<Restaurant>(apiClient.get(`/restaurants/${id}`)),

  getMenu: (id: string) => unwrap<RestaurantMenu>(apiClient.get(`/restaurants/${id}/menu`)),

  register: (payload: CreateRestaurantPayload) =>
    unwrap<Restaurant>(apiClient.post('/restaurants', payload)),

  update: (id: string, payload: Partial<CreateRestaurantPayload>) =>
    unwrap<Restaurant>(apiClient.patch(`/restaurants/${id}`, payload)),

  createCategory: (restaurantId: string, payload: { name: string; sortOrder?: number }) =>
    unwrap(apiClient.post(`/restaurants/${restaurantId}/categories`, payload)),

  createMenuItem: (restaurantId: string, payload: CreateMenuItemPayload) =>
    unwrap<MenuItem>(apiClient.post(`/restaurants/${restaurantId}/menu-items`, payload)),

  updateMenuItem: (id: string, payload: Partial<CreateMenuItemPayload>) =>
    unwrap<MenuItem>(apiClient.patch(`/menu-items/${id}`, payload)),

  deleteMenuItem: (id: string) => apiClient.delete(`/menu-items/${id}`),
};
