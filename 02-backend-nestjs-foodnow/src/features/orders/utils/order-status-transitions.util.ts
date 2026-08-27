import { OrderStatus } from '../../../generated/prisma/enums';
import { Role } from '../../../shared/types/role.enum';

type Transition = { from: OrderStatus; to: OrderStatus; role: Role };

/**
 * Stage-scoped: VENDOR drives the kitchen steps, DRIVER drives the delivery
 * steps. CANCELLED is deliberately absent — it only ever happens via the
 * dedicated cancel endpoint, never a "status advance".
 *
 * NOTE: DRIVER transitions don't yet check `order.driverId === caller` since
 * the `delivery` feature's driver-assignment isn't implemented — any
 * authenticated DRIVER can currently advance these two steps for any order.
 * Tighten once `delivery` assigns drivers to orders.
 */
const TRANSITIONS: Transition[] = [
  { from: OrderStatus.PENDING, to: OrderStatus.CONFIRMED, role: Role.VENDOR },
  { from: OrderStatus.CONFIRMED, to: OrderStatus.PREPARING, role: Role.VENDOR },
  {
    from: OrderStatus.PREPARING,
    to: OrderStatus.READY_FOR_PICKUP,
    role: Role.VENDOR,
  },
  {
    from: OrderStatus.READY_FOR_PICKUP,
    to: OrderStatus.ON_THE_WAY,
    role: Role.DRIVER,
  },
  {
    from: OrderStatus.ON_THE_WAY,
    to: OrderStatus.DELIVERED,
    role: Role.DRIVER,
  },
];

/** ADMIN may perform any of the forward transitions above; VENDOR/DRIVER are stage-scoped. */
export function canAdvance(
  role: Role,
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return TRANSITIONS.some(
    (t) =>
      t.from === from &&
      t.to === to &&
      (role === Role.ADMIN || t.role === role),
  );
}
