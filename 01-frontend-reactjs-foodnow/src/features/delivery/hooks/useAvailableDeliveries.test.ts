import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useAvailableDeliveries } from './useAvailableDeliveries';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('useAvailableDeliveries', () => {
  it('fetches nearby unassigned deliveries', async () => {
    server.use(
      http.get(`${BASE_URL}/deliveries/available`, () =>
        HttpResponse.json({
          success: true,
          data: [
            { orderId: 'order-1', restaurantId: 'restaurant-1', distanceMeters: 850, estimatedEarning: '25000.00' },
          ],
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useAvailableDeliveries());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].orderId).toBe('order-1');
  });
});
