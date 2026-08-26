import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useNotificationStore } from '@/shared/stores/notification.store';
import type { CreateOrderPayload } from '../types/orders.types';
import { useCreateOrder } from './useCreateOrder';

const BASE_URL = 'http://localhost:3000/api/v1';

const payload: CreateOrderPayload = {
  restaurantId: 'restaurant-1',
  deliveryAddressId: 'address-1',
  items: [{ menuItemId: 'menu-1', quantity: 1, optionIds: [] }],
};

describe('useCreateOrder', () => {
  beforeEach(() => {
    useNotificationStore.setState({ toasts: [] });
  });

  it('invalidates cart + orders list on success without speculatively seeding the new order detail', async () => {
    server.use(
      http.post(`${BASE_URL}/orders`, () =>
        HttpResponse.json({ success: true, data: { id: 'order-1', status: 'PENDING', version: 1 } }),
      ),
    );

    const { result, queryClient } = renderHookWithProviders(() => useCreateOrder());
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['orders', 'list'] });
    // OrderDetailPage fetches fresh via useOrder(order.id) after navigation — nothing pre-seeded here.
    expect(queryClient.getQueryData(['orders', 'detail', 'order-1'])).toBeUndefined();
  });

  it('maps RESTAURANT_2002 (closed) to its Vietnamese toast and does not resolve as success', async () => {
    server.use(
      http.post(`${BASE_URL}/orders`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'RESTAURANT_2002', message: 'Restaurant is closed', details: null },
            path: '/api/v1/orders',
            timestamp: new Date().toISOString(),
          },
          { status: 422 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useCreateOrder());
    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
    expect(useNotificationStore.getState().toasts[0]?.message).toBe('Nhà hàng hiện đã đóng cửa');
  });
});
