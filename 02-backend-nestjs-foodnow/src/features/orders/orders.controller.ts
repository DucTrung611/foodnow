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
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderListQueryDto } from './dto/order-list-query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.CUSTOMER)
  createOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(user.sub, dto);
  }

  /** Same shape as `POST /orders`, minus the write — lets checkout preview
   * delivery fee + total before the customer commits. */
  @Post('quote')
  @UseGuards(RolesGuard)
  @Roles(Role.CUSTOMER)
  quoteOrder(@CurrentUser() user: JwtPayload, @Body() dto: CreateOrderDto) {
    return this.ordersService.quoteOrder(user.sub, dto);
  }

  @Get()
  listOrders(
    @CurrentUser() user: JwtPayload,
    @Query() query: OrderListQueryDto,
  ) {
    return this.ordersService.listOrders(user, query);
  }

  @Get(':id')
  getOrderById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.ordersService.getOrderById(user, id);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(Role.VENDOR, Role.DRIVER, Role.ADMIN)
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(user, id, dto);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(Role.CUSTOMER, Role.ADMIN)
  cancelOrder(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrder(user, id, dto);
  }
}
