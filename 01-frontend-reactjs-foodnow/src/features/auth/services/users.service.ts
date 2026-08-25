import { apiClient, unwrap } from '@/shared/services/client';
import type { User } from '@/shared/types';
import type { Address, CreateAddressPayload, UpdateProfilePayload } from '../types/auth.types';

/** Profile + address self-service — backend groups these with auth in features/users. */
export const usersService = {
  getMe: () => unwrap<User>(apiClient.get('/users/me')),
  updateMe: (payload: UpdateProfilePayload) => unwrap<User>(apiClient.patch('/users/me', payload)),

  listAddresses: () => unwrap<Address[]>(apiClient.get('/users/me/addresses')),
  addAddress: (payload: CreateAddressPayload) => unwrap<Address>(apiClient.post('/users/me/addresses', payload)),
  updateAddress: (id: string, payload: Partial<CreateAddressPayload>) =>
    unwrap<Address>(apiClient.patch(`/users/me/addresses/${id}`, payload)),
  removeAddress: (id: string) => apiClient.delete(`/users/me/addresses/${id}`),
};
