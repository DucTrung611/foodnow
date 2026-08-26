import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { useUpdateOrderStatus } from './useUpdateOrderStatus';

const BASE_URL = 'http://localhost:3000/api/v1';
const ORDER_ID = 'order-1';

// Safety-critical per CLAUDE.md: order status must only ever change from a
// server response or a confirmed socket event — never assumed client-side.
describe('useUpdateOrderStatus', () => {
  beforeEach(() => {
    useNotificationStore.setState({ toasts: [] });
  });

  it('writes the server-returned order into the cache on success — nothing is written before that', async () => {
    server.use(
      http.patch(`${BASE_URL}/orders/${ORDER_ID}/status`, () =>
        HttpResponse.json({
          success: true,
          data: { id: ORDER_ID, status: 'PREPARING', version: 4 },
        }),
      ),
    );

    const { result, queryClient } = renderHookWithProviders(() => useUpdateOrderStatus(ORDER_ID));

    expect(queryClient.getQueryData(['orders', 'detail', ORDER_ID])).toBeUndefined();

    result.current.mutate({ status: 'PREPARING', version: 3 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(['orders', 'detail', ORDER_ID])).toMatchObject({
      status: 'PREPARING',
      version: 4,
    });
  });

  it('on 409 ORDER_3009, never writes the (stale) attempted data — forces a re-fetch instead of a blind retry', async () => {
    server.use(
      http.patch(`${BASE_URL}/orders/${ORDER_ID}/status`, () =>
        HttpResponse.json(
          {
            success: false,
            error: {
              code: 'ORDER_3009',
              message: 'Order was modified by another party, please retry',
              details: [{ field: 'version', expected: 3, actual: 4 }],
            },
            path: `/api/v1/orders/${ORDER_ID}/status`,
            timestamp: new Date().toISOString(),
          },
          { status: 409 },
        ),
      ),
    );

    const { result, queryClient } = renderHookWithProviders(() => useUpdateOrderStatus(ORDER_ID));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({ status: 'PREPARING', version: 3 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(['orders', 'detail', ORDER_ID])).toBeUndefined();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'detail', ORDER_ID] });
    expect(useNotificationStore.getState().toasts[0]?.message).toContain('vừa được cập nhật');
  });

  it('on an unrelated error, maps the error code to a Vietnamese toast without touching the cache', async () => {
    server.use(
      http.patch(`${BASE_URL}/orders/${ORDER_ID}/status`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'ORDER_3008', message: 'Invalid status transition', details: null },
            path: `/api/v1/orders/${ORDER_ID}/status`,
            timestamp: new Date().toISOString(),
          },
          { status: 422 },
        ),
      ),
    );

    const { result, queryClient } = renderHookWithProviders(() => useUpdateOrderStatus(ORDER_ID));
    result.current.mutate({ status: 'DELIVERED', version: 3 });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(queryClient.getQueryData(['orders', 'detail', ORDER_ID])).toBeUndefined();
    expect(useNotificationStore.getState().toasts[0]?.message).toBe('Trạng thái đơn hàng không hợp lệ');
  });
});
