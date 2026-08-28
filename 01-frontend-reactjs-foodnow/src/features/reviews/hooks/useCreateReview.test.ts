import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { useCreateReview } from './useCreateReview';

const BASE_URL = 'http://localhost:3000/api/v1';
const ORDER_ID = 'order-1';

function makeReview(overrides: { restaurantId?: string | null } = {}) {
  return {
    id: 'review-1',
    orderId: ORDER_ID,
    customerId: 'customer-1',
    restaurantId: 'restaurant-1',
    driverId: 'driver-1',
    rating: 5,
    comment: null,
    createdAt: '2026-08-24T10:30:00.000Z',
    ...overrides,
  };
}

describe('useCreateReview', () => {
  beforeEach(() => {
    useNotificationStore.setState({ toasts: [] });
  });

  it('toasts a thank-you and invalidates the restaurant review list on success', async () => {
    server.use(
      http.post(`${BASE_URL}/orders/${ORDER_ID}/reviews`, () =>
        HttpResponse.json({ success: true, data: makeReview() }),
      ),
    );

    const { result, queryClient } = renderHookWithProviders(() => useCreateReview(ORDER_ID));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({ rating: 5 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(useNotificationStore.getState().toasts[0]?.message).toBe('Cảm ơn bạn đã đánh giá!');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['reviews', 'restaurant', 'restaurant-1'] });
  });

  it('does not try to invalidate a restaurant review list when restaurantId is null', async () => {
    server.use(
      http.post(`${BASE_URL}/orders/${ORDER_ID}/reviews`, () =>
        HttpResponse.json({ success: true, data: makeReview({ restaurantId: null }) }),
      ),
    );

    const { result, queryClient } = renderHookWithProviders(() => useCreateReview(ORDER_ID));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate({ rating: 5 });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it('toasts a fallback message on REVIEW_7002 (already reviewed) without a false success', async () => {
    server.use(
      http.post(`${BASE_URL}/orders/${ORDER_ID}/reviews`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'REVIEW_7002', message: 'Order has already been reviewed', details: null },
            path: `/api/v1/orders/${ORDER_ID}/reviews`,
            timestamp: new Date().toISOString(),
          },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useCreateReview(ORDER_ID));
    result.current.mutate({ rating: 5 });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
    expect(useNotificationStore.getState().toasts[0]?.message).toBe('Đã có lỗi xảy ra, vui lòng thử lại');
  });
});
