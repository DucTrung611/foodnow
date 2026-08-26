import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { waitFor } from '@testing-library/react';
import { server } from '@/test/msw/server';
import { renderHookWithProviders } from '@/test/render';
import type { Cart } from '../types/orders.types';
import { useAddCartItem, useClearCart, useRemoveCartItem, useUpdateCartItem } from './useCart';

const BASE_URL = 'http://localhost:3000/api/v1';

const cartWithItem: Cart = {
  id: 'cart-1',
  restaurantId: 'restaurant-1',
  items: [
    { id: 'item-1', menuItemId: 'menu-1', name: 'Trà sữa trân châu', basePrice: '45000.00', quantity: 2, selectedOptions: [], note: null },
  ],
};

const emptyCart: Cart = { id: 'cart-1', restaurantId: null, items: [] };

describe('cart mutations', () => {
  it('useAddCartItem writes the server-returned cart into the ["cart"] cache', async () => {
    server.use(http.post(`${BASE_URL}/cart/items`, () => HttpResponse.json({ success: true, data: cartWithItem })));

    const { result, queryClient } = renderHookWithProviders(() => useAddCartItem());
    result.current.mutate({ menuItemId: 'menu-1', quantity: 2, optionIds: [] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['cart'])).toEqual(cartWithItem);
  });

  it('useUpdateCartItem writes the server-returned cart into the ["cart"] cache', async () => {
    const updated: Cart = { ...cartWithItem, items: [{ ...cartWithItem.items[0], quantity: 3 }] };
    server.use(http.patch(`${BASE_URL}/cart/items/item-1`, () => HttpResponse.json({ success: true, data: updated })));

    const { result, queryClient } = renderHookWithProviders(() => useUpdateCartItem());
    result.current.mutate({ id: 'item-1', payload: { quantity: 3 } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['cart'])).toEqual(updated);
  });

  it('useRemoveCartItem writes the server-returned (now-empty) cart into the ["cart"] cache', async () => {
    server.use(http.delete(`${BASE_URL}/cart/items/item-1`, () => HttpResponse.json({ success: true, data: emptyCart })));

    const { result, queryClient } = renderHookWithProviders(() => useRemoveCartItem());
    result.current.mutate('item-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(['cart'])).toEqual(emptyCart);
  });

  it('useClearCart invalidates the cart query rather than assuming the new (empty) shape', async () => {
    server.use(http.delete(`${BASE_URL}/cart`, () => HttpResponse.json({ success: true, data: null })));

    const { result, queryClient } = renderHookWithProviders(() => useClearCart());
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cart'] });
  });
});
