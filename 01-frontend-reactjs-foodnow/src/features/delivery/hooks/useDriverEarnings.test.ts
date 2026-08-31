import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useDriverEarnings } from './useDriverEarnings';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('useDriverEarnings', () => {
  it('fetches the earnings summary', async () => {
    server.use(
      http.get(`${BASE_URL}/drivers/me/earnings`, () =>
        HttpResponse.json({
          success: true,
          data: {
            totalPaidAmount: '1250000.00',
            totalPendingAmount: '150000.00',
            earnings: [
              {
                id: 'earning-1',
                deliveryId: 'delivery-1',
                amount: '50000.00',
                status: 'PAID',
                paidAt: '2026-08-20T00:00:00.000Z',
                createdAt: '2026-08-19T00:00:00.000Z',
              },
            ],
          },
        }),
      ),
    );

    const { result } = renderHookWithProviders(() => useDriverEarnings());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.totalPaidAmount).toBe('1250000.00');
    expect(result.current.data?.earnings).toHaveLength(1);
  });
});
