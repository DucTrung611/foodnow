export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type OpeningHours = Record<
  DayOfWeek,
  { open: string; close: string } | null
>;
