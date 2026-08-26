import { beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { usePayOrder } from './usePayOrder';

const BASE_URL = 'http://localhost:3000/api/v1';
const ORDER_ID = 'order-1';

describe('usePayOrder', () => {
  beforeEach(() => {
    useNotificationStore.setState({ toasts: [] });
  });

  it('reuses the same Idempotency-Key across repeated attempts from one hook instance', async () => {
    const seenKeys: (string | null)[] = [];
    server.use(
      http.post(`${BASE_URL}/orders/${ORDER_ID}/pay`, ({ request }) => {
        seenKeys.push(request.headers.get('Idempotency-Key'));
        return HttpResponse.json({ success: true, data: { id: 'payment-1', status: 'PAID' } });
      }),
    );

    const { result } = renderHookWithProviders(() => usePayOrder(ORDER_ID));

    result.current.mutate({ method: 'CASH' });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    result.current.mutate({ method: 'CASH' });
    await waitFor(() => expect(seenKeys).toHaveLength(2));

    expect(seenKeys[0]).toBeTruthy();
    expect(seenKeys[0]).toBe(seenKeys[1]);
  });

  it('a fresh hook instance (new mount) gets a different Idempotency-Key', async () => {
    const seenKeys: (string | null)[] = [];
    server.use(
      http.post(`${BASE_URL}/orders/${ORDER_ID}/pay`, ({ request }) => {
        seenKeys.push(request.headers.get('Idempotency-Key'));
        return HttpResponse.json({ success: true, data: { id: 'payment-1', status: 'PAID' } });
      }),
    );

    const first = renderHookWithProviders(() => usePayOrder(ORDER_ID));
    first.result.current.mutate({ method: 'CASH' });
    await waitFor(() => expect(first.result.current.isSuccess).toBe(true));
    first.unmount();

    const second = renderHookWithProviders(() => usePayOrder(ORDER_ID));
    second.result.current.mutate({ method: 'CASH' });
    await waitFor(() => expect(second.result.current.isSuccess).toBe(true));

    expect(seenKeys).toHaveLength(2);
    expect(seenKeys[0]).not.toBe(seenKeys[1]);
  });

  it('does not resolve as success on a 402 decline (PAYMENT_5001)', async () => {
    server.use(
      http.post(`${BASE_URL}/orders/${ORDER_ID}/pay`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'PAYMENT_5001', message: 'Payment declined by provider', details: null },
            path: `/api/v1/orders/${ORDER_ID}/pay`,
            timestamp: new Date().toISOString(),
          },
          { status: 402 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => usePayOrder(ORDER_ID));
    result.current.mutate({ method: 'CARD' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
    expect(useNotificationStore.getState().toasts[0]?.message).toBe('Thanh toán bị từ chối');
  });

  it('does not resolve as success on a 409 duplicate-idempotency-key conflict (PAYMENT_5002)', async () => {
    server.use(
      http.post(`${BASE_URL}/orders/${ORDER_ID}/pay`, () =>
        HttpResponse.json(
          {
            success: false,
            error: { code: 'PAYMENT_5002', message: 'Duplicate idempotency key with different payload', details: null },
            path: `/api/v1/orders/${ORDER_ID}/pay`,
            timestamp: new Date().toISOString(),
          },
          { status: 409 },
        ),
      ),
    );

    const { result } = renderHookWithProviders(() => usePayOrder(ORDER_ID));
    result.current.mutate({ method: 'CARD' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSuccess).toBe(false);
  });
});
