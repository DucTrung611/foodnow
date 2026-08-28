import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import { useSetDriverAvailability } from './useDriverAvailability';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('useSetDriverAvailability', () => {
  it('toggles the driver online', async () => {
    let receivedBody: unknown;
    server.use(
      http.patch(`${BASE_URL}/drivers/me/availability`, async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ success: true, data: { isAvailable: true } });
      }),
    );

    const { result } = renderHookWithProviders(() => useSetDriverAvailability());
    result.current.mutate(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(receivedBody).toEqual({ isAvailable: true });
    expect(result.current.data?.isAvailable).toBe(true);
  });
});
