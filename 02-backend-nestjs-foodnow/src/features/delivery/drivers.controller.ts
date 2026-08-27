import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { DeliveryService } from './delivery.service';
import { PushLocationDto } from './dto/push-location.dto';
import { SetAvailabilityDto } from './dto/set-availability.dto';

@Controller('drivers/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
export class DriversController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Patch('availability')
  setAvailability(
    @CurrentUser() user: JwtPayload,
    @Body() dto: SetAvailabilityDto,
  ) {
    return this.deliveryService.setAvailability(user.sub, dto.isAvailable);
  }

  @Post('locations')
  pushLocation(@CurrentUser() user: JwtPayload, @Body() dto: PushLocationDto) {
    return this.deliveryService.pushLocation(user.sub, dto);
  }
}
