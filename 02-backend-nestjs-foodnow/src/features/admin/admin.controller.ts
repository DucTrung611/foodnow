import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Role } from '../../shared/types/role.enum';
import { AdminService } from './admin.service';
import { AdminOrderListQueryDto } from './dto/admin-order-list-query.dto';
import { AdminUserListQueryDto } from './dto/admin-user-list-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('orders')
  listOrders(@Query() query: AdminOrderListQueryDto) {
    return this.adminService.listOrders(query);
  }

  @Get('users')
  listUsers(@Query() query: AdminUserListQueryDto) {
    return this.adminService.listUsers(query);
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto);
  }
}
