import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useCreatePromotion } from './useCreatePromotion';

const BASE_URL = 'http://localhost:3000/api/v1';

const PAYLOAD = {
  code: 'NEWCODE10',
  discountType: 'PERCENTAGE' as const,
  discountValue: '10',
  startsAt: '2026-09-01T00:00:00.000Z',
  endsAt: '2026-09-30T00:00:00.000Z',
};

describe('useCreatePromotion', () => {
  it('creates a promotion', async () => {
    let received: unknown;
    server.use(
      http.post(`${BASE_URL}/promotions`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({
          success: true,
          data: {
            id: 'promo-1',
            code: PAYLOAD.code,
            restaurantId: null,
            discountType: 'PERCENTAGE',
            discountValue: '10',
            minOrderAmount: '0.00',
            maxDiscountAmount: null,
            usageLimit: null,
            usageLimitPerUser: null,
            startsAt: PAYLOAD.startsAt,
            endsAt: PAYLOAD.endsAt,
            isActive: true,
          },
        });
      }),
    );

    const { result } = renderHookWithProviders(() => useCreatePromotion());
    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(received).toEqual(PAYLOAD);
    expect(result.current.data?.code).toBe('NEWCODE10');
  });

  it('does not resolve as success on a duplicate code (PROMO_6002)', async () => {
    server.use(
      http.post(`${BASE_URL}/promotions`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'PROMO_6002', message: 'Promotion code already exists', details: null },
            path: '/api/v1/promotions',
            timestamp: new Date().toISOString(),
          },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => useCreatePromotion());
    result.current.mutate(PAYLOAD);

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });
});
