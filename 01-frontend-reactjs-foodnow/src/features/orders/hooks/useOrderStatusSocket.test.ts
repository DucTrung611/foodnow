import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@/test/render';
import type { Order, OrderStatus } from '../types/orders.types';
import { useOrderStatusSocket } from './useOrderStatusSocket';

const { fakeSocket } = vi.hoisted(() => ({
  fakeSocket: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
}));

vi.mock('@/app/providers/SocketProvider', () => ({ useSocket: () => fakeSocket }));

const ORDER_ID = 'order-1';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: ORDER_ID,
    orderCode: 'FN-240824-0042',
    customerId: 'customer-1',
    restaurantId: 'restaurant-1',
    driverId: null,
    deliveryAddressId: 'address-1',
    status: 'PENDING',
    subtotal: '100000.00',
    deliveryFee: '15000.00',
    discountAmount: '0.00',
    totalAmount: '115000.00',
    version: 1,
    placedAt: '2026-08-24T10:30:00.000Z',
    items: [],
    ...overrides,
  };
}

function getRegisteredHandler() {
  const call = fakeSocket.on.mock.calls.find(([event]) => event === 'order:status_changed');
  if (!call) throw new Error('order:status_changed handler was never registered');
  return call[1] as (payload: { orderId: string; status: OrderStatus; version: number; changedAt: string }) => void;
}

// Safety-critical per CLAUDE.md: this hook is the only place a socket push
// is allowed to change an order's status, and only for a server-confirmed
// event scoped to the exact order being watched.
describe('useOrderStatusSocket', () => {
  beforeEach(() => {
    fakeSocket.emit.mockClear();
    fakeSocket.on.mockClear();
    fakeSocket.off.mockClear();
  });

  it('subscribes to the order room and registers a listener on mount', () => {
    renderHookWithProviders(() => useOrderStatusSocket(ORDER_ID));

    expect(fakeSocket.emit).toHaveBeenCalledWith('order:subscribe', { orderId: ORDER_ID });
    expect(fakeSocket.on).toHaveBeenCalledWith('order:status_changed', expect.any(Function));
  });

  it('applies a status_changed event for this order to the cache', async () => {
    const { queryClient } = renderHookWithProviders(() => useOrderStatusSocket(ORDER_ID));
    queryClient.setQueryData(['orders', 'detail', ORDER_ID], makeOrder({ status: 'PENDING', version: 1 }));

    getRegisteredHandler()({ orderId: ORDER_ID, status: 'PREPARING', version: 2, changedAt: new Date().toISOString() });

    await waitFor(() =>
      expect(queryClient.getQueryData<Order>(['orders', 'detail', ORDER_ID])?.status).toBe('PREPARING'),
    );
    expect(queryClient.getQueryData<Order>(['orders', 'detail', ORDER_ID])?.version).toBe(2);
  });

  it('ignores events for a different order — no cross-talk between subscriptions', () => {
    const { queryClient } = renderHookWithProviders(() => useOrderStatusSocket(ORDER_ID));
    queryClient.setQueryData(['orders', 'detail', ORDER_ID], makeOrder({ status: 'PENDING', version: 1 }));

    getRegisteredHandler()({
      orderId: 'a-completely-different-order',
      status: 'CANCELLED',
      version: 9,
      changedAt: new Date().toISOString(),
    });

    expect(queryClient.getQueryData<Order>(['orders', 'detail', ORDER_ID])?.status).toBe('PENDING');
  });

  it('does nothing if the order was never in the cache (no speculative insert)', () => {
    const { queryClient } = renderHookWithProviders(() => useOrderStatusSocket(ORDER_ID));

    getRegisteredHandler()({ orderId: ORDER_ID, status: 'PREPARING', version: 2, changedAt: new Date().toISOString() });

    expect(queryClient.getQueryData(['orders', 'detail', ORDER_ID])).toBeUndefined();
  });

  it('unsubscribes the listener on unmount', () => {
    const { unmount } = renderHookWithProviders(() => useOrderStatusSocket(ORDER_ID));
    unmount();

    expect(fakeSocket.off).toHaveBeenCalledWith('order:status_changed', expect.any(Function));
  });
});
