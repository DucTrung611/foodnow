import { generateOrderCode } from '../utils/order-code.util';

describe('generateOrderCode', () => {
  it('formats as FN-YYMMDD-XXXX', () => {
    const code = generateOrderCode(new Date(2026, 7, 24, 10, 30));
    expect(code).toMatch(/^FN-260824-\d{4}$/);
  });

  it('pads a single-digit month and day', () => {
    const code = generateOrderCode(new Date(2026, 0, 5));
    expect(code).toMatch(/^FN-260105-\d{4}$/);
  });

  it('produces different suffixes across calls (non-deterministic)', () => {
    const codes = new Set(
      Array.from({ length: 20 }, () => generateOrderCode()),
    );
    expect(codes.size).toBeGreaterThan(1);
  });
});
