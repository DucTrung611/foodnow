import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { RestaurantSearchQueryDto } from './dto/restaurant-search-query.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { RestaurantsService } from './restaurants.service';

@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Get()
  search(@Query() query: RestaurantSearchQueryDto) {
    return this.restaurantsService.search(query);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.restaurantsService.getById(id);
  }

  @Get(':id/menu')
  getMenu(@Param('id') id: string) {
    return this.restaurantsService.getMenu(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  createRestaurant(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRestaurantDto,
  ) {
    return this.restaurantsService.createRestaurant(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  updateRestaurant(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
  ) {
    return this.restaurantsService.updateRestaurant(user.sub, id, dto);
  }

  @Post(':id/categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  createCategory(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.restaurantsService.createCategory(user.sub, id, dto);
  }

  @Post(':id/menu-items')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.VENDOR)
  createMenuItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CreateMenuItemDto,
  ) {
    return this.restaurantsService.createMenuItem(user.sub, id, dto);
  }
}
