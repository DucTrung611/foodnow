import {
  isRestaurantOpen,
  isValidOpeningHours,
} from '../utils/opening-hours.util';
import { OpeningHours } from '../types/restaurants.types';

const FULL_WEEK_CLOSED: OpeningHours = {
  mon: null,
  tue: null,
  wed: null,
  thu: null,
  fri: null,
  sat: null,
  sun: null,
};

describe('isValidOpeningHours', () => {
  it('accepts a full week with mixed open days and closed (null) days', () => {
    const value: OpeningHours = {
      ...FULL_WEEK_CLOSED,
      mon: { open: '08:00', close: '22:00' },
    };
    expect(isValidOpeningHours(value)).toBe(true);
  });

  it('rejects a missing day key', () => {
    const rest: Partial<OpeningHours> = { ...FULL_WEEK_CLOSED };
    delete rest.mon;
    expect(isValidOpeningHours(rest)).toBe(false);
  });

  it('rejects an open time that is not before the close time', () => {
    const value = {
      ...FULL_WEEK_CLOSED,
      mon: { open: '22:00', close: '08:00' },
    };
    expect(isValidOpeningHours(value)).toBe(false);
  });

  it('rejects a malformed time string', () => {
    const value = {
      ...FULL_WEEK_CLOSED,
      mon: { open: '25:00', close: '22:00' },
    };
    expect(isValidOpeningHours(value)).toBe(false);
  });

  it('rejects non-object input', () => {
    expect(isValidOpeningHours(null)).toBe(false);
    expect(isValidOpeningHours('nope')).toBe(false);
  });
});

describe('isRestaurantOpen', () => {
  it('returns false when today is a closed (null) day', () => {
    const now = new Date('2026-08-24T10:00:00'); // Monday
    expect(isRestaurantOpen(FULL_WEEK_CLOSED, now)).toBe(false);
  });

  it("returns true when now falls inside today's open range", () => {
    const openingHours: OpeningHours = {
      ...FULL_WEEK_CLOSED,
      mon: { open: '08:00', close: '22:00' },
    };
    const now = new Date('2026-08-24T10:00:00'); // Monday 10:00
    expect(isRestaurantOpen(openingHours, now)).toBe(true);
  });

  it('returns false when now is before opening or at/after closing', () => {
    const openingHours: OpeningHours = {
      ...FULL_WEEK_CLOSED,
      mon: { open: '08:00', close: '22:00' },
    };
    expect(
      isRestaurantOpen(openingHours, new Date('2026-08-24T07:59:00')),
    ).toBe(false);
    expect(
      isRestaurantOpen(openingHours, new Date('2026-08-24T22:00:00')),
    ).toBe(false);
  });
});
