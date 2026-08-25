import { describe, expect, it } from 'vitest';
import { formatMoney } from './money';

describe('formatMoney', () => {
  it('formats a decimal-string amount as VND currency', () => {
    expect(formatMoney('125000.00')).toContain('125.000');
  });

  it('formats a numeric amount the same way', () => {
    expect(formatMoney(125000)).toContain('125.000');
  });

  it('rounds to whole VND (no fractional currency subunit)', () => {
    expect(formatMoney('99.5')).not.toMatch(/,\d/);
  });
});
