import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/render';
import { useNotificationStore } from '@/shared/stores/notification.store';
import { PromoCodeInput } from './PromoCodeInput';

const BASE_URL = 'http://localhost:3000/api/v1';

describe('PromoCodeInput', () => {
  it('applies a valid code and reports the discount to the parent', async () => {
    let received: unknown;
    server.use(
      http.post(`${BASE_URL}/promotions/validate`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ success: true, data: { code: 'FREESHIP50', discountAmount: '15000.00' } });
      }),
    );

    const onApplied = vi.fn();
    renderWithProviders(
      <PromoCodeInput restaurantId="restaurant-1" subtotal="125000.00" onApplied={onApplied} />,
    );

    await userEvent.type(screen.getByPlaceholderText('Mã khuyến mãi'), 'freeship50');
    await userEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));

    await waitFor(() => expect(screen.getByText(/Giảm/)).toBeInTheDocument());
    expect(received).toEqual({ code: 'FREESHIP50', restaurantId: 'restaurant-1', subtotal: '125000.00' });
    expect(onApplied).toHaveBeenCalledWith('FREESHIP50', '15000.00');
  });

  it('uppercases what the user types', async () => {
    renderWithProviders(<PromoCodeInput restaurantId="restaurant-1" subtotal="125000.00" onApplied={vi.fn()} />);
    const input = screen.getByPlaceholderText('Mã khuyến mãi') as HTMLInputElement;

    await userEvent.type(input, 'freeship50');
    expect(input.value).toBe('FREESHIP50');
  });

  it('does nothing when Apply is clicked with an empty code', async () => {
    let called = false;
    server.use(
      http.post(`${BASE_URL}/promotions/validate`, () => {
        called = true;
        return HttpResponse.json({ success: true, data: { code: '', discountAmount: '0.00' } });
      }),
    );

    renderWithProviders(<PromoCodeInput restaurantId="restaurant-1" subtotal="125000.00" onApplied={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));

    expect(called).toBe(false);
  });

  it('toasts and does not call onApplied on an expired/invalid code (PROMO_6001)', async () => {
    useNotificationStore.setState({ toasts: [] });
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

    const onApplied = vi.fn();
    renderWithProviders(<PromoCodeInput restaurantId="restaurant-1" subtotal="125000.00" onApplied={onApplied} />);

    await userEvent.type(screen.getByPlaceholderText('Mã khuyến mãi'), 'EXPIRED');
    await userEvent.click(screen.getByRole('button', { name: 'Áp dụng' }));

    await waitFor(() =>
      expect(useNotificationStore.getState().toasts[0]?.message).toBe('Mã khuyến mãi đã hết hạn hoặc hết lượt dùng'),
    );
    expect(onApplied).not.toHaveBeenCalled();
  });
});
