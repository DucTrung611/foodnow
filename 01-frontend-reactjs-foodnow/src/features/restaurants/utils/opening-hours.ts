import type { OpeningHours } from '../types/restaurants.types';

const DAY_KEYS: (keyof OpeningHours)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** `Date#getDay()` is 0 (Sun) - 6 (Sat), matching DAY_KEYS order. */
export function getTodayHoursLabel(openingHours: OpeningHours, now: Date = new Date()): string {
  const today = openingHours[DAY_KEYS[now.getDay()]];
  if (!today) return 'Đóng cửa hôm nay';
  return `Hôm nay: ${today.open} - ${today.close}`;
}
