import { describe, expect, it } from 'vitest';
import type { MenuItem } from '../types/restaurants.types';
import { calculateMenuItemUnitPrice, isOptionGroupSatisfied } from './menu-item-price';

const ITEM: MenuItem = {
  id: 'item-1',
  restaurantId: 'restaurant-1',
  categoryId: 'cat-1',
  name: 'Pho Bo',
  basePrice: '45000.00',
  imageUrl: null,
  isAvailable: true,
  version: 0,
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
    {
      id: 'group-2',
      name: 'Toppings',
      isRequired: false,
      minSelect: 0,
      maxSelect: 2,
      options: [{ id: 'opt-egg', name: 'Trung', extraPrice: '5000.00' }],
    },
  ],
};

describe('calculateMenuItemUnitPrice', () => {
  it('returns the base price when no options are selected', () => {
    expect(calculateMenuItemUnitPrice(ITEM, [])).toBe(45000);
  });

  it('adds the extraPrice of every selected option', () => {
    expect(calculateMenuItemUnitPrice(ITEM, ['opt-large', 'opt-egg'])).toBe(60000);
  });

  it('ignores an unknown option id rather than throwing', () => {
    expect(calculateMenuItemUnitPrice(ITEM, ['not-a-real-option'])).toBe(45000);
  });
});

describe('isOptionGroupSatisfied', () => {
  it('is unsatisfied below minSelect', () => {
    expect(isOptionGroupSatisfied(1, 0)).toBe(false);
  });

  it('is satisfied at or above minSelect', () => {
    expect(isOptionGroupSatisfied(1, 1)).toBe(true);
    expect(isOptionGroupSatisfied(0, 0)).toBe(true);
  });
});
