import { apiClient, unwrap } from '@/shared/services/client';
import type { User } from '@/shared/types';
import type { LoginPayload, LoginResponse, RegisterPayload } from '../types/auth.types';

export const authService = {
  login: (payload: LoginPayload) => unwrap<LoginResponse>(apiClient.post('/auth/login', payload)),

  // Backend returns the created user only — no auto-login (features/users/auth.controller.ts).
  register: (payload: RegisterPayload) => unwrap<User>(apiClient.post('/auth/register', payload)),

  // refresh_token lives in an httpOnly cookie; this rotates it and returns a fresh access token.
  refresh: () => unwrap<{ accessToken: string }>(apiClient.post('/auth/refresh')),

  logout: () => apiClient.post('/auth/logout'),
};
