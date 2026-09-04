import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/shared/stores/auth.store';
import { usersService } from '../services/users.service';
import type { CreateAddressPayload, UpdateProfilePayload } from '../types/auth.types';

export const useProfile = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: usersService.getMe,
    enabled: isAuthenticated,
  });
};

export const useUpdateProfile = () => {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => usersService.updateMe(payload),
    onSuccess: (user) => setUser(user),
  });
};

/**
 * `/users/me/addresses` is CUSTOMER-only server-side. Pages shared across
 * roles (e.g. order detail, viewable by vendor/driver/admin too) must pass
 * `enabled: isCustomer` to avoid firing a request that will 403 for everyone else.
 */
export const useAddresses = (options?: { enabled?: boolean }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['auth', 'addresses'],
    queryFn: usersService.listAddresses,
    enabled: isAuthenticated && (options?.enabled ?? true),
  });
};

export const useAddAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAddressPayload) => usersService.addAddress(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'addresses'] }),
  });
};

export const useRemoveAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersService.removeAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['auth', 'addresses'] }),
  });
};
