import { DayOfWeek, OpeningHours } from '../types/restaurants.types';

const DAYS: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidTimeRange(
  value: unknown,
): value is { open: string; close: string } {
  if (typeof value !== 'object' || value === null) return false;
  const { open, close } = value as Record<string, unknown>;
  return (
    typeof open === 'string' &&
    typeof close === 'string' &&
    TIME_PATTERN.test(open) &&
    TIME_PATTERN.test(close) &&
    open < close
  );
}

export function isValidOpeningHours(value: unknown): value is OpeningHours {
  if (typeof value !== 'object' || value === null) return false;
  return DAYS.every((day) => {
    const entry = (value as Record<string, unknown>)[day];
    return entry === null || isValidTimeRange(entry);
  });
}

export function isRestaurantOpen(
  openingHours: OpeningHours,
  now: Date = new Date(),
): boolean {
  const today = DAYS[now.getDay()];
  const entry = openingHours[today];
  if (!entry) return false;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = entry.open.split(':').map(Number);
  const [closeH, closeM] = entry.close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}
