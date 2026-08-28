import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { useAcceptDelivery, useCompleteDelivery, usePickupDelivery } from './useDeliveryActions';

const BASE_URL = 'http://localhost:3000/api/v1';
const DELIVERY_ID = 'delivery-1';

function makeDelivery(status: string) {
  return {
    id: DELIVERY_ID,
    orderId: 'order-1',
    driverId: 'driver-1',
    pickupTime: null,
    deliveryTime: null,
    estimatedDistanceKm: '3.2',
    status,
  };
}

describe('useAcceptDelivery', () => {
  beforeEach(() => {
    useNotificationStore.setState({ toasts: [] });
  });

  it('accepts the delivery and invalidates the available-deliveries list', async () => {
    server.use(
      http.post(`${BASE_URL}/deliveries/${DELIVERY_ID}/accept`, () =>
        HttpResponse.json({ success: true, data: makeDelivery('ASSIGNED') }),
      ),
    );

    const { result, queryClient } = renderHookWithProviders(() => useAcceptDelivery());
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate(DELIVERY_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('ASSIGNED');
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['deliveries', 'available'] });
  });

  it('toasts DELIVERY_4001 without leaving the UI thinking the accept succeeded', async () => {
    server.use(
      http.post(`${BASE_URL}/deliveries/${DELIVERY_ID}/accept`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'DELIVERY_4001', message: 'No available driver in radius', details: null },
            path: `/api/v1/deliveries/${DELIVERY_ID}/accept`,
            timestamp: new Date().toISOString(),
          },
          { status: 422 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useAcceptDelivery());
    result.current.mutate(DELIVERY_ID);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useNotificationStore.getState().toasts[0]?.message).toBe('Không có tài xế khả dụng trong khu vực');
  });
});

describe('usePickupDelivery', () => {
  it('confirms pickup', async () => {
    server.use(
      http.post(`${BASE_URL}/deliveries/${DELIVERY_ID}/pickup`, () =>
        HttpResponse.json({ success: true, data: makeDelivery('PICKED_UP') }),
      ),
    );

    const { result } = renderHookWithProviders(() => usePickupDelivery());
    result.current.mutate(DELIVERY_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('PICKED_UP');
  });
});

describe('useCompleteDelivery', () => {
  it('confirms delivery completion', async () => {
    server.use(
      http.post(`${BASE_URL}/deliveries/${DELIVERY_ID}/complete`, () =>
        HttpResponse.json({ success: true, data: makeDelivery('COMPLETED') }),
      ),
    );

    const { result } = renderHookWithProviders(() => useCompleteDelivery());
    result.current.mutate(DELIVERY_ID);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.status).toBe('COMPLETED');
  });
});
