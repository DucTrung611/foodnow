import { beforeEach, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import type { DeliveryTrackingSnapshot } from '../types/delivery.types';
import { useOrderTracking } from './useOrderTracking';

const { fakeSocket } = vi.hoisted(() => ({
  fakeSocket: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
}));

vi.mock('@/app/providers/SocketProvider', () => ({ useSocket: () => fakeSocket }));

const BASE_URL = 'http://localhost:3000/api/v1';
const ORDER_ID = 'order-1';

function getRegisteredHandler() {
  const call = fakeSocket.on.mock.calls.find(([event]) => event === 'delivery:location');
  if (!call) throw new Error('delivery:location handler was never registered');
  return call[1] as (payload: DeliveryTrackingSnapshot) => void;
}

describe('useOrderTracking', () => {
  beforeEach(() => {
    fakeSocket.emit.mockClear();
    fakeSocket.on.mockClear();
    fakeSocket.off.mockClear();
  });

  it('fetches the last known position via REST and subscribes to the order room', async () => {
    server.use(
      http.get(`${BASE_URL}/orders/${ORDER_ID}/tracking`, () =>
        HttpResponse.json({
          success: true,
          data: { lat: 21.03, lng: 105.85, recordedAt: '2026-08-24T10:30:00.000Z', etaMinutes: 8 },
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useOrderTracking(ORDER_ID));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.etaMinutes).toBe(8);
    expect(fakeSocket.emit).toHaveBeenCalledWith('order:subscribe', { orderId: ORDER_ID });
    expect(fakeSocket.on).toHaveBeenCalledWith('delivery:location', expect.any(Function));
  });

  it('writes a live delivery:location push straight into the query cache, no refetch needed', async () => {
    server.use(
      http.get(`${BASE_URL}/orders/${ORDER_ID}/tracking`, () =>
        HttpResponse.json({
          success: true,
          data: { lat: 21.03, lng: 105.85, recordedAt: '2026-08-24T10:30:00.000Z', etaMinutes: 8 },
        }),
      ),
    );

    const { result, queryClient } = renderHookWithProviders(() => useOrderTracking(ORDER_ID));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    getRegisteredHandler()({ lat: 21.05, lng: 105.9, recordedAt: '2026-08-24T10:31:00.000Z', etaMinutes: 5 });

    await waitFor(() =>
      expect(queryClient.getQueryData<DeliveryTrackingSnapshot>(['deliveries', 'tracking', ORDER_ID])?.etaMinutes).toBe(
        5,
      ),
    );
    expect(queryClient.getQueryData<DeliveryTrackingSnapshot>(['deliveries', 'tracking', ORDER_ID])?.lat).toBe(21.05);
  });

  it('does not subscribe when orderId is empty', () => {
    renderHookWithProviders(() => useOrderTracking(''));
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });

  it('unsubscribes the listener on unmount', () => {
    server.use(
      http.get(`${BASE_URL}/orders/${ORDER_ID}/tracking`, () =>
        HttpResponse.json({
          success: true,
          data: { lat: 0, lng: 0, recordedAt: '2026-08-24T10:30:00.000Z', etaMinutes: 1 },
        }),
      ),
    );
    const { unmount } = renderHookWithProviders(() => useOrderTracking(ORDER_ID));
    unmount();
    expect(fakeSocket.off).toHaveBeenCalledWith('delivery:location', expect.any(Function));
  });
});
