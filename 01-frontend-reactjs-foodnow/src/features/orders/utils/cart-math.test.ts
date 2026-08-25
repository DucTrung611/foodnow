import { describe, expect, it } from 'vitest';
import type { CartItem } from '../types/orders.types';
import { calculateCartSubtotal } from './cart-math';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'item-1',
    menuItemId: 'menu-1',
    name: 'Trà sữa trân châu',
    basePrice: '45000.00',
    quantity: 1,
    selectedOptions: [],
    note: null,
    ...overrides,
  };
}

describe('calculateCartSubtotal', () => {
  it('returns 0 for an empty cart', () => {
    expect(calculateCartSubtotal([])).toBe(0);
  });

  it('multiplies price by quantity per line item', () => {
    const items = [makeItem({ basePrice: '45000.00', quantity: 2 })];
    expect(calculateCartSubtotal(items)).toBe(90000);
  });

  it('sums across multiple line items', () => {
    const items = [
      makeItem({ id: 'a', basePrice: '45000.00', quantity: 2 }),
      makeItem({ id: 'b', basePrice: '15000.50', quantity: 1 }),
    ];
    expect(calculateCartSubtotal(items)).toBeCloseTo(105000.5);
  });

  it('parses decimal-string prices correctly (API_SPEC.md money convention)', () => {
    const items = [makeItem({ basePrice: '9999.99', quantity: 3 })];
    expect(calculateCartSubtotal(items)).toBeCloseTo(29999.97);
  });
});
