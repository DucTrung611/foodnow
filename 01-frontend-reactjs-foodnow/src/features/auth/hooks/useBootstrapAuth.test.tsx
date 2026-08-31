import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useBootstrapAuth } from './useBootstrapAuth';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('useBootstrapAuth', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('restores the session when the httpOnly refresh cookie is still valid', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/refresh`, () =>
        HttpResponse.json({
          success: true,
          data: {
            accessToken: 'fresh-access-token',
            user: {
              id: 'user-1',
              email: 'a@example.com',
              phone: '0900000000',
              fullName: 'Nguyễn Văn A',
              avatarUrl: null,
              role: 'CUSTOMER',
              status: 'ACTIVE',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          },
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useBootstrapAuth());

    await waitFor(() => expect(result.current).toBe(true));

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('fresh-access-token');
    expect(useAuthStore.getState().user?.email).toBe('a@example.com');
  });

  it('resolves to a guest state (isReady=true, not authenticated) when there is no valid session', async () => {
    // The baseline handler in src/test/msw/handlers.ts already 401s /auth/refresh
    // by default — this is the "no cookie / expired session" case.
    const { result } = renderHookWithProviders(() => useBootstrapAuth());

    await waitFor(() => expect(result.current).toBe(true));

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
