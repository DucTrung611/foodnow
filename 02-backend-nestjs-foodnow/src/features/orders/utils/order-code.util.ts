function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

export function generateOrderCode(now: Date = new Date()): string {
  const yy = pad(now.getFullYear() % 100, 2);
  const mm = pad(now.getMonth() + 1, 2);
  const dd = pad(now.getDate(), 2);
  const suffix = pad(Math.floor(Math.random() * 10000), 4);
  return `FN-${yy}${mm}${dd}-${suffix}`;
}
