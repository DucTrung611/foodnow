import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/msw/server';
import { renderWithProviders, screen, userEvent, waitFor } from '@/test/render';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { MenuItem } from '../types/restaurants.types';
import { MenuItemRow } from './MenuItemRow';

const BASE_URL = 'http://localhost:3000/api/v1';

const SIMPLE_ITEM: MenuItem = {
  id: 'item-1',
  restaurantId: 'restaurant-1',
  categoryId: 'cat-1',
  name: 'Pho Bo',
  basePrice: '45000.00',
  imageUrl: null,
  isAvailable: true,
  version: 0,
  optionGroups: [],
};

const ITEM_WITH_OPTIONS: MenuItem = {
  ...SIMPLE_ITEM,
  id: 'item-2',
  name: 'Tra Sua',
  optionGroups: [
    {
      id: 'group-1',
      name: 'Size',
      isRequired: true,
      minSelect: 1,
      maxSelect: 1,
      options: [
        { id: 'opt-large', name: 'Large', extraPrice: '10000.00' },
        { id: 'opt-small', name: 'Small', extraPrice: '0.00' },
      ],
    },
  ],
};

const CART_RESPONSE = { id: 'cart-1', restaurantId: 'restaurant-1', items: [] };

function loginAsCustomer() {
  useAuthStore.getState().setAuth(
    {
      id: 'customer-1',
      email: 'a@example.com',
      phone: '0900000000',
      fullName: 'Customer',
      avatarUrl: null,
      role: 'CUSTOMER',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    'test-token',
  );
}

describe('MenuItemRow', () => {
  it('adds an item without options straight away on click', async () => {
    loginAsCustomer();
    let received: unknown;
    server.use(
      http.post(`${BASE_URL}/cart/items`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ success: true, data: CART_RESPONSE });
      }),
    );

    renderWithProviders(<MenuItemRow item={SIMPLE_ITEM} />);
    await userEvent.click(screen.getByRole('button', { name: 'Thêm' }));

    await waitFor(() =>
      expect(received).toEqual({ menuItemId: 'item-1', quantity: 1, optionIds: [] }),
    );
  });

  it('disables the button and shows "Hết món" for an unavailable item', () => {
    loginAsCustomer();
    renderWithProviders(<MenuItemRow item={{ ...SIMPLE_ITEM, isAvailable: false }} />);

    expect(screen.getByText('Hết món')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Thêm' })).toBeDisabled();
  });

  it('opens the options modal instead of adding directly when the item has option groups', async () => {
    loginAsCustomer();
    renderWithProviders(<MenuItemRow item={ITEM_WITH_OPTIONS} />);

    await userEvent.click(screen.getByRole('button', { name: 'Tùy chỉnh' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Bắt buộc')).toBeInTheDocument();
  });

  it('keeps "Thêm vào giỏ" disabled until the required group is satisfied, then submits the pick', async () => {
    loginAsCustomer();
    let received: unknown;
    server.use(
      http.post(`${BASE_URL}/cart/items`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json({ success: true, data: CART_RESPONSE });
      }),
    );

    renderWithProviders(<MenuItemRow item={ITEM_WITH_OPTIONS} />);
    await userEvent.click(screen.getByRole('button', { name: 'Tùy chỉnh' }));

    const confirmButton = screen.getByRole('button', { name: 'Thêm vào giỏ' });
    expect(confirmButton).toBeDisabled();

    await userEvent.click(screen.getByRole('radio', { name: /Large/ }));
    expect(confirmButton).toBeEnabled();

    await userEvent.click(confirmButton);

    await waitFor(() =>
      expect(received).toEqual({ menuItemId: 'item-2', quantity: 1, optionIds: ['opt-large'] }),
    );
  });

  it('redirects to /login instead of calling the API when the user is not authenticated', async () => {
    useAuthStore.getState().clearAuth();
    let called = false;
    server.use(
      http.post(`${BASE_URL}/cart/items`, () => {
        called = true;
        return HttpResponse.json({ success: true, data: CART_RESPONSE });
      }),
    );

    renderWithProviders(<MenuItemRow item={SIMPLE_ITEM} />);
    await userEvent.click(screen.getByRole('button', { name: 'Thêm' }));

    expect(called).toBe(false);
  });
});
