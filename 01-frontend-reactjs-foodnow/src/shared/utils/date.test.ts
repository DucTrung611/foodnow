import { describe, expect, it, vi } from 'vitest';
import { formatDateTime, formatRelativeTime } from './date';

describe('formatDateTime', () => {
  it('renders a 4-digit year, never a 2-digit one', () => {
    expect(formatDateTime('2026-08-24T10:30:00.000Z')).toContain('2026');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-08-24T12:00:00.000Z');

  it('shows "vừa xong" for under a minute', () => {
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 10_000).toISOString())).toBe('vừa xong');
    vi.useRealTimers();
  });

  it('shows minutes for under an hour', () => {
    vi.setSystemTime(now);
    expect(formatRelativeTime(new Date(now.getTime() - 35 * 60_000).toISOString())).toBe('35 phút trước');
    vi.useRealTimers();
  });

  it('falls back to the absolute (4-digit-year) date after 24h', () => {
    vi.setSystemTime(now);
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60_000).toISOString();
    expect(formatRelativeTime(twoDaysAgo)).toBe(formatDateTime(twoDaysAgo));
    vi.useRealTimers();
  });
});
