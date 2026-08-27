import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { ApiError } from '@/shared/types';
import { mapErrorCode } from '@/shared/utils/error-code-map';
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
  const showToast = useNotificationStore((s) => s.showToast);
  return useMutation({
    mutationFn: (payload: AddCartItemPayload) => cartService.addItem(payload),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
    onError: (error) => {
      showToast('error', error instanceof ApiError ? mapErrorCode(error.code) : 'Không thể thêm món vào giỏ');
    },
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
