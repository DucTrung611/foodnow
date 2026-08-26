import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { RestaurantsService } from './restaurants.service';

@Controller('menu-items')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.VENDOR)
export class MenuItemsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Patch(':id')
  updateMenuItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.restaurantsService.updateMenuItem(user.sub, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteMenuItem(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.restaurantsService.deleteMenuItem(user.sub, id);
  }
}
