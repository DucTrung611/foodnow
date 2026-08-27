import { JwtPayload } from '../../../shared/types/jwt-payload.type';
import { Role } from '../../../shared/types/role.enum';

type OrderAccessShape = {
  customerId: string;
  driverId: string | null;
  restaurant: { ownerId: string };
};

/** Owner (customer), the order's restaurant owner, the assigned driver, or ADMIN. */
export function hasOrderAccess(
  user: JwtPayload,
  order: OrderAccessShape,
): boolean {
  return (
    user.role === Role.ADMIN ||
    order.customerId === user.sub ||
    order.driverId === user.sub ||
    order.restaurant.ownerId === user.sub
  );
}
