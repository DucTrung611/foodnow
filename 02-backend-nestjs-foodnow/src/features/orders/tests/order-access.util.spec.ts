import { Role } from '../../../shared/types/role.enum';
import { hasOrderAccess } from '../utils/order-access.util';

const order = {
  customerId: 'customer-1',
  driverId: 'driver-1',
  restaurant: { ownerId: 'owner-1' },
};

describe('hasOrderAccess', () => {
  it('allows the owning customer', () => {
    expect(
      hasOrderAccess({ sub: 'customer-1', role: Role.CUSTOMER }, order),
    ).toBe(true);
  });

  it('allows the restaurant owner', () => {
    expect(hasOrderAccess({ sub: 'owner-1', role: Role.VENDOR }, order)).toBe(
      true,
    );
  });

  it('allows the assigned driver', () => {
    expect(hasOrderAccess({ sub: 'driver-1', role: Role.DRIVER }, order)).toBe(
      true,
    );
  });

  it('allows ADMIN regardless of identity', () => {
    expect(
      hasOrderAccess({ sub: 'someone-else', role: Role.ADMIN }, order),
    ).toBe(true);
  });

  it('rejects an unrelated customer, vendor, or driver', () => {
    expect(
      hasOrderAccess({ sub: 'stranger', role: Role.CUSTOMER }, order),
    ).toBe(false);
    expect(hasOrderAccess({ sub: 'stranger', role: Role.VENDOR }, order)).toBe(
      false,
    );
    expect(hasOrderAccess({ sub: 'stranger', role: Role.DRIVER }, order)).toBe(
      false,
    );
  });

  it('rejects when there is no assigned driver yet', () => {
    expect(
      hasOrderAccess(
        { sub: 'driver-2', role: Role.DRIVER },
        { ...order, driverId: null },
      ),
    ).toBe(false);
  });
});
