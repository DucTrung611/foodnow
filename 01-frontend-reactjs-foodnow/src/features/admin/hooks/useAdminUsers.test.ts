import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useAdminUsers } from './useAdminUsers';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('useAdminUsers', () => {
  it('unwraps the list envelope into { items, meta } — meta sits beside data, not inside it', async () => {
    server.use(
      http.get(`${BASE_URL}/admin/users`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: 'vendor-1',
              email: 'v@test.com',
              phone: '0912345678',
              fullName: 'Vendor One',
              avatarUrl: null,
              role: 'VENDOR',
              status: 'PENDING',
              createdAt: '2026-01-01T00:00:00.000Z',
            },
          ],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useAdminUsers());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.items[0].fullName).toBe('Vendor One');
    expect(result.current.data?.meta).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });
});
