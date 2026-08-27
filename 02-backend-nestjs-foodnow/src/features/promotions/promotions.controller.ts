import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { ValidatePromotionDto } from './dto/validate-promotion.dto';
import { PromotionsService } from './promotions.service';

@Controller('promotions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Post('validate')
  @Roles(Role.CUSTOMER)
  validate(@CurrentUser() user: JwtPayload, @Body() dto: ValidatePromotionDto) {
    return this.promotionsService.validate(user.sub, dto);
  }

  @Post()
  @Roles(Role.VENDOR, Role.ADMIN)
  createPromotion(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.promotionsService.createPromotion(user, dto);
  }
}
