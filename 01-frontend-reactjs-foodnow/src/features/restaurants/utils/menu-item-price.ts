import type { MenuItem } from '../types/restaurants.types';

/**
 * Base price + sum of selected option extras. Display-only math — the add-
 * to-cart request sends `optionIds`, never a computed price (API money
 * fields are decimal strings, only parsed to Number for display).
 */
export function calculateMenuItemUnitPrice(item: MenuItem, selectedOptionIds: string[]): number {
  const allOptions = item.optionGroups.flatMap((group) => group.options);
  const extras = selectedOptionIds.reduce((sum, id) => {
    const option = allOptions.find((o) => o.id === id);
    return sum + (option ? Number(option.extraPrice) : 0);
  }, 0);
  return Number(item.basePrice) + extras;
}

/** A required group (minSelect ≥ 1) must have at least minSelect picks. */
export function isOptionGroupSatisfied(minSelect: number, selectedCount: number): boolean {
  return selectedCount >= minSelect;
}
