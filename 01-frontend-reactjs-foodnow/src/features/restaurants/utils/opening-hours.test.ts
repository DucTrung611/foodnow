import { describe, expect, it } from 'vitest';
import { getTodayHoursLabel } from './opening-hours';
import type { OpeningHours } from '../types/restaurants.types';

const HOURS: OpeningHours = {
  mon: { open: '07:00', close: '21:00' },
  tue: { open: '07:00', close: '21:00' },
  wed: { open: '07:00', close: '21:00' },
  thu: { open: '07:00', close: '21:00' },
  fri: { open: '07:00', close: '21:00' },
  sat: { open: '08:00', close: '22:00' },
  sun: null,
};

describe('getTodayHoursLabel', () => {
  it('shows the closed message when today has no hours', () => {
    // Local-time constructor (not a UTC ISO string) so `.getDay()` doesn't
    // depend on the test runner's timezone.
    const sunday = new Date(2026, 7, 30, 10, 0); // 2026-08-30, a Sunday
    expect(getTodayHoursLabel(HOURS, sunday)).toBe('Đóng cửa hôm nay');
  });

  it("shows today's open/close range otherwise", () => {
    const saturday = new Date(2026, 7, 29, 10, 0); // 2026-08-29, a Saturday
    expect(getTodayHoursLabel(HOURS, saturday)).toBe('Hôm nay: 08:00 - 22:00');
  });
});
