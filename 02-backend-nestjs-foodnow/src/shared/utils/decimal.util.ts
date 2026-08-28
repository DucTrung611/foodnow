type DecimalLike = { toFixed: (decimalPlaces: number) => string };

function isDecimalLike(value: unknown): value is DecimalLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as DecimalLike).toFixed === 'function'
  );
}

/**
 * Formats a Prisma `Decimal` (or a raw string/number) as a fixed-scale
 * string, per API_SPEC.md §1 ("Money: decimal string, never float") and
 * DATABASE.md's `@db.Decimal(_, 2)` convention — every Decimal column in
 * this schema uses scale 2. Never round-trip a Decimal through
 * `String()`/`.toString()` directly: decimal.js drops trailing zeros
 * (`"55000.00"` becomes `"55000"`), silently breaking the API contract.
 */
export function formatDecimal(value: unknown, decimalPlaces = 2): string {
  if (isDecimalLike(value)) return value.toFixed(decimalPlaces);
  return Number(value).toFixed(decimalPlaces);
}
