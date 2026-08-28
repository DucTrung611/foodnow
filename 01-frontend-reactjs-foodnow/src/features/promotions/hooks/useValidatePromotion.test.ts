import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { useValidatePromotion } from './useValidatePromotion';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('useValidatePromotion', () => {
  beforeEach(() => {
    useNotificationStore.setState({ toasts: [] });
  });

  it('previews the discount for a cart', async () => {
    server.use(
      http.post(`${BASE_URL}/promotions/validate`, () =>
        HttpResponse.json({ success: true, data: { code: 'FREESHIP50', discountAmount: '15000.00' } }),
      ),
    );

    const { result } = renderHookWithProviders(() => useValidatePromotion());
    result.current.mutate({ code: 'FREESHIP50', restaurantId: 'restaurant-1', subtotal: '125000.00' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.discountAmount).toBe('15000.00');
  });

  it('toasts the mapped message on PROMO_6001 without leaving the UI thinking it applied', async () => {
    server.use(
      http.post(`${BASE_URL}/promotions/validate`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'PROMO_6001', message: 'Promotion expired or usage limit reached', details: null },
            path: '/api/v1/promotions/validate',
            timestamp: new Date().toISOString(),
          },
          { status: 422 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useValidatePromotion());
    result.current.mutate({ code: 'EXPIRED', restaurantId: 'restaurant-1', subtotal: '125000.00' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
    expect(useNotificationStore.getState().toasts[0]?.message).toBe('Mã khuyến mãi đã hết hạn hoặc hết lượt dùng');
  });
});
