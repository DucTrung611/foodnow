import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/render';
import { ReviewForm } from './ReviewForm';

const BASE_URL = 'http://localhost:3000/api/v1';
const ORDER_ID = 'order-1';

describe('ReviewForm', () => {
  it('submits the selected rating and comment, then calls onSubmitted', async () => {
    let received: unknown;
    server.use(
      http.post(`${BASE_URL}/orders/${ORDER_ID}/reviews`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({
          success: true,
          data: {
            id: 'review-1',
            orderId: ORDER_ID,
            customerId: 'customer-1',
            restaurantId: 'restaurant-1',
            driverId: 'driver-1',
            rating: 3,
            comment: 'Tạm ổn',
            createdAt: '2026-08-24T10:30:00.000Z',
          },
        });
      }),
    );

    const onSubmitted = vi.fn();
    renderWithProviders(<ReviewForm orderId={ORDER_ID} onSubmitted={onSubmitted} />);

    await userEvent.click(screen.getByRole('button', { name: '3 sao' }));
    await userEvent.type(screen.getByPlaceholderText('Chia sẻ trải nghiệm của bạn...'), 'Tạm ổn');
    await userEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce());
    expect(received).toEqual({ rating: 3, comment: 'Tạm ổn' });
  });

  it('defaults to a 5-star rating and drops an empty comment from the payload', async () => {
    let received: unknown;
    server.use(
      http.post(`${BASE_URL}/orders/${ORDER_ID}/reviews`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({
          success: true,
          data: {
            id: 'review-1',
            orderId: ORDER_ID,
            customerId: 'customer-1',
            restaurantId: 'restaurant-1',
            driverId: 'driver-1',
            rating: 5,
            comment: null,
            createdAt: '2026-08-24T10:30:00.000Z',
          },
        });
      }),
    );

    renderWithProviders(<ReviewForm orderId={ORDER_ID} />);
    await userEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }));

    await waitFor(() => expect(received).toEqual({ rating: 5 }));
  });
});
