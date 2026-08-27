import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { OrdersService } from './orders.service';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CUSTOMER)
export class CartController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  getCart(@CurrentUser() user: JwtPayload) {
    return this.ordersService.getCart(user.sub);
  }

  @Post('items')
  addItem(@CurrentUser() user: JwtPayload, @Body() dto: AddCartItemDto) {
    return this.ordersService.addCartItem(user.sub, dto);
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.ordersService.updateCartItem(user.sub, id, dto);
  }

  @Delete('items/:id')
  removeItem(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.removeCartItem(user.sub, id);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  clearCart(@CurrentUser() user: JwtPayload) {
    return this.ordersService.clearCart(user.sub);
  }
}
