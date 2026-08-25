/**
 * API money fields are decimal strings (e.g. "125000.00") — never parse into
 * Number for arithmetic, only for display formatting.
 */
export function formatMoney(amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}
