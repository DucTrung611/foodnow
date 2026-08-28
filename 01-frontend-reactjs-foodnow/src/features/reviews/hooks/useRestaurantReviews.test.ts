import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useRestaurantReviews } from './useRestaurantReviews';

const BASE_URL = 'http://localhost:3000/api/v1';
const RESTAURANT_ID = 'restaurant-1';

describe('useRestaurantReviews', () => {
  it('unwraps the list envelope into { items, meta }', async () => {
    server.use(
      http.get(`${BASE_URL}/restaurants/${RESTAURANT_ID}/reviews`, () =>
        HttpResponse.json({
          success: true,
          data: [
            {
              id: 'review-1',
              orderId: 'order-1',
              customerId: 'customer-1',
              restaurantId: RESTAURANT_ID,
              driverId: 'driver-1',
              rating: 5,
              comment: 'Tuyệt vời',
              createdAt: '2026-08-24T10:30:00.000Z',
            },
          ],
          meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useRestaurantReviews(RESTAURANT_ID));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.meta.total).toBe(1);
  });

  it('does not fetch when restaurantId is empty', () => {
    const { result } = renderHookWithProviders(() => useRestaurantReviews(''));

    expect(result.current.fetchStatus).toBe('idle');
    expect(result.current.isPending).toBe(true);
  });
});
