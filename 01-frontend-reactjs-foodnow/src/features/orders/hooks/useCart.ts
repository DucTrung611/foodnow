import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/auth.store';
import { cartService } from '../services/cart.service';
import type { AddCartItemPayload, UpdateCartItemPayload } from '../types/orders.types';

const CART_KEY = ['cart'] as const;

export const useCart = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: CART_KEY,
    queryFn: cartService.get,
    enabled: isAuthenticated,
  });
};

export const useAddCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddCartItemPayload) => cartService.addItem(payload),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
  });
};

export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCartItemPayload }) => cartService.updateItem(id, payload),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
  });
};

export const useRemoveCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cartService.removeItem(id),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
  });
};

export const useClearCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cartService.clear,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });
};
