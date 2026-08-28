import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookWithProviders } from '@/test/render';
import { useLocationPush } from './useLocationPush';

const { fakeSocket, geoState } = vi.hoisted(() => ({
  fakeSocket: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
  geoState: { position: null as { lat: number; lng: number } | null },
}));

vi.mock('@/app/providers/SocketProvider', () => ({ useSocket: () => fakeSocket }));
vi.mock('@/shared/hooks/useGeolocation', () => ({
  useGeolocation: () => ({ position: geoState.position, error: null, loading: false }),
}));

// Throttled to 1 push / 5s per API_SPEC.md's driver:location_update contract.
describe('useLocationPush', () => {
  beforeEach(() => {
    fakeSocket.emit.mockClear();
    geoState.position = null;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does nothing while no position is available yet', () => {
    renderHookWithProviders(() => useLocationPush('order-1'));
    expect(fakeSocket.emit).not.toHaveBeenCalled();
  });

  it('emits driver:location_update as soon as a position is available', () => {
    // lastSentAt starts at 0, so "now" must clear THROTTLE_MS on its own for a first push to go out.
    vi.spyOn(Date, 'now').mockReturnValue(10_000_000);
    geoState.position = { lat: 21.03, lng: 105.85 };

    renderHookWithProviders(() => useLocationPush('order-1'));

    expect(fakeSocket.emit).toHaveBeenCalledTimes(1);
    expect(fakeSocket.emit).toHaveBeenCalledWith('driver:location_update', {
      lat: 21.03,
      lng: 105.85,
      orderId: 'order-1',
    });
  });

  it('throttles a second position update within the 5s window', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(10_000_000);
    geoState.position = { lat: 21.03, lng: 105.85 };
    const { rerender } = renderHookWithProviders(() => useLocationPush('order-1'));

    nowSpy.mockReturnValue(10_002_000);
    geoState.position = { lat: 21.031, lng: 105.851 };
    rerender();

    expect(fakeSocket.emit).toHaveBeenCalledTimes(1);
  });

  it('emits again once the throttle window has elapsed', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(10_000_000);
    geoState.position = { lat: 21.03, lng: 105.85 };
    const { rerender } = renderHookWithProviders(() => useLocationPush('order-1'));

    nowSpy.mockReturnValue(10_005_500);
    geoState.position = { lat: 21.04, lng: 105.86 };
    rerender();

    expect(fakeSocket.emit).toHaveBeenCalledTimes(2);
    expect(fakeSocket.emit).toHaveBeenLastCalledWith('driver:location_update', {
      lat: 21.04,
      lng: 105.86,
      orderId: 'order-1',
    });
  });
});
