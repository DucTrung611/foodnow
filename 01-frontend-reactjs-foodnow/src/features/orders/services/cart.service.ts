import { apiClient, unwrap } from '@/shared/services/client';
import type { AddCartItemPayload, Cart, UpdateCartItemPayload } from '../types/orders.types';

export const cartService = {
  get: () => unwrap<Cart>(apiClient.get('/cart')),
  addItem: (payload: AddCartItemPayload) => unwrap<Cart>(apiClient.post('/cart/items', payload)),
  updateItem: (id: string, payload: UpdateCartItemPayload) => unwrap<Cart>(apiClient.patch(`/cart/items/${id}`, payload)),
  removeItem: (id: string) => unwrap<Cart>(apiClient.delete(`/cart/items/${id}`)),
  clear: () => apiClient.delete('/cart'),
};
