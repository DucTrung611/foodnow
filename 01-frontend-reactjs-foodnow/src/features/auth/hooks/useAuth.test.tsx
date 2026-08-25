import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useAuthStore } from '@/shared/stores/auth.store';
import { useLogin } from './useAuth';

// Network is mocked with MSW at the HTTP layer — the real axios client
// (shared/services/client.ts) and the real authService both run unmodified.
// Only useNavigate is replaced, since MemoryRouter has no observable "current
// URL" assertion of its own.
const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const BASE_URL = 'http://localhost:3000/api/v1';

describe('useLogin', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    useAuthStore.getState().clearAuth();
  });

  it('stores the session in auth.store and navigates home on success', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/login`, () =>
        HttpResponse.json({
          success: true,
          data: {
            accessToken: 'test-access-token',
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

    const { result } = renderHookWithProviders(() => useLogin());
    result.current.mutate({ email: 'a@example.com', password: 'password123' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(useAuthStore.getState().accessToken).toBe('test-access-token');
    expect(useAuthStore.getState().user?.email).toBe('a@example.com');
    expect(navigateMock).toHaveBeenCalledWith('/');
  });

  it('does not authenticate on AUTH_1002 (wrong credentials)', async () => {
    server.use(
      http.post(`${BASE_URL}/auth/login`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'AUTH_1002', message: 'Invalid credentials', details: null },
            path: '/api/v1/auth/login',
            timestamp: new Date().toISOString(),
          },
          { status: 401 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useLogin());
    result.current.mutate({ email: 'a@example.com', password: 'wrong' });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
