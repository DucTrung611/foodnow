import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { DeliveryService } from './delivery.service';

@Controller('deliveries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
export class DeliveriesController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('available')
  listAvailable(@CurrentUser() user: JwtPayload) {
    return this.deliveryService.listAvailableDeliveries(user.sub);
  }

  @Post(':id/accept')
  accept(@CurrentUser() user: JwtPayload, @Param('id') orderId: string) {
    return this.deliveryService.acceptDelivery(user, orderId);
  }

  @Post(':id/pickup')
  pickup(@CurrentUser() user: JwtPayload, @Param('id') orderId: string) {
    return this.deliveryService.confirmPickup(user, orderId);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: JwtPayload, @Param('id') orderId: string) {
    return this.deliveryService.confirmComplete(user, orderId);
  }
}
