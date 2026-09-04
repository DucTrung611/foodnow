/**
 * API money fields are decimal strings (e.g. "125000.00") - never parse into
 * Number for arithmetic, only for display formatting.
 *
 * Forces a non-breaking space before the currency symbol - the plain space
 * some ICU/browser combinations produce lets the amount and symbol wrap onto
 * separate lines (UX-AUDIT-REPORT.md G8).
 */
const CURRENCY_SYMBOL = '₫'; // dong sign
const NBSP = ' ';

export function formatMoney(amount: string | number): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  const formatted = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
  return formatted.replace(new RegExp(`\\s*${CURRENCY_SYMBOL}`), `${NBSP}${CURRENCY_SYMBOL}`);
}
