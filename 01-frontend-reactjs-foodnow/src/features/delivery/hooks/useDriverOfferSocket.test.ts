import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@/test/render';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { useDriverOfferSocket } from './useDriverOfferSocket';

const { fakeSocket } = vi.hoisted(() => ({
  fakeSocket: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
}));

vi.mock('@/app/providers/SocketProvider', () => ({ useSocket: () => fakeSocket }));

function getRegisteredHandler() {
  const call = fakeSocket.on.mock.calls.find(([event]) => event === 'driver:new_offer');
  if (!call) throw new Error('driver:new_offer handler was never registered');
  return call[1] as () => void;
}

describe('useDriverOfferSocket', () => {
  beforeEach(() => {
    fakeSocket.on.mockClear();
    fakeSocket.off.mockClear();
    useNotificationStore.setState({ toasts: [] });
  });

  it('registers a driver:new_offer listener on mount', () => {
    renderHookWithProviders(() => useDriverOfferSocket());
    expect(fakeSocket.on).toHaveBeenCalledWith('driver:new_offer', expect.any(Function));
  });

  it('toasts and invalidates the available-deliveries query when a new offer arrives', async () => {
    const { queryClient } = renderHookWithProviders(() => useDriverOfferSocket());
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    getRegisteredHandler()();

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['deliveries', 'available'] });
    await waitFor(() =>
      expect(useNotificationStore.getState().toasts[0]?.message).toBe('Có đơn hàng mới gần bạn'),
    );
  });

  it('unsubscribes the listener on unmount', () => {
    const { unmount } = renderHookWithProviders(() => useDriverOfferSocket());
    unmount();
    expect(fakeSocket.off).toHaveBeenCalledWith('driver:new_offer', expect.any(Function));
  });
});
