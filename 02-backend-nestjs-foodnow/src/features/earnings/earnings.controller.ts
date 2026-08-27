import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { EarningsQueryDto } from './dto/earnings-query.dto';
import { EarningsService } from './earnings.service';

@Controller('drivers/me')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.DRIVER)
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('earnings')
  getSummary(
    @CurrentUser() user: JwtPayload,
    @Query() query: EarningsQueryDto,
  ) {
    return this.earningsService.getSummary(user.sub, query.limit);
  }
}
