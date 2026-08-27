import { OrderStatus } from '../../../generated/prisma/enums';
import { Role } from '../../../shared/types/role.enum';
import { canAdvance } from '../utils/order-status-transitions.util';

describe('canAdvance', () => {
  describe('VENDOR', () => {
    it.each([
      [OrderStatus.PENDING, OrderStatus.CONFIRMED],
      [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
      [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP],
    ])('allows %s -> %s', (from, to) => {
      expect(canAdvance(Role.VENDOR, from, to)).toBe(true);
    });

    it.each([
      [OrderStatus.READY_FOR_PICKUP, OrderStatus.ON_THE_WAY],
      [OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED],
      [OrderStatus.PENDING, OrderStatus.PREPARING],
      [OrderStatus.PENDING, OrderStatus.CANCELLED],
    ])('rejects %s -> %s (driver stage or skipped step)', (from, to) => {
      expect(canAdvance(Role.VENDOR, from, to)).toBe(false);
    });
  });

  describe('DRIVER', () => {
    it.each([
      [OrderStatus.READY_FOR_PICKUP, OrderStatus.ON_THE_WAY],
      [OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED],
    ])('allows %s -> %s', (from, to) => {
      expect(canAdvance(Role.DRIVER, from, to)).toBe(true);
    });

    it.each([
      [OrderStatus.PENDING, OrderStatus.CONFIRMED],
      [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
      [OrderStatus.ON_THE_WAY, OrderStatus.CANCELLED],
    ])('rejects %s -> %s (vendor stage or cancel)', (from, to) => {
      expect(canAdvance(Role.DRIVER, from, to)).toBe(false);
    });
  });

  describe('ADMIN', () => {
    it.each([
      [OrderStatus.PENDING, OrderStatus.CONFIRMED],
      [OrderStatus.CONFIRMED, OrderStatus.PREPARING],
      [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP],
      [OrderStatus.READY_FOR_PICKUP, OrderStatus.ON_THE_WAY],
      [OrderStatus.ON_THE_WAY, OrderStatus.DELIVERED],
    ])('allows any forward transition %s -> %s', (from, to) => {
      expect(canAdvance(Role.ADMIN, from, to)).toBe(true);
    });

    it('still rejects a transition to CANCELLED (cancel has its own endpoint)', () => {
      expect(
        canAdvance(Role.ADMIN, OrderStatus.PENDING, OrderStatus.CANCELLED),
      ).toBe(false);
    });

    it('rejects an out-of-sequence jump', () => {
      expect(
        canAdvance(Role.ADMIN, OrderStatus.PENDING, OrderStatus.DELIVERED),
      ).toBe(false);
    });
  });

  describe('CUSTOMER', () => {
    it('can never advance a status', () => {
      expect(
        canAdvance(Role.CUSTOMER, OrderStatus.PENDING, OrderStatus.CONFIRMED),
      ).toBe(false);
    });
  });
});
