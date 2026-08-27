import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import type { JwtPayload } from '../../shared/types/jwt-payload.type';
import { Role } from '../../shared/types/role.enum';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.CUSTOMER, Role.ADMIN)
  getPaymentById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.paymentsService.getPaymentById(user, id);
  }

  @Post(':id/refund')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  refundPayment(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.paymentsService.refundPayment(id, dto);
  }
}
