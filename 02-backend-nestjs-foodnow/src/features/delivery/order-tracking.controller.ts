import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { DeliveryService } from './delivery.service';

/**
 * Lives in `delivery` despite the `/orders` URL prefix — tracking reads
 * delivery-owned data (`driver_locations`), not anything `orders` owns.
 * Ownership check (CUSTOMER must be the order's owner) happens in the
 * service; the role guard here only narrows to CUSTOMER/ADMIN.
 */
@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER, Role.ADMIN)
export class OrderTrackingController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get(':id/tracking')
  getTracking(@CurrentUser() user: JwtPayload, @Param('id') orderId: string) {
    return this.deliveryService.getTracking(user, orderId);
  }
}
