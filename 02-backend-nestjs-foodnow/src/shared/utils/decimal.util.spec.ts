import { formatDecimal } from './decimal.util';

describe('formatDecimal', () => {
  it('preserves trailing zeros on a Prisma Decimal-like value (has .toFixed)', () => {
    const decimalLike = { toFixed: (dp: number) => (55000).toFixed(dp) };
    expect(formatDecimal(decimalLike)).toBe('55000.00');
  });

  it('formats a plain string amount to 2 decimal places', () => {
    expect(formatDecimal('55000')).toBe('55000.00');
  });

  it('formats a plain number amount to 2 decimal places', () => {
    expect(formatDecimal(125000)).toBe('125000.00');
  });

  it('rounds a value that already has more precision than the target scale', () => {
    expect(formatDecimal('99.999')).toBe('100.00');
  });

  it('supports a non-default decimal-places argument (e.g. distance in km)', () => {
    expect(formatDecimal('3.5', 2)).toBe('3.50');
  });
});
