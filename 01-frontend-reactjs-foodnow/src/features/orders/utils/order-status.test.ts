import { describe, expect, it } from 'vitest';
import { ORDER_STATUS_LABELS, ORDER_STATUS_SEQUENCE, nextStatusInSequence } from './order-status';

describe('nextStatusInSequence', () => {
  it('returns the following status in the display sequence', () => {
    expect(nextStatusInSequence('PENDING')).toBe('CONFIRMED');
    expect(nextStatusInSequence('CONFIRMED')).toBe('PREPARING');
  });

  it('returns null after the last status in the sequence', () => {
    expect(nextStatusInSequence('DELIVERED')).toBeNull();
  });

  it('returns null for CANCELLED, which sits outside the sequence', () => {
    expect(nextStatusInSequence('CANCELLED')).toBeNull();
  });

  it('every status in the sequence has a Vietnamese label', () => {
    for (const status of ORDER_STATUS_SEQUENCE) {
      expect(ORDER_STATUS_LABELS[status]).toBeTruthy();
    }
  });
});
