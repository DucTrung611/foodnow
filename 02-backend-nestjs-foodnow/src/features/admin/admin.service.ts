import { Injectable } from '@nestjs/common';
import { PaginatedResult } from '../../shared/types/paginated-result.type';
import { OrderResponseDto } from '../orders/dto/order-response.dto';
import { OrdersService } from '../orders/orders.service';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';
import { AdminOrderListQueryDto } from './dto/admin-order-list-query.dto';
import { AdminUserListQueryDto } from './dto/admin-user-list-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  updateUserStatus(
    userId: string,
    dto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateStatus(userId, dto.status);
  }

  listOrders(
    query: AdminOrderListQueryDto,
  ): Promise<PaginatedResult<OrderResponseDto>> {
    return this.ordersService.listForAdmin(query);
  }

  listUsers(
    query: AdminUserListQueryDto,
  ): Promise<PaginatedResult<UserResponseDto>> {
    return this.usersService.listUsers(query);
  }
}
